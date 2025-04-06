import { db } from "@/db/client";
import { videos, athleteMentions } from "@/db/schema";
import { eq, desc, not, sql } from "drizzle-orm";
import {
	processContentBatch,
	processContentAthletes,
} from "@/lib/services/athlete-service";

// Determine if we're processing a single video or a batch
const videoId = process.argv[2];

if (videoId) {
	// Process a single video
	console.log(`Processing athlete mentions for video: ${videoId}`);

	processContentAthletes(videoId, "video")
		.then((result) => {
			console.log("\nProcessing complete!");
			console.log(`- Title matches: ${result.titleMatches}`);
			console.log(`- Description matches: ${result.contentMatches}`);
			process.exit(0);
		})
		.catch((error) => {
			console.error("Error:", error);
			process.exit(1);
		});
} else {
	// Process a batch of videos
	console.log("Starting batch processing of video athlete mentions...");

	// Get command line options
	const options = {
		limit: Number(
			process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ||
				100,
		),
		minHoursSinceUpdate: Number(
			process.argv.find((arg) => arg.startsWith("--hours="))?.split("=")[1] ||
				24,
		),
	};

	console.log("Options:", options);

	processContentBatch({
		contentType: "video",
		limit: options.limit,
		minHoursSinceUpdate: options.minHoursSinceUpdate,
	})
		.then((results) => {
			console.log("\nBatch processing complete!");
			console.log(`- Videos processed: ${results.processed}`);
			console.log(`- Errors encountered: ${results.errors}`);
			console.log(`- Success rate: ${results.successRate}`);
			console.log(`- Total athlete matches: ${results.athleteMatches.total}`);
			console.log(`  - In titles: ${results.athleteMatches.title}`);
			console.log(`  - In descriptions: ${results.athleteMatches.content}`);

			// Check remaining videos
			return countRemainingVideos();
		})
		.then((remaining) => {
			if (remaining > 0) {
				console.log(`\nRemaining videos to process: ${remaining}`);
				console.log("Run the script again to process the next batch.");
			} else {
				console.log("\nAll videos have been processed!");
			}
			process.exit(0);
		})
		.catch((error) => {
			console.error("Error:", error);
			process.exit(1);
		});
}

// Helper function to count videos that still need processing
async function countRemainingVideos() {
	// First check total videos
	const [totalResult] = await db
		.select({ count: sql<number>`count(*)` })
		.from(videos);

	const totalVideos = totalResult?.count || 0;

	// Check processed status using athleteMentionsProcessed field
	const [processedResult] = await db
		.select({
			count: sql<number>`COUNT(*)`,
		})
		.from(videos)
		.where(eq(videos.athleteMentionsProcessed, true));

	const processedCount = processedResult?.count || 0;
	return totalVideos - processedCount;
}
