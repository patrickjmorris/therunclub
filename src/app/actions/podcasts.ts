"use server";

import { addNewPodcast } from "@/lib/podcast-service";
import { revalidatePath, revalidateTag } from "next/cache";
import { addPodcastSchema } from "./validation";
import type { AddPodcastState } from "./types";
import { requireRole } from "@/lib/auth-utils";
import { updatePodcastColors } from "@/lib/server/update-podcast-colors";
import { revalidatePodcastsAndEpisodes } from "@/db/queries";
import { db } from "@/db/client";
import { podcasts } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

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

			// Revalidate all podcast-related caches
			revalidatePodcastsAndEpisodes(); // This revalidates both "podcasts" and "episodes" tags
			revalidateTag("podcast-by-slug"); // Specifically revalidate the podcast detail page cache
			revalidateTag("podcast"); // Revalidate any other podcast-related caches
			revalidateTag("all-podcasts-with-last-episodes"); // Revalidate the podcasts list cache
			revalidatePath("/podcasts"); // Also revalidate the podcasts page path

			// Add a small delay to ensure cache revalidation has time to propagate
			await new Promise((resolve) => setTimeout(resolve, 500));

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

export async function deletePodcast(id: string) {
	return requireRole(["admin", "editor"])(async () => {
		await db.delete(podcasts).where(eq(podcasts.id, id));
		revalidatePath("/dashboard/podcasts");
		revalidatePath("/podcasts");
		return { success: true };
	})();
}

export async function bulkDeletePodcasts(ids: string[]) {
	return requireRole(["admin", "editor"])(async () => {
		await db.delete(podcasts).where(inArray(podcasts.id, ids));
		revalidatePath("/dashboard/podcasts");
		revalidatePath("/podcasts");
		return { success: true };
	})();
}

export async function getAllPodcastsForManagement() {
	return requireRole(["admin", "editor"])(async () => {
		const allPodcasts = await db.select().from(podcasts);
		return allPodcasts;
	})();
}
