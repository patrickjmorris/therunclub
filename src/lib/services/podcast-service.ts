import { db } from "@/db/client";
import {
	podcasts,
	episodes,
	type Podcast,
	type Episode,
	podcastRankings,
} from "@/db/schema";
import { desc, ilike, sql, eq, and, like, isNotNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { fetchTopRunningPodcasts } from "./taddy-service";

// Get latest podcasts
export async function getLatestPodcasts(limit = 30, offset = 0) {
	return db
		.select()
		.from(podcasts)
		.orderBy(desc(podcasts.lastBuildDate))
		.limit(limit)
		.offset(offset);
}

// Search podcasts
export async function searchPodcasts(query: string, limit = 30) {
	return db
		.select()
		.from(podcasts)
		.where(
			sql`to_tsvector('english', ${podcasts.title} || ' ' || ${podcasts.description}) @@ to_tsquery('english', ${query})`,
		)
		.orderBy(desc(podcasts.lastBuildDate))
		.limit(limit);
}

// Get podcast by ID
export async function getPodcastById(podcastId: string) {
	const [podcast] = await db
		.select()
		.from(podcasts)
		.where(sql`${podcasts.id} = ${podcastId}`)
		.limit(1);

	return podcast;
}

// Get episodes for a podcast
export async function getPodcastEpisodes(podcastId: string, limit = 30) {
	return db
		.select()
		.from(episodes)
		.where(sql`${episodes.podcastId} = ${podcastId}`)
		.orderBy(desc(episodes.pubDate))
		.limit(limit);
}

// Search episodes
export async function searchEpisodes(query: string, limit = 30) {
	return db
		.select({
			episode: episodes,
			podcast: podcasts,
		})
		.from(episodes)
		.leftJoin(podcasts, sql`${episodes.podcastId} = ${podcasts.id}`)
		.where(
			sql`to_tsvector('english', ${episodes.title} || ' ' || ${episodes.content}) @@ to_tsquery('english', ${query})`,
		)
		.orderBy(desc(episodes.pubDate))
		.limit(limit);
}

// Types for the combined queries
export type EpisodeWithPodcast = {
	episode: Episode;
	podcast: Podcast;
};

// Get new episodes
export const getNewEpisodes = unstable_cache(
	async (limit = 3) => {
		return db
			.select({
				podcastId: podcasts.id,
				podcastTitle: podcasts.title,
				podcastImage: podcasts.podcastImage,
				podcastSlug: podcasts.podcastSlug,
				itunesImage: podcasts.itunesImage,
				episodeId: episodes.id,
				episodeTitle: episodes.title,
				episodeImage: episodes.episodeImage,
				episodeDuration: episodes.duration,
				episodeSlug: episodes.episodeSlug,
				pubDate: episodes.pubDate,
				enclosureUrl: episodes.enclosureUrl,
			})
			.from(podcasts)
			.innerJoin(episodes, eq(podcasts.id, episodes.podcastId))
			.where(and(isNotNull(episodes.pubDate), like(podcasts.language, "en%")))
			.orderBy(desc(episodes.pubDate))
			.limit(limit);
	},
	["new-episodes"],
	{ tags: ["episodes"], revalidate: 3600 }, // 1 hour in seconds
);

// Get last ten episodes
export const getLastTenEpisodes = unstable_cache(
	async (podcastId: string) => {
		return db
			.select({
				id: episodes.id,
				title: episodes.title,
				pubDate: episodes.pubDate,
				image: episodes.episodeImage,
				podcastId: episodes.podcastId,
				podcastTitle: podcasts.title,
				podcastImage: podcasts.podcastImage,
				itunesImage: podcasts.itunesImage,
				duration: episodes.duration,
				content: episodes.content,
				episodeSlug: episodes.episodeSlug,
				podcastSlug: podcasts.podcastSlug,
				podcastAuthor: podcasts.author,
				enclosureUrl: episodes.enclosureUrl,
				explicit: episodes.explicit,
			})
			.from(episodes)
			.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
			.where(eq(episodes.podcastId, podcastId))
			.orderBy(desc(episodes.pubDate))
			.limit(10);
	},
	["last-ten-episodes"],
	{ tags: ["episodes"], revalidate: 3600 },
);

// Get last episode
export const getLastEpisode = unstable_cache(
	async (podcastTitle: string) => {
		return db
			.select()
			.from(episodes)
			.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
			.where(eq(podcasts.title, podcastTitle))
			.orderBy(desc(episodes.pubDate))
			.limit(1)
			.then((results) => results[0] || null);
	},
	["last-episode"],
	{ tags: ["episodes"], revalidate: 3600 },
);

// Get last episodes by podcast
export const getLastEpisodesByPodcast = unstable_cache(
	async () => {
		const rankedEpisodes = db
			.select({
				podcastTitle: podcasts.title,
				podcastId: podcasts.id,
				podcastImage: podcasts.podcastImage,
				itunesImage: podcasts.itunesImage,
				episodeTitle: episodes.title,
				episodeId: episodes.id,
				episodePubDate: episodes.pubDate,
				episodeSlug: episodes.episodeSlug,
				podcastSlug: podcasts.podcastSlug,
				rowNum:
					sql<number>`row_number() over (partition by ${episodes.podcastId} order by ${episodes.pubDate} desc)`.as(
						"rowNum",
					),
			})
			.from(episodes)
			.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
			.as("ranked");

		return db
			.select({
				podcastTitle: rankedEpisodes.podcastTitle,
				podcastId: rankedEpisodes.podcastId,
				podcastImage: rankedEpisodes.podcastImage,
				itunesImage: rankedEpisodes.itunesImage,
				episodeTitle: rankedEpisodes.episodeTitle,
				episodeId: rankedEpisodes.episodeId,
				episodePubDate: rankedEpisodes.episodePubDate,
				episodeSlug: rankedEpisodes.episodeSlug,
				podcastSlug: rankedEpisodes.podcastSlug,
			})
			.from(rankedEpisodes)
			.where(sql`${rankedEpisodes.rowNum} = 1`);
	},
	["last-episodes-by-podcast"],
	{ tags: ["podcasts", "episodes"], revalidate: 3600 },
);

// Get podcast metadata
export const getPodcastMetadata = unstable_cache(
	async (podcastId: string) => {
		return db
			.select({
				title: podcasts.title,
				description: podcasts.description,
				image: podcasts.podcastImage,
				itunesImage: podcasts.itunesImage,
				author: podcasts.author,
				itunesExplicit: podcasts.itunesExplicit,
			})
			.from(podcasts)
			.where(eq(podcasts.id, podcastId))
			.then((results) => results[0] || null);
	},
	["podcast-metadata"],
	{ tags: ["podcasts"] },
);

// Get podcast and last episodes
export const getPodcastAndLastEpisodes = unstable_cache(
	async () => {
		const lastEpisode = db
			.select({
				episodeId: episodes.id,
				podcastId: episodes.podcastId,
				rowNum:
					sql<number>`row_number() over (partition by ${episodes.podcastId} order by ${episodes.pubDate} desc)`.as(
						"rowNum",
					),
			})
			.from(episodes)
			.groupBy(episodes.id, episodes.podcastId)
			.as("lastEpisode");

		return db
			.select({
				title: podcasts.title,
				podcastId: podcasts.id,
				image: podcasts.podcastImage,
				itunesImage: podcasts.itunesImage,
				episodeTitle: episodes.title,
				episodeId: episodes.id,
				episodePubDate: episodes.pubDate,
				episodeSlug: episodes.episodeSlug,
				podcastSlug: podcasts.podcastSlug,
			})
			.from(podcasts)
			.innerJoin(
				lastEpisode,
				and(eq(podcasts.id, lastEpisode.podcastId), eq(lastEpisode.rowNum, 1)),
			)
			.innerJoin(episodes, eq(podcasts.id, episodes.podcastId))
			.orderBy(desc(lastEpisode.rowNum));
	},
	["podcasts-and-last-episodes"],
	{ tags: ["podcasts", "episodes"], revalidate: 3600 },
);

// Get all podcasts and last episodes
export const getAllPodcastAndLastEpisodes = unstable_cache(
	async () => {
		const lastEpisodeSubquery = db
			.select({
				podcastId: episodes.podcastId,
				maxPubDate: sql`max(${episodes.pubDate})`.as("maxPubDate"),
			})
			.from(episodes)
			.groupBy(episodes.podcastId)
			.as("lastEpisode");

		return db
			.select({
				title: podcasts.title,
				podcastId: podcasts.id,
				podcastImage: podcasts.podcastImage,
				episodeImage: episodes.episodeImage,
				episodeTitle: episodes.title,
				episodeId: episodes.id,
				episodePubDate: episodes.pubDate,
				episodeSlug: episodes.episodeSlug,
				podcastSlug: podcasts.podcastSlug,
				itunesImage: podcasts.itunesImage,
			})
			.from(podcasts)
			.leftJoin(
				lastEpisodeSubquery,
				eq(podcasts.id, lastEpisodeSubquery.podcastId),
			)
			.leftJoin(
				episodes,
				and(
					eq(podcasts.id, episodes.podcastId),
					eq(episodes.pubDate, lastEpisodeSubquery.maxPubDate),
				),
			)
			.orderBy(desc(lastEpisodeSubquery.maxPubDate));
	},
	["all-podcasts-with-last-episodes"],
	{ tags: ["podcasts", "episodes"], revalidate: 3600 }, // 1 hour in seconds
);

// Get episode titles
export const getEpisodeTitles = unstable_cache(
	async (podcastId: string) => {
		return db
			.select({
				id: episodes.id,
				title: episodes.title,
			})
			.from(episodes)
			.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
			.where(eq(episodes.podcastId, podcastId))
			.orderBy(desc(episodes.pubDate));
	},
	["episode-titles"],
	{ tags: ["episodes"], revalidate: 3600 },
);

// Get episode by slug
export const getEpisode = unstable_cache(
	async (episodeSlug: string) => {
		// console.log("getEpisode - Input slug:", episodeSlug);
		const results = await db
			.select({
				id: episodes.id,
				title: episodes.title,
				pubDate: episodes.pubDate,
				content: episodes.content,
				podcastId: episodes.podcastId,
				podcastTitle: podcasts.title,
				podcastAuthor: podcasts.author,
				podcastImage: podcasts.podcastImage,
				itunesImage: podcasts.itunesImage,
				enclosureUrl: episodes.enclosureUrl,
				duration: episodes.duration,
				explicit: episodes.explicit,
				image: episodes.episodeImage,
				episodeImage: episodes.episodeImage,
				episodeSlug: episodes.episodeSlug,
				podcastSlug: podcasts.podcastSlug,
				link: podcasts.link,
			})
			.from(episodes)
			.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
			.where(eq(episodes.episodeSlug, episodeSlug))
			.limit(1);

		// console.log("getEpisode - Query results:", results);
		const episode = results[0] || null;
		// console.log("getEpisode - Returning episode:", episode);
		return episode;
	},
	["episode"],
	{ tags: ["episodes"], revalidate: 3600 }, // Revalidate every minute
);

// Get podcast by slug
export const getPodcastBySlug = unstable_cache(
	async (podcastSlug: string) => {
		// console.log("getPodcastBySlug - Input slug:", podcastSlug);
		const results = await db
			.select({
				id: podcasts.id,
				title: podcasts.title,
				description: podcasts.description,
				image: podcasts.podcastImage,
				itunesImage: podcasts.itunesImage,
				author: podcasts.author,
				itunesExplicit: podcasts.itunesExplicit,
				podcastSlug: podcasts.podcastSlug,
				vibrantColor: podcasts.vibrantColor,
			})
			.from(podcasts)
			.where(eq(podcasts.podcastSlug, podcastSlug));

		// console.log("getPodcastBySlug - Query results:", results);
		const podcast = results[0] || null;
		// console.log("getPodcastBySlug - Returning podcast:", podcast);
		return podcast;
	},
	["podcast-by-slug", "podcast"],
	{ tags: ["podcasts"], revalidate: 3600 }, // Revalidate every minute
);

// Get last ten episodes by podcast slug
export const getLastTenEpisodesByPodcastSlug = unstable_cache(
	async (podcastSlug: string, limit = 10, offset = 0) => {
		return db
			.select({
				id: episodes.id,
				title: episodes.title,
				pubDate: episodes.pubDate,
				episodeImage: episodes.episodeImage,
				podcastId: episodes.podcastId,
				podcastTitle: podcasts.title,
				podcastImage: podcasts.podcastImage,
				itunesImage: podcasts.itunesImage,
				duration: episodes.duration,
				content: episodes.content,
				episodeSlug: episodes.episodeSlug,
				podcastSlug: podcasts.podcastSlug,
				podcastAuthor: podcasts.author,
				enclosureUrl: episodes.enclosureUrl,
				explicit: episodes.explicit,
				link: episodes.link,
			})
			.from(episodes)
			.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
			.where(eq(podcasts.podcastSlug, podcastSlug))
			.orderBy(desc(episodes.pubDate))
			.limit(limit)
			.offset(offset);
	},
	["last-ten-episodes-by-slug"],
	{ tags: ["episodes"], revalidate: 3600 },
);

// Get featured podcasts
export const getFeaturedPodcasts = unstable_cache(
	async (limit = 3) => {
		return db
			.select({
				id: podcasts.id,
				title: podcasts.title,
				image: podcasts.podcastImage,
				itunesImage: podcasts.itunesImage,
				podcastSlug: podcasts.podcastSlug,
				vibrantColor: podcasts.vibrantColor,
			})
			.from(podcasts)
			.where(
				and(isNotNull(podcasts.podcastImage), like(podcasts.language, "en%")),
			)
			.orderBy(desc(podcasts.episodeCount))
			.limit(limit);
	},
	["featured-podcasts"],
	{ tags: ["podcasts"], revalidate: 3600 },
);

// Get podcast tags
export const getPodcastTags = unstable_cache(
	async (limit = 10) => {
		const result = await db.execute(
			sql`
				WITH tag_extraction AS (
					SELECT 
						unnest(string_to_array(replace(replace(p.title, ',', ' '), '-', ' '), ' ')) as tag_word
					FROM 
						podcasts p
					WHERE 
						p.language LIKE 'en%'
				)
				SELECT 
					tag_word as tag,
					count(*) as count
				FROM 
					tag_extraction
				WHERE 
					length(tag_word) > 3
				GROUP BY 
					tag_word
				ORDER BY 
					count DESC
				LIMIT ${limit}
			`,
		);

		return result as unknown as Array<{ tag: string; count: number }>;
	},
	["podcast-tags"],
	{ tags: ["podcasts"], revalidate: 3600 }, // 1 hour in seconds
);

/**
 * Fetches the latest top running podcasts from Taddy API and updates the podcast_rankings table.
 * Does not delete old rankings, allowing for historical tracking.
 * @returns {Promise<{ inserted: number, totalFetched: number }>} Results of the update operation.
 * @throws {Error} If fetching from Taddy fails or database insertion fails.
 */
export async function updatePodcastRankings(): Promise<{
	inserted: number;
	totalFetched: number;
}> {
	console.log("[Podcast Ranking] Starting update process...");
	try {
		const topPodcasts = await fetchTopRunningPodcasts();
		console.log(
			`[Podcast Ranking] Fetched ${topPodcasts.length} podcasts from Taddy.`,
		);

		if (topPodcasts.length === 0) {
			console.warn("[Podcast Ranking] No podcasts returned from Taddy API.");
			return { inserted: 0, totalFetched: 0 };
		}

		const rankingDataToInsert = topPodcasts.map((podcast, index) => ({
			rank: index + 1, // Rank based on position (1-10)
			taddyUuid: podcast.uuid,
			itunesId: podcast.itunesId,
			podcastName: podcast.name,
			// createdAt will be set by default in the database
		}));

		console.log(
			`[Podcast Ranking] Inserting ${rankingDataToInsert.length} records into podcast_rankings...`,
		);

		const result = await db
			.insert(podcastRankings)
			.values(rankingDataToInsert)
			.returning(); // Return the inserted rows

		console.log(
			`[Podcast Ranking] Successfully inserted ${result.length} records.`, // Drizzle returns array of inserted rows
		);

		return {
			inserted: result.length,
			totalFetched: topPodcasts.length,
		};
	} catch (error) {
		console.error("[Podcast Ranking] Error updating podcast rankings:", error);
		throw error; // Re-throw to be handled by the API route
	}
}

export interface TopRankedPodcast {
	id: string; // Our internal podcast ID
	title: string;
	slug: string; // Our internal podcast slug
	imageUrl: string | null; // Use our podcast image
	rank: number;
	taddyUuid: string;
	podcastName: string; // Name from Taddy ranking
	itunesId: number | null;
}

/**
 * Fetches the latest batch of top ranked podcasts.
 * Queries the podcast_rankings table for the most recent timestamp,
 * joins with the podcasts table on iTunes ID, orders by rank, and limits to 10.
 * Filters out podcasts not found in our database.
 * Cached for 24 hours.
 */
export const getTopRankedPodcasts = unstable_cache(
	async (): Promise<TopRankedPodcast[]> => {
		console.log("[Data Fetching] Fetching top ranked podcasts...");
		try {
			// Subquery to get the latest timestamp directly
			const latestTimestampSubquery = db
				.select({ value: sql<Date>`max(${podcastRankings.createdAt})` })
				.from(podcastRankings);

			// Get rankings joining with podcasts and filtering by the latest timestamp using the subquery
			const results = await db
				.select({
					// Select required fields from podcasts table
					id: podcasts.id,
					title: podcasts.title,
					slug: podcasts.podcastSlug,
					imageUrl: podcasts.podcastImage, // Use our main image
					// Select required fields from podcastRankings table
					rank: podcastRankings.rank,
					taddyUuid: podcastRankings.taddyUuid,
					podcastName: podcastRankings.podcastName,
					itunesId: podcastRankings.itunesId,
				})
				.from(podcastRankings)
				.innerJoin(
					podcasts,
					// Ensure iTunesId is not null and cast integer ranking ID to text for comparison
					and(
						eq(
							sql<string>`${podcastRankings.itunesId}::text`,
							podcasts.iTunesId,
						),
						isNotNull(podcastRankings.itunesId),
						isNotNull(podcasts.iTunesId),
					),
				)
				.where(eq(podcastRankings.createdAt, latestTimestampSubquery)) // Filter using the subquery
				.orderBy(podcastRankings.rank) // Order by rank ascending
				.limit(10); // Limit to top 10

			// Check if any results were found (subquery might return null if table is empty)
			if (results.length === 0) {
				// Attempt to fetch without the timestamp filter if the first query failed,
				// possibly because the subquery didn't resolve as expected or no matches
				console.log(
					"[Data Fetching] No podcasts found with latest timestamp, attempting join without timestamp filter...",
				);
				const fallbackResults = await db
					.select(
						/* same fields */ {
							id: podcasts.id,
							title: podcasts.title,
							slug: podcasts.podcastSlug,
							imageUrl: podcasts.podcastImage,
							rank: podcastRankings.rank,
							taddyUuid: podcastRankings.taddyUuid,
							podcastName: podcastRankings.podcastName,
							itunesId: podcastRankings.itunesId,
						},
					)
					.from(podcastRankings)
					.innerJoin(
						podcasts,
						and(
							eq(
								sql<string>`${podcastRankings.itunesId}::text`,
								podcasts.iTunesId,
							),
							isNotNull(podcastRankings.itunesId),
							isNotNull(podcasts.iTunesId),
						),
					)
					.orderBy(podcastRankings.createdAt, desc(podcastRankings.rank)) // Order by timestamp first, then rank
					.limit(10);
				console.log(
					`[Data Fetching] Fallback query found ${fallbackResults.length} podcasts.`,
				);
				return fallbackResults;
			}

			console.log(
				`[Data Fetching] Found ${results.length} top ranked podcasts after join and timestamp filter.`,
			);

			return results;
		} catch (error) {
			console.error(
				"[Data Fetching] Error fetching top ranked podcasts:",
				error,
			);
			return []; // Return empty array on error to avoid breaking the UI
		}
	},
	["top-ranked-podcasts"], // Cache key
	{ revalidate: 86400, tags: ["podcasts", "rankings"] }, // Revalidate daily (24 hours)
);
