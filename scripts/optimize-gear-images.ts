import { db } from "../src/db/client";
import { gear } from "@/db/schema"; // Use gear schema
import { sql, isNull } from "drizzle-orm"; // Import isNull
import { optimizeImage } from "../src/lib/server/image-processing";

interface ProcessResult {
	success: boolean;
	message: string;
	processedCount: number;
	failedCount: number;
}

async function processGearImages(batchSize = 10000): Promise<ProcessResult> {
	console.log(`Processing gear images in batches of ${batchSize}...`);

	// Get gear items with unoptimized images
	const gearItemsWithImages = await db
		.select({
			id: gear.id,
			name: gear.name,
			image: gear.image,
		})
		.from(gear)
		.where(sql`${gear.image} IS NOT NULL AND ${gear.optimizedImageUrl} IS NULL`)
		// Alternative using Drizzle helpers:
		// .where(and(isNotNull(gear.image), isNull(gear.optimizedImageUrl)))
		.limit(batchSize);

	console.log(
		`Found ${gearItemsWithImages.length} gear items with unoptimized images`,
	);

	let successCount = 0;
	let failureCount = 0;

	for (const item of gearItemsWithImages) {
		try {
			console.log(`Processing ${item.name}...`);

			if (!item.image) {
				console.log(`No image URL for ${item.name}, skipping...`);
				failureCount++;
				continue;
			}

			// Assuming optimizeImage handles download, resize, upload to Supabase Storage
			// Using 'gear' as the path/bucket prefix
			const optimizedUrl = await optimizeImage(item.image, 1400, "gear");

			if (optimizedUrl) {
				await db
					.update(gear)
					.set({
						optimizedImageUrl: optimizedUrl,
						updatedAt: sql`CURRENT_TIMESTAMP`,
					})
					.where(sql`id = ${item.id}`);

				console.log(`✅ Successfully optimized image for ${item.name}`);
				successCount++;
			} else {
				console.log(`❌ Failed to optimize image for ${item.name}`);
				failureCount++;
			}
		} catch (error) {
			console.error(`Error processing ${item.name}:`, error);
			failureCount++;
		}
	}

	return {
		success: failureCount === 0,
		message: `Processed ${successCount} gear items successfully, ${failureCount} failed`,
		processedCount: successCount,
		failedCount: failureCount,
	};
}

async function optimizeGearImages(batchSize = 10000) {
	console.log("Starting gear image optimization process...");

	try {
		const result = await processGearImages(batchSize);
		console.log("\nGear Processing Results:");
		console.log(result.message);

		console.log("\n✨ Optimization process completed");
		process.exit(0);
	} catch (error) {
		console.error("❌ Script failed:", error);
		process.exit(1);
	}
}

// Parse command line arguments for batch size
const batchSizeArg = process.argv[2] ? parseInt(process.argv[2]) : 10000;

// Run the script
optimizeGearImages(batchSizeArg);
