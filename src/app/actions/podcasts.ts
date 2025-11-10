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
import { eq, inArray, sql } from "drizzle-orm";
import { optimizeImage } from "@/lib/server/image-processing";

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

			const addedPodcast = result.podcast;

			// Extract vibrant color if we have an image
			if (addedPodcast.image) {
				// Don't await this, let it run in the background
				updatePodcastColors(addedPodcast.id, addedPodcast.image);
			}

			// Optimize and update the podcast image
			if (addedPodcast.image) {
				console.log(
					`Optimizing image for podcast ${addedPodcast.id}: ${addedPodcast.image}`,
				);
				try {
					const optimizedUrl = await optimizeImage(
						addedPodcast.image,
						1400,
						"podcasts",
						addedPodcast.id,
					);

					if (optimizedUrl) {
						console.log(
							`Updating podcast ${addedPodcast.id} with optimized image: ${optimizedUrl}`,
						);
						await db
							.update(podcasts)
							.set({
								podcastImage: optimizedUrl,
								updatedAt: sql`CURRENT_TIMESTAMP`, // Update timestamp as well
							})
							.where(eq(podcasts.id, addedPodcast.id));
						addedPodcast.podcastImage = optimizedUrl; // Update the object for success message
					} else {
						console.warn(
							`Failed to optimize image for podcast ${addedPodcast.id}`,
						);
					}
				} catch (optError) {
					console.error(
						`Error during image optimization for podcast ${addedPodcast.id}:`,
						optError,
					);
					// Continue even if optimization fails
				}
			}

			// Make sure we have a valid slug before redirecting
			if (!addedPodcast.podcastSlug) {
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
				data: addedPodcast, // Use the updated podcast object
				redirect: `/podcasts/${addedPodcast.podcastSlug}`,
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
