import { db } from "../src/db/client";
import { podcasts, episodes } from "@/db/schema";
import { sql } from "drizzle-orm";
import { supabaseAdmin } from "../src/lib/supabase-admin";

const SUPABASE_URL =
	"https://akzhyzwiwjxtjuirmqyx.supabase.co/storage/v1/object/public/content-images";

async function updatePodcastImageReferences() {
	console.log("📝 Updating podcast image references...");

	// Get all podcasts with original images
	const allPodcasts = await db
		.select({
			id: podcasts.id,
		})
		.from(podcasts);

	console.log(`Found ${allPodcasts.length} podcasts to update`);

	// Update all podcasts to use the new pattern
	const result = await db
		.update(podcasts)
		.set({
			podcastImage: sql`${SUPABASE_URL} || '/podcasts/' || id || '.webp'`,
			updatedAt: sql`CURRENT_TIMESTAMP`,
		})
		.where(sql`id IS NOT NULL`);

	console.log(`✅ Updated podcast image references`);
}

async function updateEpisodeImageReferences() {
	console.log("\n📝 Updating episode image references...");

	// Get all episodes with original images
	const allEpisodes = await db
		.select({
			id: episodes.id,
		})
		.from(episodes);

	console.log(`Found ${allEpisodes.length} episodes to update`);

	// Update all episodes to use the new pattern
	const result = await db
		.update(episodes)
		.set({
			episodeImage: sql`${SUPABASE_URL} || '/episodes/' || id || '.webp'`,
			updatedAt: sql`CURRENT_TIMESTAMP`,
		})
		.where(sql`id IS NOT NULL`);

	console.log(`✅ Updated episode image references`);
}

async function verifyUpdates() {
	console.log("\n🔍 Verifying updates...");

	// Check podcasts
	const podcastsWithImages = await db
		.select({
			id: podcasts.id,
			podcastImage: podcasts.podcastImage,
		})
		.from(podcasts)
		.where(sql`podcast_image IS NOT NULL`)
		.limit(3);

	console.log("\n📸 Sample podcast images:");
	podcastsWithImages.forEach((p) => {
		console.log(`  ${p.id}: ${p.podcastImage}`);
	});

	// Check episodes
	const episodesWithImages = await db
		.select({
			id: episodes.id,
			episodeImage: episodes.episodeImage,
		})
		.from(episodes)
		.where(sql`episode_image IS NOT NULL`)
		.limit(3);

	console.log("\n📸 Sample episode images:");
	episodesWithImages.forEach((e) => {
		console.log(`  ${e.id}: ${e.episodeImage}`);
	});

	// Get counts
	const podcastCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(podcasts)
		.where(sql`podcast_image IS NOT NULL`);

	const episodeCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(episodes)
		.where(sql`episode_image IS NOT NULL`);

	console.log(`\n✨ Updated ${podcastCount[0].count} podcasts`);
	console.log(`✨ Updated ${episodeCount[0].count} episodes`);
}

async function updateImageReferences() {
	console.log("🚀 Starting image reference updates...\n");

	try {
		await updatePodcastImageReferences();
		await updateEpisodeImageReferences();
		await verifyUpdates();

		console.log("\n✅ All image references updated successfully!");
		process.exit(0);
	} catch (error) {
		console.error("\n❌ Update failed:", error);
		process.exit(1);
	}
}

updateImageReferences();
