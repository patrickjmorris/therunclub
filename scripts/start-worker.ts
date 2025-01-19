import athleteDetectionQueue from "./worker";

async function startWorker() {
	console.log("Starting athlete detection worker...");

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

	// Keep the process running
	process.stdin.resume();

	// Handle shutdown gracefully
	process.on("SIGTERM", async () => {
		console.log("\nShutting down worker...");
		await athleteDetectionQueue.close();
		process.exit(0);
	});

	process.on("SIGINT", async () => {
		console.log("\nShutting down worker...");
		await athleteDetectionQueue.close();
		process.exit(0);
	});
}

// Start the worker
startWorker().catch((error) => {
	console.error("Worker error:", error);
	process.exit(1);
});
