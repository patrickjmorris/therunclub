import { db } from "@/db";
import { podcasts } from "@/db/schema";
import { updatePodcastColors } from "@/lib/update-podcast-colors";
import { isNotNull } from "drizzle-orm";

export async function updateAllPodcastColors() {
	try {
		// Get all podcasts with images
		const allPodcasts = await db
			.select({
				id: podcasts.id,
				image: podcasts.image,
			})
			.from(podcasts)
			.where(isNotNull(podcasts.image));

		console.log(`Found ${allPodcasts.length} podcasts to update`);

		// Update colors for each podcast
		for (const podcast of allPodcasts) {
			if (podcast.image) {
				try {
					console.log(`Updating colors for podcast ${podcast.id}`);
					await updatePodcastColors(podcast.id, podcast.image);
					console.log(`Successfully updated colors for podcast ${podcast.id}`);
				} catch (error) {
					console.error(`Error updating podcast ${podcast.id}:`, error);
				}
			}
		}

		console.log("Finished updating podcast colors");
	} catch (error) {
		console.error("Error updating podcast colors:", error);
		process.exit(1);
	}
}

// Execute the function
updateAllPodcastColors()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
