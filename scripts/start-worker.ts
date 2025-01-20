import athleteDetectionQueue from "@/lib/queue/athlete-detection-queue";

async function startWorker() {
	console.log("Starting athlete detection worker...");

	try {
		// Wait for queue to be ready
		await new Promise<void>((resolve) => {
			athleteDetectionQueue.once("ready", () => {
				console.log("Queue is ready");
				resolve();
			});
		});

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

		// Resume the queue if it was paused
		await athleteDetectionQueue.resume();

		console.log("\nWorker is now processing jobs");
		console.log("Press Ctrl+C to shutdown gracefully");

		// Handle shutdown gracefully
		let isShuttingDown = false;

		async function shutdown() {
			if (isShuttingDown) {
				console.log("\nForce shutting down...");
				process.exit(0);
			}

			isShuttingDown = true;
			console.log("\nGracefully shutting down...");

			try {
				// Pause the queue to prevent new jobs from being processed
				await athleteDetectionQueue.pause();

				// Get active job count
				const activeCount = await athleteDetectionQueue.getActiveCount();
				if (activeCount > 0) {
					console.log(`Waiting for ${activeCount} active jobs to complete...`);
					// Wait for active jobs to finish (max 30 seconds)
					await Promise.race([
						athleteDetectionQueue.whenCurrentJobsFinished(),
						new Promise((resolve) => setTimeout(resolve, 30000)),
					]);
				}

				// Close the queue
				await athleteDetectionQueue.close();
				console.log("Shutdown complete");
			} catch (error) {
				console.error("Error during shutdown:", error);
			}

			process.exit(0);
		}

		// Handle both SIGINT (Ctrl+C) and SIGTERM
		process.on("SIGINT", shutdown);
		process.on("SIGTERM", shutdown);

		// Keep the process running
		await new Promise(() => {}); // Never resolves, keeps process alive
	} catch (error) {
		console.error("Failed to start worker:", error);
		process.exit(1);
	}
}

// Start the worker
startWorker().catch((error) => {
	console.error("Worker error:", error);
	process.exit(1);
});
