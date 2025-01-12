import { db } from "../src/db/client";
import { athletes } from "@/db/schema";
import { searchAthleteImage } from "@/lib/wikimedia";
import { sql } from "drizzle-orm";

async function updateAllAthleteImages(limit?: number) {
	// Get all athletes without images
	const athletesWithoutImages = await db
		.select({
			id: athletes.id,
			name: athletes.name,
		})
		.from(athletes)
		.where(sql`image_url IS NULL`)
		.limit(limit || Number.MAX_SAFE_INTEGER);

	console.log(
		`Found ${athletesWithoutImages.length} athletes without images${
			limit ? ` (limited to ${limit})` : ""
		}`,
	);

	let successCount = 0;
	let failureCount = 0;

	for (const athlete of athletesWithoutImages) {
		try {
			console.log(`Processing ${athlete.name}...`);
			const imageUrl = await searchAthleteImage(athlete.name);

			if (imageUrl) {
				await db
					.update(athletes)
					.set({
						imageUrl: imageUrl,
						updatedAt: sql`CURRENT_TIMESTAMP`,
					})
					.where(sql`id = ${athlete.id}`);

				console.log(`✅ Successfully updated image for ${athlete.name}`);
				successCount++;
			} else {
				console.log(`❌ No suitable image found for ${athlete.name}`);
				failureCount++;
			}

			// Add a small delay to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 1000));
		} catch (error) {
			console.error(`Error processing ${athlete.name}:`, error);
			failureCount++;
		}
	}

	console.log("\nProcessing complete:");
	console.log(`- Total athletes processed: ${athletesWithoutImages.length}`);
	console.log(`- Successful updates: ${successCount}`);
	console.log(`- Failed updates: ${failureCount}`);
}

// Parse command line arguments
const limit = process.argv[2] ? parseInt(process.argv[2]) : undefined;

// Run the script
updateAllAthleteImages(limit)
	.then(() => {
		console.log("✨ Script completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Script failed:", error);
		process.exit(1);
	});
