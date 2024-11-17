import { db } from "@/db";
import { podcasts } from "@/db/schema";
import { eq } from "drizzle-orm";

import { extractVibrantColors } from "./extract-vibrant-colors";

export async function updatePodcastColors(podcastId: string, imageUrl: string) {
	try {
		// Extract just the vibrant color
		const vibrantColor = await extractVibrantColors(imageUrl);

		// Update the podcast record with the vibrant color
		await db
			.update(podcasts)
			.set({
				vibrantColor: vibrantColor,
			})
			.where(eq(podcasts.id, podcastId));

		return vibrantColor;
	} catch (error) {
		console.error("Error updating podcast colors:", error);
		return null;
	}
}
