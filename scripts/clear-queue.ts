import { athleteDetectionQueue } from "./worker";

async function clearQueue() {
	console.log("[Clear Queue] Starting to clear athlete detection queue...");

	try {
		// Get initial queue status
		const [waiting, active, completed, failed, delayed] = await Promise.all([
			athleteDetectionQueue.getWaitingCount(),
			athleteDetectionQueue.getActiveCount(),
			athleteDetectionQueue.getCompletedCount(),
			athleteDetectionQueue.getFailedCount(),
			athleteDetectionQueue.getDelayedCount(),
		]);

		console.log("\n[Clear Queue] Initial queue status:");
		console.log(`- Waiting: ${waiting}`);
		console.log(`- Active: ${active}`);
		console.log(`- Completed: ${completed}`);
		console.log(`- Failed: ${failed}`);
		console.log(`- Delayed: ${delayed}`);

		// Obliterate all jobs
		await athleteDetectionQueue.obliterate();
		console.log("\n[Clear Queue] Queue obliterated");

		// Get final queue status
		const [
			finalWaiting,
			finalActive,
			finalCompleted,
			finalFailed,
			finalDelayed,
		] = await Promise.all([
			athleteDetectionQueue.getWaitingCount(),
			athleteDetectionQueue.getActiveCount(),
			athleteDetectionQueue.getCompletedCount(),
			athleteDetectionQueue.getFailedCount(),
			athleteDetectionQueue.getDelayedCount(),
		]);

		console.log("\n[Clear Queue] Final queue status:");
		console.log(`- Waiting: ${finalWaiting}`);
		console.log(`- Active: ${finalActive}`);
		console.log(`- Completed: ${finalCompleted}`);
		console.log(`- Failed: ${finalFailed}`);
		console.log(`- Delayed: ${finalDelayed}`);

		console.log("\n[Clear Queue] Queue cleared successfully");

		// Close the queue
		await athleteDetectionQueue.close();
	} catch (error) {
		console.error("[Clear Queue] Error clearing queue:", error);
		process.exit(1);
	}
}

// Run the script
clearQueue().catch((error) => {
	console.error("[Clear Queue] Script error:", error);
	process.exit(1);
});
