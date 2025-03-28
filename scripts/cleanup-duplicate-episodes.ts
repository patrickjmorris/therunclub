import { db } from "@/db/client";
import { episodes } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { writeFileSync } from "fs";
import type { InferSelectModel } from "drizzle-orm";

type Episode = InferSelectModel<typeof episodes>;

interface DuplicateRow {
	podcast_id: string;
	episode_slug: string;
	id: string;
	title: string;
	enclosure_url: string;
	pub_date: Date | null;
	updated_at: Date | null;
	guid: string | null;
	itunes_episode: string | null;
	count: number;
}

interface DuplicateGroup {
	podcastId: string;
	episodeSlug: string;
	count: number;
	episodes: Episode[];
}

interface LogEntry {
	action: "kept" | "removed";
	podcastId: string;
	episodeSlug: string;
	episodeId: string;
	title: string;
	enclosure_url: string;
	pub_date: Date | null;
	updated_at: Date | null;
	guid: string | null;
	itunes_episode: string | null;
}

interface ErrorLogEntry {
	error: true;
	episodeSlug: string;
	message: string;
}

// Helper function to safely convert a date string to a timestamp
function getTimestamp(dateStr: string | Date | null): number {
	if (!dateStr) return 0;
	try {
		const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
		return Number.isNaN(date.getTime()) ? 0 : date.getTime();
	} catch {
		return 0;
	}
}

async function findDuplicates(): Promise<DuplicateGroup[]> {
	// First find all podcast_id + episode_slug combinations that have duplicates
	const duplicateRows = (await db.execute(sql`
    WITH duplicates AS (
      SELECT 
        podcast_id, 
        episode_slug,
        COUNT(*) as count
      FROM episodes 
      GROUP BY podcast_id, episode_slug
      HAVING COUNT(*) > 1
    )
    SELECT 
      e.podcast_id,
      e.episode_slug,
      e.id,
      e.title,
      e.enclosure_url,
      e.pub_date,
      e.updated_at,
      e.guid,
      e.itunes_episode,
      d.count
    FROM duplicates d
    JOIN episodes e ON d.podcast_id = e.podcast_id AND d.episode_slug = e.episode_slug
    ORDER BY e.podcast_id, e.episode_slug, COALESCE(e.pub_date, e.updated_at, '1970-01-01'::timestamp) DESC
  `)) as unknown as DuplicateRow[];

	// Group the results
	const groupedDuplicates: DuplicateGroup[] = [];
	let currentGroup: DuplicateGroup | null = null;

	for (const row of duplicateRows) {
		if (
			!currentGroup ||
			currentGroup.podcastId !== row.podcast_id ||
			currentGroup.episodeSlug !== row.episode_slug
		) {
			if (currentGroup) {
				groupedDuplicates.push(currentGroup);
			}
			currentGroup = {
				podcastId: row.podcast_id,
				episodeSlug: row.episode_slug,
				count: row.count,
				episodes: [],
			};
		}
		currentGroup.episodes.push({
			id: row.id,
			podcastId: row.podcast_id,
			title: row.title,
			episodeSlug: row.episode_slug,
			pubDate: row.pub_date,
			updatedAt: row.updated_at,
			guid: row.guid,
			itunesEpisode: row.itunes_episode,
			enclosureUrl: row.enclosure_url,
			duration: "",
			link: null,
			image: null,
			episodeImage: null,
			content: null,
			explicit: "no",
			athleteMentionsProcessed: false,
		});
	}
	if (currentGroup) {
		groupedDuplicates.push(currentGroup);
	}

	return groupedDuplicates;
}

async function mergeDuplicates(duplicates: DuplicateGroup[]) {
	const log: LogEntry[] = [];
	let totalProcessed = 0;
	let totalRemoved = 0;

	for (const group of duplicates) {
		console.log(
			`Processing group: ${group.episodeSlug} (${group.count} duplicates)`,
		);

		// Get all episodes in this group
		const groupEpisodes = await db
			.select()
			.from(episodes)
			.where(sql`
				podcast_id = ${group.podcastId} 
				AND episode_slug = ${group.episodeSlug}
			`);

		// First separate by GUID
		const guidGroups = new Map<string, Episode[]>();
		const noGuidEpisodes: Episode[] = [];

		// Group episodes by GUID
		for (const episode of groupEpisodes) {
			if (episode.guid) {
				const episodes = guidGroups.get(episode.guid) || [];
				episodes.push(episode);
				guidGroups.set(episode.guid, episodes);
			} else {
				noGuidEpisodes.push(episode);
			}
		}

		// Process each GUID group
		for (const [guid, episodes] of guidGroups) {
			if (episodes.length > 1) {
				// Sort by date
				const sortedEpisodes = [...episodes].sort((a, b) => {
					const timeA = getTimestamp(a.pubDate) || getTimestamp(a.updatedAt);
					const timeB = getTimestamp(b.pubDate) || getTimestamp(b.updatedAt);
					return timeB - timeA;
				});

				const [keep, ...remove] = sortedEpisodes;

				// Log the kept episode
				log.push({
					action: "kept",
					podcastId: group.podcastId,
					episodeSlug: group.episodeSlug,
					episodeId: keep.id,
					title: keep.title,
					enclosure_url: keep.enclosureUrl,
					pub_date: keep.pubDate,
					updated_at: keep.updatedAt,
					guid: keep.guid,
					itunes_episode: keep.itunesEpisode,
				});

				// Remove others
				for (const episode of remove) {
					await db.execute(sql`DELETE FROM episodes WHERE id = ${episode.id}`);

					log.push({
						action: "removed",
						podcastId: group.podcastId,
						episodeSlug: group.episodeSlug,
						episodeId: episode.id,
						title: episode.title,
						enclosure_url: episode.enclosureUrl,
						pub_date: episode.pubDate,
						updated_at: episode.updatedAt,
						guid: episode.guid,
						itunes_episode: episode.itunesEpisode,
					});
					totalRemoved++;
				}
			}
		}

		// Process episodes without GUIDs
		if (noGuidEpisodes.length > 1) {
			// Sort by date
			const sortedEpisodes = [...noGuidEpisodes].sort((a, b) => {
				const timeA = getTimestamp(a.pubDate) || getTimestamp(a.updatedAt);
				const timeB = getTimestamp(b.pubDate) || getTimestamp(b.updatedAt);
				return timeB - timeA;
			});

			const [keep, ...remove] = sortedEpisodes;

			// Log the kept episode
			log.push({
				action: "kept",
				podcastId: group.podcastId,
				episodeSlug: group.episodeSlug,
				episodeId: keep.id,
				title: keep.title,
				enclosure_url: keep.enclosureUrl,
				pub_date: keep.pubDate,
				updated_at: keep.updatedAt,
				guid: keep.guid,
				itunes_episode: keep.itunesEpisode,
			});

			// Remove others
			for (const episode of remove) {
				await db.execute(sql`DELETE FROM episodes WHERE id = ${episode.id}`);

				log.push({
					action: "removed",
					podcastId: group.podcastId,
					episodeSlug: group.episodeSlug,
					episodeId: episode.id,
					title: episode.title,
					enclosure_url: episode.enclosureUrl,
					pub_date: episode.pubDate,
					updated_at: episode.updatedAt,
					guid: episode.guid,
					itunes_episode: episode.itunesEpisode,
				});
				totalRemoved++;
			}
		}

		totalProcessed++;
	}

	return { totalProcessed, totalRemoved, log };
}

async function main() {
	console.log("Starting duplicate episodes cleanup...");

	// Find all duplicates
	const duplicates = await findDuplicates();
	console.log(`Found ${duplicates.length} groups of duplicates`);

	if (duplicates.length === 0) {
		console.log("No duplicates found. Exiting...");
		return;
	}

	// Print summary of duplicates
	console.log("\nDuplicate groups found:");
	for (const group of duplicates) {
		console.log(`- ${group.episodeSlug}: ${group.count} episodes`);
	}

	// Confirm before proceeding
	console.log(
		"\nWARNING: This script will analyze and clean up duplicate episodes.",
	);
	console.log(
		"Episodes will be considered duplicates only if they share the same GUID or iTunes episode number.",
	);
	console.log(
		"Episodes with different GUIDs or iTunes episode numbers will be preserved.",
	);
	console.log("A detailed log will be saved for review.");

	// Add confirmation prompt
	const readline = require("readline").createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const proceed = await new Promise<boolean>((resolve) => {
		readline.question(
			"\nDo you want to proceed with the cleanup? (yes/no) ",
			(answer: string) => {
				readline.close();
				resolve(answer.toLowerCase() === "yes");
			},
		);
	});

	if (!proceed) {
		console.log("Cleanup cancelled.");
		return;
	}

	// Merge duplicates
	const result = await mergeDuplicates(duplicates);

	console.log("\nCleanup completed!");
	console.log(`- Total duplicate groups processed: ${result.totalProcessed}`);
	console.log(`- Total duplicate episodes deleted: ${result.totalRemoved}`);
	console.log(`- Log file saved as: ${result.log.length} entries`);
}

// Only run if called directly
if (require.main === module) {
	main().catch(console.error);
}
