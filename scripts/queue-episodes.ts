import { queueUnprocessedEpisodes } from "../src/lib/queue/athlete-detection-queue";

async function queueEpisodes() {
	console.log("Queuing episodes for athlete detection...");

	try {
		const result = await queueUnprocessedEpisodes();
		console.log(
			`\nSuccessfully queued ${result.queued} episodes for processing`,
		);
		process.exit(0);
	} catch (error) {
		console.error("Error queuing episodes:", error);
		process.exit(1);
	}
}

queueEpisodes();
