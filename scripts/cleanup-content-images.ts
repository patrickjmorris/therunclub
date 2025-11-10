import { db } from "../src/db/client";
import { podcasts, episodes } from "@/db/schema";
import { sql } from "drizzle-orm";
import { supabaseAdmin } from "../src/lib/supabase-admin";

async function listStorageFiles(
	prefix: string,
): Promise<{ name: string; id: string }[]> {
	const allFiles: { name: string; id: string }[] = [];
	let offset = 0;
	const limit = 1000;

	while (true) {
		const { data, error } = await supabaseAdmin.storage
			.from("content-images")
			.list(prefix, {
				limit,
				offset,
			});

		if (error) {
			console.error(`Error listing files in ${prefix} at offset ${offset}:`, error);
			break;
		}

		if (!data || data.length === 0) {
			break;
		}

		allFiles.push(...data);
		offset += data.length;

		if (data.length < limit) {
			break;
		}
	}

	return allFiles;
}

async function deleteStorageFiles(filePaths: string[]): Promise<void> {
	if (filePaths.length === 0) {
		console.log("No files to delete");
		return;
	}

	// Delete in batches of 100 to avoid API limits
	const BATCH_SIZE = 100;
	let totalDeleted = 0;

	for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
		const batch = filePaths.slice(i, i + BATCH_SIZE);

		try {
			const { data, error } = await supabaseAdmin.storage
				.from("content-images")
				.remove(batch);

			if (error) {
				console.error(`Error deleting batch ${i / BATCH_SIZE + 1}:`, error);
				// Continue with next batch instead of failing completely
			} else {
				totalDeleted += batch.length;
				console.log(
					`   Deleted batch ${i / BATCH_SIZE + 1}: ${totalDeleted}/${filePaths.length} files`,
				);
			}
		} catch (err) {
			console.error(`Exception deleting batch ${i / BATCH_SIZE + 1}:`, err);
			// Continue with next batch
		}

		// Small delay to avoid rate limiting
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	console.log(`✅ Deleted ${totalDeleted} files total`);
}

async function clearDatabaseImageColumns(): Promise<void> {
	console.log("\nClearing database image columns...");

	// Clear podcast images
	const podcastResult = await db
		.update(podcasts)
		.set({ podcastImage: null })
		.where(sql`podcast_image IS NOT NULL`);

	console.log(`✅ Cleared podcastImage for podcasts`);

	// Clear episode images
	const episodeResult = await db
		.update(episodes)
		.set({ episodeImage: null })
		.where(sql`episode_image IS NOT NULL`);

	console.log(`✅ Cleared episodeImage for episodes`);
}

async function cleanupContentImages() {
	console.log("🧹 Starting content image cleanup...\n");

	try {
		// List and delete podcast images
		console.log("📂 Checking podcasts folder...");
		const podcastFiles = await listStorageFiles("podcasts");
		console.log(`Found ${podcastFiles.length} podcast images`);

		if (podcastFiles.length > 0) {
			const podcastPaths = podcastFiles.map((f) => `podcasts/${f.name}`);
			await deleteStorageFiles(podcastPaths);
		}

		// List and delete episode images
		console.log("\n📂 Checking episodes folder...");
		const episodeFiles = await listStorageFiles("episodes");
		console.log(`Found ${episodeFiles.length} episode images`);

		if (episodeFiles.length > 0) {
			const episodePaths = episodeFiles.map((f) => `episodes/${f.name}`);
			await deleteStorageFiles(episodePaths);
		}

		// Clear database columns
		await clearDatabaseImageColumns();

		console.log("\n✨ Cleanup completed successfully!");
		console.log("\n💡 Next step: Run the reimport script:");
		console.log("   bun run scripts/optimize-content-images.ts");

		process.exit(0);
	} catch (error) {
		console.error("\n❌ Cleanup failed:", error);
		process.exit(1);
	}
}

// Run the script
cleanupContentImages();
