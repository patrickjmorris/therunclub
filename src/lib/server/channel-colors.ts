import "server-only";
import { db, client } from "@/db/client";
import { channels } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { extractVibrantColors } from "./extract-vibrant-colors";

/**
 * Updates the vibrant color for a single channel
 */
export async function updateChannelColor(
	channelId: string,
	thumbnailUrl: string,
) {
	try {
		const vibrantColor = await extractVibrantColors(thumbnailUrl);

		if (vibrantColor) {
			await db
				.update(channels)
				.set({ vibrantColor })
				.where(eq(channels.id, channelId));

			return vibrantColor;
		}
	} catch (error) {
		console.error("Error updating channel color:", error);
	}

	return null;
}

/**
 * Updates vibrant colors for all channels that don't have one
 */
export async function updateChannelColors() {
	console.log("Starting channel color update...");

	// Log the database host
	console.log("Updating database:", client.options.host);

	// Get all channels that need color updates
	const channelsToUpdate = await db
		.select({
			id: channels.id,
			title: channels.title,
			thumbnailUrl: channels.thumbnailUrl,
			vibrantColor: channels.vibrantColor,
		})
		.from(channels)
		.where(isNull(channels.vibrantColor));

	console.log(
		`Found ${channelsToUpdate.length} channels that need color updates`,
	);

	let successCount = 0;
	let errorCount = 0;
	let skippedCount = 0;

	// Process channels sequentially with progress tracking
	for (const [index, channel] of channelsToUpdate.entries()) {
		try {
			if (!channel.thumbnailUrl) {
				console.log(
					`[${index + 1}/${channelsToUpdate.length}] Skipping channel ${
						channel.title
					} - no thumbnail URL`,
				);
				skippedCount++;
				continue;
			}

			console.log(
				`[${index + 1}/${channelsToUpdate.length}] Processing channel: ${
					channel.title
				}`,
			);

			const vibrantColor = await updateChannelColor(
				channel.id,
				channel.thumbnailUrl,
			);

			if (vibrantColor) {
				console.log(
					`[${index + 1}/${channelsToUpdate.length}] Updated channel ${
						channel.title
					} with color ${vibrantColor}`,
				);
				successCount++;
			} else {
				console.log(
					`[${index + 1}/${
						channelsToUpdate.length
					}] No vibrant color found for channel ${channel.title}`,
				);
				skippedCount++;
			}
		} catch (error) {
			console.error(
				`[${index + 1}/${channelsToUpdate.length}] Error processing channel ${
					channel.title
				}:`,
				error,
			);
			errorCount++;
		}
	}

	// Print summary
	console.log("\nChannel color update complete!");
	console.log("Summary:");
	console.log(`- Total channels processed: ${channelsToUpdate.length}`);
	console.log(`- Successfully updated: ${successCount}`);
	console.log(`- Errors: ${errorCount}`);
	console.log(`- Skipped: ${skippedCount}`);

	// Return the results
	return {
		total: channelsToUpdate.length,
		updated: successCount,
		skipped: skippedCount,
		failed: errorCount,
	};
}
