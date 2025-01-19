import { db } from "@/db/client";
import { episodes } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import athleteDetectionQueue from "./worker";

async function queueEpisodes() {
	console.log("Starting to queue episodes for athlete detection...");

	// First check total episodes
	const totalEpisodes = await db
		.select({ count: sql<number>`count(*)` })
		.from(episodes);

	console.log(`Total episodes in database: ${totalEpisodes[0].count}`);

	// Check processed status
	const processedStatus = await db
		.select({
			status: episodes.athleteMentionsProcessed,
			count: sql<number>`count(*)`,
		})
		.from(episodes)
		.groupBy(episodes.athleteMentionsProcessed);

	console.log("\nCurrent processing status:");
	for (const { status, count } of processedStatus) {
		console.log(`- ${status === true ? "Processed" : "Unprocessed"}: ${count}`);
	}

	// Get all unprocessed episodes
	const unprocessedEpisodes = await db
		.select({
			id: episodes.id,
			title: episodes.title,
		})
		.from(episodes)
		.where(sql`${episodes.athleteMentionsProcessed} IS NOT true`)
		.orderBy(desc(episodes.pubDate));

	console.log(`\nFound ${unprocessedEpisodes.length} episodes to queue`);

	// Add each episode to the queue
	let queued = 0;
	for (const episode of unprocessedEpisodes) {
		await athleteDetectionQueue.add(
			{ episodeId: episode.id },
			{
				attempts: 3,
				backoff: {
					type: "exponential",
					delay: 1000,
				},
				removeOnComplete: true,
				removeOnFail: false,
			},
		);
		queued++;
		if (queued % 100 === 0) {
			console.log(`Queued ${queued} episodes...`);
		}
	}

	console.log("\nQueuing complete!");
	console.log(`- Episodes queued: ${queued}`);

	// Get queue status
	const [waiting, active, completed, failed, delayed] = await Promise.all([
		athleteDetectionQueue.getWaitingCount(),
		athleteDetectionQueue.getActiveCount(),
		athleteDetectionQueue.getCompletedCount(),
		athleteDetectionQueue.getFailedCount(),
		athleteDetectionQueue.getDelayedCount(),
	]);

	console.log("\nQueue status:");
	console.log(`- Waiting: ${waiting}`);
	console.log(`- Active: ${active}`);
	console.log(`- Completed: ${completed}`);
	console.log(`- Failed: ${failed}`);
	console.log(`- Delayed: ${delayed}`);

	// Close the queue
	await athleteDetectionQueue.close();
}

// Run the queuing process
queueEpisodes().catch((error) => {
	console.error("Error queuing episodes:", error);
	process.exit(1);
});
