import { db } from "@/db/client";
import { episodes, podcasts } from "@/db/schema";
import { sql } from "drizzle-orm";
import { parsePodcastFeed } from "@/lib/episodes";
import type { InferSelectModel } from "drizzle-orm";

type Podcast = InferSelectModel<typeof podcasts>;
type Episode = InferSelectModel<typeof episodes>;

interface UpdateOptions {
	podcastId?: string;
	podcastSlug?: string;
	episodeId?: string;
	episodeSlug?: string;
	all?: boolean;
}

async function updateGUIDs(options: UpdateOptions = { all: true }) {
	console.log("Starting GUID update process...");
	console.log("Options:", options);

	// First, drop the unique index on guid
	console.log("Dropping unique index on guid...");
	await db.execute(sql`DROP INDEX IF EXISTS episodes_guid_idx`);

	try {
		let targetPodcasts: Podcast[] = [];

		// Determine which podcasts to process
		if (options.all) {
			// Process all podcasts
			targetPodcasts = await db.select().from(podcasts);
			console.log(`Processing all podcasts (${targetPodcasts.length})`);
		} else if (options.podcastId) {
			// Process a specific podcast by ID
			targetPodcasts = await db
				.select()
				.from(podcasts)
				.where(sql`id = ${options.podcastId}`);
			console.log(`Processing podcast with ID: ${options.podcastId}`);
		} else if (options.podcastSlug) {
			// Process a specific podcast by slug
			targetPodcasts = await db
				.select()
				.from(podcasts)
				.where(sql`podcast_slug = ${options.podcastSlug}`);
			console.log(`Processing podcast with slug: ${options.podcastSlug}`);
		} else if (options.episodeId || options.episodeSlug) {
			// For processing a specific episode, we need to get its podcast first
			let targetEpisode: Episode[] | undefined;

			if (options.episodeId) {
				targetEpisode = await db
					.select()
					.from(episodes)
					.where(sql`id = ${options.episodeId}`)
					.limit(1);
				console.log(`Processing episode with ID: ${options.episodeId}`);
			} else if (options.episodeSlug) {
				targetEpisode = await db
					.select()
					.from(episodes)
					.where(sql`episode_slug = ${options.episodeSlug}`)
					.limit(1);
				console.log(`Processing episode with slug: ${options.episodeSlug}`);
			}

			if (targetEpisode && targetEpisode.length > 0) {
				const podcastId = targetEpisode[0].podcastId;
				targetPodcasts = await db
					.select()
					.from(podcasts)
					.where(sql`id = ${podcastId}`);

				// Store the episode ID for later processing
				options.episodeId = targetEpisode[0].id;
			} else {
				console.log("Episode not found");
				return;
			}
		}

		if (targetPodcasts.length === 0) {
			console.log("No podcasts found with the specified criteria");
			return;
		}

		// Process each podcast
		for (const podcast of targetPodcasts) {
			console.log(`\nProcessing podcast: ${podcast.title} (${podcast.id})`);

			try {
				// Parse the RSS feed
				const feed = await parsePodcastFeed(podcast.feedUrl);

				// Create a map of episode titles to their GUIDs
				const guidMap = new Map(
					feed.items.map((item) => [
						item.title.toLowerCase(),
						item.guid || null,
					]),
				);

				// Determine which episodes to process
				let podcastEpisodes: Episode[];
				if (options.episodeId) {
					// Process only the specified episode
					podcastEpisodes = await db
						.select()
						.from(episodes)
						.where(sql`id = ${options.episodeId}`);
				} else {
					// Process all episodes for this podcast
					podcastEpisodes = await db
						.select()
						.from(episodes)
						.where(sql`podcast_id = ${podcast.id}`);
				}

				let updatedCount = 0;
				for (const episode of podcastEpisodes) {
					const feedGuid = guidMap.get(episode.title.toLowerCase());
					if (feedGuid && feedGuid !== episode.guid) {
						await db
							.update(episodes)
							.set({ guid: feedGuid })
							.where(sql`id = ${episode.id}`);
						updatedCount++;
						console.log(
							`Updated GUID for episode: ${episode.title} (${episode.id})`,
						);
						console.log(`  Old GUID: ${episode.guid || "none"}`);
						console.log(`  New GUID: ${feedGuid}`);
					} else if (!feedGuid) {
						console.log(
							`No GUID found in feed for episode: ${episode.title} (${episode.id})`,
						);
					} else if (feedGuid === episode.guid) {
						console.log(
							`GUID already up to date for episode: ${episode.title} (${episode.id})`,
						);
					}
				}

				console.log(`Updated ${updatedCount} episodes for ${podcast.title}`);
			} catch (error) {
				console.error(`Error processing podcast ${podcast.title}:`, error);
			}
		}

		console.log("\nGUID update process completed!");

		// Finally, recreate the unique index on guid
		console.log("Recreating unique index on guid...");
		await db.execute(sql`
			CREATE UNIQUE INDEX episodes_guid_idx ON episodes (guid)
			WHERE guid IS NOT NULL;
		`);
		console.log("Index recreation completed!");
	} catch (error) {
		console.error("Error during GUID update process:", error);
		// Try to recreate the index even if there was an error
		try {
			console.log("Attempting to recreate index after error...");
			await db.execute(sql`
				CREATE UNIQUE INDEX episodes_guid_idx ON episodes (guid)
				WHERE guid IS NOT NULL;
			`);
			console.log("Index recreation completed!");
		} catch (indexError) {
			console.error("Failed to recreate index:", indexError);
		}
	}
}

// Parse command line arguments
function parseArgs() {
	const args = process.argv.slice(2);
	const options: UpdateOptions = {};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === "--all" || arg === "-a") {
			options.all = true;
		} else if (arg === "--podcast-id" || arg === "-pid") {
			options.podcastId = args[++i];
		} else if (arg === "--podcast-slug" || arg === "-ps") {
			options.podcastSlug = args[++i];
		} else if (arg === "--episode-id" || arg === "-eid") {
			options.episodeId = args[++i];
		} else if (arg === "--episode-slug" || arg === "-es") {
			options.episodeSlug = args[++i];
		} else if (arg === "--help" || arg === "-h") {
			printHelp();
			process.exit(0);
		}
	}

	// Default to processing all if no specific target is provided
	if (
		!options.podcastId &&
		!options.podcastSlug &&
		!options.episodeId &&
		!options.episodeSlug
	) {
		options.all = true;
	}

	return options;
}

function printHelp() {
	console.log(`
GUID Update Script
=================

This script updates episode GUIDs from RSS feeds.

Usage:
  bun run scripts/update-episode-guids.ts [options]

Options:
  --all, -a                Process all podcasts (default)
  --podcast-id, -pid ID    Process a specific podcast by ID
  --podcast-slug, -ps SLUG Process a specific podcast by slug
  --episode-id, -eid ID    Process a specific episode by ID
  --episode-slug, -es SLUG Process a specific episode by slug
  --help, -h               Show this help message
  
Examples:
  bun run scripts/update-episode-guids.ts                 # Process all podcasts
  bun run scripts/update-episode-guids.ts -pid abc123     # Process podcast with ID abc123
  bun run scripts/update-episode-guids.ts -ps running-101 # Process podcast with slug running-101
  bun run scripts/update-episode-guids.ts -eid xyz789     # Process episode with ID xyz789
  `);
}

// Only run if called directly
if (require.main === module) {
	const options = parseArgs();
	updateGUIDs(options).catch(console.error);
}
