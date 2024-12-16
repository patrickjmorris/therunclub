"use server";

import { z } from "zod";
import { addNewPodcast } from "@/lib/podcast-service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AddPodcastState } from "./types";
import { addPodcastSchema } from "./validation";
import { updatePodcastColors } from "@/lib/update-podcast-colors";

export async function addPodcast(
	prevState: AddPodcastState,
	formData: FormData,
): Promise<AddPodcastState> {
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
			try {
				await updatePodcastColors(result.podcast.id, result.podcast.image);
			} catch (colorError) {
				console.error("Failed to extract vibrant color:", colorError);
				// Continue even if color extraction fails
			}
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
}
