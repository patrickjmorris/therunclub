import { db } from "../src/db/client";
import { athletes } from "@/db/schema";
import { processAthleteImage } from "@/lib/image-utils";
import { sql } from "drizzle-orm";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function optimizeAthleteImages(limit?: number) {
	// Get all athletes with unoptimized images (not in Supabase storage)
	const athletesWithImages = await db
		.select({
			id: athletes.id,
			name: athletes.name,
			imageUrl: athletes.imageUrl,
		})
		.from(athletes)
		.where(sql`image_url IS NOT NULL AND image_url NOT LIKE '%supabase%'`)
		.limit(limit || Number.MAX_SAFE_INTEGER);

	console.log(
		`Found ${athletesWithImages.length} athletes with unoptimized images${
			limit ? ` (limited to ${limit})` : ""
		}`,
	);

	let successCount = 0;
	let failureCount = 0;

	for (const athlete of athletesWithImages) {
		try {
			console.log(`Processing ${athlete.name}...`);

			if (!athlete.imageUrl) {
				console.log(`No image URL for ${athlete.name}, skipping...`);
				failureCount++;
				continue;
			}

			const optimizedUrl = await processAthleteImage(athlete.imageUrl, true);

			if (optimizedUrl) {
				// Delete old image if it's in Supabase storage
				if (athlete.imageUrl.includes("supabase")) {
					try {
						const oldImagePath = athlete.imageUrl.split("/").pop();
						if (oldImagePath?.startsWith("athletes/")) {
							await supabaseAdmin.storage
								.from("athlete-images")
								.remove([oldImagePath]);
						}
					} catch (deleteError) {
						console.error("Error deleting old image:", deleteError);
					}
				}

				await db
					.update(athletes)
					.set({
						imageUrl: optimizedUrl,
						updatedAt: sql`CURRENT_TIMESTAMP`,
					})
					.where(sql`id = ${athlete.id}`);

				console.log(`✅ Successfully optimized image for ${athlete.name}`);
				successCount++;
			} else {
				console.log(`❌ Failed to optimize image for ${athlete.name}`);
				failureCount++;
			}

			// Add a small delay to avoid overwhelming the system
			await new Promise((resolve) => setTimeout(resolve, 500));
		} catch (error) {
			console.error(`Error processing ${athlete.name}:`, error);
			failureCount++;
		}
	}

	console.log("\nProcessing complete:");
	console.log(`- Total athletes processed: ${athletesWithImages.length}`);
	console.log(`- Successful updates: ${successCount}`);
	console.log(`- Failed updates: ${failureCount}`);
}

// Parse command line arguments
const limit = process.argv[2] ? parseInt(process.argv[2]) : undefined;

// Run the script
optimizeAthleteImages(limit)
	.then(() => {
		console.log("✨ Script completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Script failed:", error);
		process.exit(1);
	});
