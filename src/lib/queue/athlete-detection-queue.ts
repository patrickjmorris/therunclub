import Queue from "bull";
import {
	processEpisodeAthletes,
	getProcessingStats,
} from "../athlete-detection";
import { db } from "@/db/client";
import { episodes } from "@/db/schema";
import { and, desc, eq, not, sql } from "drizzle-orm";

// Create a new queue instance
const athleteDetectionQueue = new Queue(
	"athlete-detection",
	process.env.REDIS_URL || "redis://localhost:6379",
);

// Process jobs one at a time
athleteDetectionQueue.process(async (job) => {
	const { episodeId } = job.data;

	try {
		const result = await processEpisodeAthletes(episodeId);
		return { success: true, ...result };
	} catch (error) {
		console.error(`Error processing episode ${episodeId}:`, error);
		return { success: false, error: (error as Error).message };
	}
});

// Add monitoring
athleteDetectionQueue.on("completed", (job, result) => {
	console.log(`✅ Processed episode ${job.data.episodeId}:`, result);
});

athleteDetectionQueue.on("failed", (job, error) => {
	console.error(`❌ Failed to process episode ${job.data.episodeId}:`, error);
});

/**
 * Queue all unprocessed episodes for processing
 */
export async function queueUnprocessedEpisodes() {
	console.log("\nQueuing unprocessed episodes...");

	// Get initial stats
	const stats = await getProcessingStats();
	console.log("\nCurrent Status:");
	console.log(`- Total episodes: ${stats.total}`);
	console.log(`- Previously processed: ${stats.processed}`);
	console.log(`- Remaining to process: ${stats.unprocessed}`);
	console.log(`- Total athlete mentions: ${stats.totalMentions}\n`);

	// Get all unprocessed episodes
	const unprocessedEpisodes = await db
		.select({ id: episodes.id })
		.from(episodes)
		.where(
			and(
				not(eq(episodes.athleteMentionsProcessed, true)),
				sql`${episodes.pubDate} IS NOT NULL`,
			),
		)
		.orderBy(desc(episodes.pubDate));

	console.log(`Queuing ${unprocessedEpisodes.length} episodes...\n`);

	// Add each episode to the queue
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
	}

	return {
		queued: unprocessedEpisodes.length,
		stats,
	};
}

/**
 * Get current queue status
 */
export async function getQueueStatus() {
	const [waiting, active, completed, failed, delayed] = await Promise.all([
		athleteDetectionQueue.getWaitingCount(),
		athleteDetectionQueue.getActiveCount(),
		athleteDetectionQueue.getCompletedCount(),
		athleteDetectionQueue.getFailedCount(),
		athleteDetectionQueue.getDelayedCount(),
	]);

	return {
		waiting,
		active,
		completed,
		failed,
		delayed,
		total: waiting + active + completed + failed + delayed,
	};
}

export default athleteDetectionQueue;
