"use server";

import { addNewPodcast } from "@/lib/podcast-service";
import { revalidatePath } from "next/cache";
import { type PodcastSearchResult } from "@/lib/podcast-index";
import { addPodcastSchema } from "./validation";
import type { AddPodcastState } from "./types";
import { requireRole, AuthError } from "@/lib/auth-utils";
import { updatePodcastColors } from "@/lib/update-podcast-colors";

export const addPodcast = requireRole(["admin", "editor"])(
	async (
		_prevState: AddPodcastState,
		formData: FormData,
	): Promise<AddPodcastState> => {
		const validatedFields = addPodcastSchema.safeParse({
			feedUrl: formData.get("feedUrl"),
		});

		if (!validatedFields.success) {
			return {
				errors: validatedFields.error.flatten().fieldErrors,
				message: "Invalid feed URL",
			};
		}

		try {
			const result = await addNewPodcast(validatedFields.data.feedUrl);

			if (!result.success || !result.podcast) {
				return {
					errors: {
						_form: [result.error || "Failed to add podcast"],
					},
					message: "Failed to add podcast",
				};
			}

			// Extract vibrant color if we have an image
			if (result.podcast.image) {
				await updatePodcastColors(result.podcast.id, result.podcast.image);
			}

			// Make sure we have a valid slug before redirecting
			if (!result.podcast.podcastSlug) {
				return {
					errors: {
						_form: ["Invalid podcast slug"],
					},
					message: "Failed to generate podcast URL",
				};
			}

			revalidatePath("/podcasts");

			// Return success state before redirecting
			const successState: AddPodcastState = {
				message: "Podcast added successfully!",
				data: result.podcast,
				redirect: `/podcasts/${result.podcast.podcastSlug}`,
			};

			return successState;
		} catch (error) {
			console.error("Error adding podcast:", error);
			return {
				errors: {
					_form: ["An unexpected error occurred"],
				},
				message: "An unexpected error occurred",
			};
		}
	},
);
