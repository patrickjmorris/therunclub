import { processAllEpisodes } from "@/lib/athlete-detection";

async function main() {
	console.log("Starting athlete mention detection...");

	try {
		const { processed, errors } = await processAllEpisodes();
		console.log(`
Processing complete:
- Episodes processed: ${processed}
- Errors encountered: ${errors}
		`);
	} catch (error) {
		console.error("Failed to process episodes:", error);
		process.exit(1);
	}
}

main();
