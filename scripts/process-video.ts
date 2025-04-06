import { processContentAthletes } from "@/lib/services/athlete-service";

// Get video ID from command line argument
const videoId = process.argv[2];

if (!videoId) {
	console.error("Please provide a video ID as an argument");
	console.error("Usage: bun run scripts/process-video.ts <videoId>");
	process.exit(1);
}

// Run the processor using the shared function
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
