import { db } from "@/db/client";
import { videos, athleteMentions } from "@/db/schema";
import { eq, desc, not, sql, isNull, or } from "drizzle-orm";
import {
	processContentBatch,
	processContentAthletes,
} from "@/lib/services/athlete-service";

// Parse command line arguments
const args = process.argv.slice(2);

// Parse flags
const isDebug = args.includes("--debug");

// Parse parameters with values (like --limit=50)
const parseParam = (prefix: string, defaultValue: number): number => {
	const param = args.find((arg) => arg.startsWith(prefix));
	if (!param) return defaultValue;

	const value = param.split("=")[1];
	if (!value) return defaultValue;

	const parsed = Number(value);
	return Number.isNaN(parsed) ? defaultValue : parsed;
};

// Get options
const options = {
	limit: parseParam("--limit=", 100),
	maxAgeHours: parseParam("--hours=", 24),
};

// Filter out all flags and parameters to identify a potential videoId
const nonOptionArgs = args.filter(
	(arg) =>
		!arg.startsWith("--debug") &&
		!arg.startsWith("--limit=") &&
		!arg.startsWith("--hours="),
);

// The first non-option argument is the videoId (if provided)
const videoId = nonOptionArgs.length > 0 ? nonOptionArgs[0] : null;

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
	if (isDebug) {
		console.log("Debug mode enabled - will show detailed logging");
	}

	console.log("Options:", options);

	// First, let's check for unprocessed videos
	countRemainingVideos().then((count) => {
		console.log(`Found ${count} unprocessed videos in database`);
	});

	processContentBatch({
		contentType: "video",
		limit: options.limit,
		maxAgeHours: options.maxAgeHours,
		debug: isDebug,
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

	if (isDebug) {
		// If we're debugging, also check for videos with athlete mentions to confirm processing worked
		const [mentionsResult] = await db
			.select({
				count: sql<number>`COUNT(DISTINCT content_id)`,
			})
			.from(athleteMentions)
			.where(eq(athleteMentions.contentType, "video"));

		console.log(
			`Videos with athlete mentions in DB: ${mentionsResult?.count || 0}`,
		);
	}

	return totalVideos - processedCount;
}
