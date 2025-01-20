import athleteDetectionQueue from "@/lib/queue/athlete-detection-queue";

async function clearQueue() {
	console.log("Clearing athlete detection queue...");

	try {
		// Get initial queue status
		const [waiting, active, completed, failed, delayed] = await Promise.all([
			athleteDetectionQueue.getWaitingCount(),
			athleteDetectionQueue.getActiveCount(),
			athleteDetectionQueue.getCompletedCount(),
			athleteDetectionQueue.getFailedCount(),
			athleteDetectionQueue.getDelayedCount(),
		]);

		console.log("\nInitial queue status:");
		console.log(`- Waiting: ${waiting}`);
		console.log(`- Active: ${active}`);
		console.log(`- Completed: ${completed}`);
		console.log(`- Failed: ${failed}`);
		console.log(`- Delayed: ${delayed}`);

		// Pause the queue to prevent new jobs from being processed
		await athleteDetectionQueue.pause();
		console.log("\nQueue paused");

		// Clean all jobs from the queue
		await athleteDetectionQueue.clean(0, "active");
		await athleteDetectionQueue.clean(0, "wait");
		await athleteDetectionQueue.clean(0, "delayed");
		await athleteDetectionQueue.clean(0, "failed");
		await athleteDetectionQueue.clean(0, "completed");

		// Empty the queue
		await athleteDetectionQueue.empty();

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

		console.log("\nFinal queue status:");
		console.log(`- Waiting: ${finalWaiting}`);
		console.log(`- Active: ${finalActive}`);
		console.log(`- Completed: ${finalCompleted}`);
		console.log(`- Failed: ${finalFailed}`);
		console.log(`- Delayed: ${finalDelayed}`);

		console.log("\nQueue cleared successfully");

		// Close the queue connection
		await athleteDetectionQueue.close();
		process.exit(0);
	} catch (error) {
		console.error("Error clearing queue:", error);
		process.exit(1);
	}
}

// Run the clear queue function
clearQueue().catch((error) => {
	console.error("Failed to clear queue:", error);
	process.exit(1);
});
