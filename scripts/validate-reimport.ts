import { db } from "../src/db/client";
import { podcasts, episodes } from "@/db/schema";
import { sql } from "drizzle-orm";
import { supabaseAdmin } from "../src/lib/supabase-admin";

async function validateReimport() {
	console.log("🔍 Validating reimport with deterministic filenames...\n");

	// Check podcast storage files
	console.log("📂 Checking podcasts folder...");
	const { data: podcastFiles, error: podcastError } =
		await supabaseAdmin.storage
			.from("content-images")
			.list("podcasts", { limit: 10 });

	if (podcastError) {
		console.error("Error listing podcast files:", podcastError);
	} else {
		console.log(`Found ${podcastFiles?.length || 0} podcast images`);
		if (podcastFiles && podcastFiles.length > 0) {
			console.log("Sample filenames:");
			podcastFiles.slice(0, 5).forEach((file) => {
				console.log(`  - ${file.name}`);
			});
		}
	}

	// Check episode storage files
	console.log("\n📂 Checking episodes folder...");
	const { data: episodeFiles, error: episodeError } =
		await supabaseAdmin.storage
			.from("content-images")
			.list("episodes", { limit: 10 });

	if (episodeError) {
		console.error("Error listing episode files:", episodeError);
	} else {
		console.log(`Found ${episodeFiles?.length || 0} episode images`);
		if (episodeFiles && episodeFiles.length > 0) {
			console.log("Sample filenames:");
			episodeFiles.slice(0, 5).forEach((file) => {
				console.log(`  - ${file.name}`);
			});
		}
	}

	// Check database entries
	console.log("\n📊 Checking database...");

	const podcastsWithImages = await db
		.select({
			id: podcasts.id,
			title: podcasts.title,
			podcastImage: podcasts.podcastImage,
		})
		.from(podcasts)
		.where(sql`podcast_image IS NOT NULL`)
		.limit(5);

	console.log(
		`\nFound ${podcastsWithImages.length} podcasts with optimized images`,
	);
	podcastsWithImages.forEach((p) => {
		const filename = p.podcastImage?.split("/").pop();
		const isUUID = filename?.match(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/,
		);
		console.log(`  ✓ ${p.title}`);
		console.log(`    ID: ${p.id}`);
		console.log(`    Filename: ${filename}`);
		console.log(`    Is deterministic (UUID-based): ${!!isUUID}`);
	});

	const episodesWithImages = await db
		.select({
			id: episodes.id,
			title: episodes.title,
			episodeImage: episodes.episodeImage,
		})
		.from(episodes)
		.where(sql`episode_image IS NOT NULL`)
		.limit(5);

	console.log(
		`\nFound ${episodesWithImages.length} episodes with optimized images`,
	);
	episodesWithImages.forEach((e) => {
		const filename = e.episodeImage?.split("/").pop();
		const isUUID = filename?.match(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/,
		);
		console.log(`  ✓ ${e.title.substring(0, 60)}...`);
		console.log(`    ID: ${e.id}`);
		console.log(`    Filename: ${filename}`);
		console.log(`    Is deterministic (UUID-based): ${!!isUUID}`);
	});

	console.log("\n✨ Validation complete!");
	process.exit(0);
}

validateReimport();
