import athleteDetectionQueue, {
	getQueueStatus,
} from "../src/lib/queue/athlete-detection-queue";

async function startWorker() {
	console.log("Starting athlete detection worker...");

	// Print initial queue status
	const status = await getQueueStatus();
	console.log("\nQueue Status:");
	console.log(`- Waiting: ${status.waiting}`);
	console.log(`- Active: ${status.active}`);
	console.log(`- Completed: ${status.completed}`);
	console.log(`- Failed: ${status.failed}`);
	console.log(`- Delayed: ${status.delayed}`);

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

startWorker().catch((error) => {
	console.error("Worker error:", error);
	process.exit(1);
});
