import { athleteDetectionQueue } from "./worker";
import { db } from "@/db/client";
import { episodes } from "@/db/schema";
import { eq } from "drizzle-orm";

async function queueEpisodes() {
	console.log("[Queue] Starting to queue episodes for athlete detection...");

	try {
		// Get all unprocessed episodes
		const unprocessedEpisodes = await db
			.select({
				id: episodes.id,
				title: episodes.title,
			})
			.from(episodes)
			.where(eq(episodes.athleteMentionsProcessed, false));

		console.log(
			`[Queue] Found ${unprocessedEpisodes.length} unprocessed episodes`,
		);

		// Queue each episode for processing
		for (const episode of unprocessedEpisodes) {
			try {
				const job = await athleteDetectionQueue.add(
					"process-episode",
					{
						contentId: episode.id,
						contentType: "podcast" as const,
					},
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
				console.log(
					`[Queue] Queued episode: ${episode.title} (Job ID: ${job.id})`,
				);
			} catch (error) {
				console.error(`[Queue] Error queuing episode ${episode.id}:`, error);
			}
		}

		// Get queue status
		const [waiting, active, completed, failed, delayed] = await Promise.all([
			athleteDetectionQueue.getWaitingCount(),
			athleteDetectionQueue.getActiveCount(),
			athleteDetectionQueue.getCompletedCount(),
			athleteDetectionQueue.getFailedCount(),
			athleteDetectionQueue.getDelayedCount(),
		]);

		console.log("\n[Queue] Queue status after adding jobs:");
		console.log(`- Waiting: ${waiting}`);
		console.log(`- Active: ${active}`);
		console.log(`- Completed: ${completed}`);
		console.log(`- Failed: ${failed}`);
		console.log(`- Delayed: ${delayed}`);

		console.log("\n[Queue] Finished queuing episodes");
	} catch (error) {
		console.error("[Queue] Error in queueEpisodes:", error);
		process.exit(1);
	}
}

// Run the script
queueEpisodes().catch((error) => {
	console.error("[Queue] Script error:", error);
	process.exit(1);
});
