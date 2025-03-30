import { db } from "@/db/client";
import { videos, channels, podcasts, episodes } from "@/db/schema";
import { desc, sql, asc } from "drizzle-orm";
import DOMPurify from "isomorphic-dompurify";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createWeeklyCache } from "@/lib/utils/cache";
import { eq } from "drizzle-orm";

export type SearchResult = {
	type: "video" | "podcast" | "episode" | "channel";
	id: string;
	title: string;
	description: string | null;
	thumbnailUrl: string | null;
	publishedAt: Date | null;
	url: string;
	// Additional fields based on type
	channelTitle?: string | null;
	podcastTitle?: string | null;
	// For ranking and filtering
	priority?: number;
	rank?: number;
};

export type PodcastSearchResult = SearchResult & {
	podcastId: string;
	feedUrl: string | null;
	lastBuildDate: Date | null;
};

// Helper function to strip HTML and limit text length
function processContent(
	content: string | null,
	maxLength = 250,
): string | null {
	if (!content) return null;
	// Strip HTML tags and get text content only
	const textContent = DOMPurify.sanitize(content, { ALLOWED_TAGS: [] });
	return textContent.substring(0, maxLength);
}

// Format the query for PostgreSQL full-text search
function formatSearchQuery(query: string): string {
	// Normalize the query: remove special characters, convert to lowercase
	const normalizedQuery = query
		.trim()
		.toLowerCase()
		.replace(/[^\w\s]/g, " ");

	// Split into words and apply prefix matching
	return normalizedQuery
		.split(/\s+/)
		.filter((term) => term.length > 0)
		.map((term) => `${term}:*`)
		.join(" & ");
}

// Create a more efficient search query using the GIN indexes
function createSearchCondition(
	tableName: string,
	titleField: string,
	contentField: string,
	formattedQuery: string,
) {
	return sql`to_tsvector('english', ${sql.raw(tableName)}.${sql.raw(
		titleField,
	)} || ' ' || coalesce(substring(${sql.raw(tableName)}.${sql.raw(
		contentField,
	)}, 1, 1000), '')) @@ to_tsquery('english', ${formattedQuery})`;
}

// Create a rank calculation function that uses substring
function createRankExpression(
	tableName: string,
	titleField: string,
	contentField: string,
	formattedQuery: string,
) {
	return sql<number>`ts_rank(to_tsvector('english', ${sql.raw(
		tableName,
	)}.${sql.raw(titleField)} || ' ' || coalesce(substring(${sql.raw(
		tableName,
	)}.${sql.raw(
		contentField,
	)}, 1, 1000), '')), to_tsquery('english', ${formattedQuery}))`;
}

// Server-side cache with longer TTL (10 minutes)
export const globalSearch = unstable_cache(
	async (query: string, limit = 10): Promise<SearchResult[]> => {
		// Skip empty queries
		if (!query.trim()) {
			return [];
		}

		const formattedQuery = formatSearchQuery(query);

		// Reduce the number of fields we're selecting to improve performance
		const results = await Promise.all([
			// Search channels - highest priority
			db
				.select({
					type: sql<string>`'channel'`,
					id: channels.id,
					title: channels.title,
					description: sql<string>`substring(coalesce(${channels.description}, ''), 1, 150)`, // Reduced length
					thumbnailUrl: channels.thumbnailUrl,
					publishedAt: channels.createdAt,
					priority: sql<number>`1`, // Highest priority
					rank: createRankExpression(
						"channels",
						"title",
						"description",
						formattedQuery,
					),
				})
				.from(channels)
				.where(
					createSearchCondition(
						"channels",
						"title",
						"description",
						formattedQuery,
					),
				)
				.orderBy(
					desc(
						createRankExpression(
							"channels",
							"title",
							"description",
							formattedQuery,
						),
					),
				)
				.limit(limit),

			// Search podcasts - high priority
			db
				.select({
					type: sql<string>`'podcast'`,
					id: podcasts.id,
					title: podcasts.title,
					description: sql<string>`substring(${podcasts.description}, 1, 150)`, // Simplified and reduced length
					thumbnailUrl: podcasts.podcastImage,
					publishedAt: podcasts.lastBuildDate,
					podcastSlug: podcasts.podcastSlug,
					priority: sql<number>`2`, // High priority
					rank: createRankExpression(
						"podcasts",
						"title",
						"description",
						formattedQuery,
					),
				})
				.from(podcasts)
				.where(
					createSearchCondition(
						"podcasts",
						"title",
						"description",
						formattedQuery,
					),
				)
				.orderBy(
					desc(
						createRankExpression(
							"podcasts",
							"title",
							"description",
							formattedQuery,
						),
					),
				)
				.limit(limit),

			// Search videos - medium priority
			db
				.select({
					type: sql<string>`'video'`,
					id: videos.id,
					title: videos.title,
					description: sql<string>`substring(${videos.description}, 1, 150)`, // Simplified and reduced length
					thumbnailUrl: videos.thumbnailUrl,
					publishedAt: videos.publishedAt,
					channelId: videos.channelId,
					channelTitle: channels.title,
					priority: sql<number>`3`, // Medium priority
					rank: createRankExpression(
						"videos",
						"title",
						"description",
						formattedQuery,
					),
				})
				.from(videos)
				.leftJoin(channels, sql`${videos.channelId} = ${channels.id}`)
				.where(
					createSearchCondition(
						"videos",
						"title",
						"description",
						formattedQuery,
					),
				)
				.orderBy(
					desc(
						createRankExpression(
							"videos",
							"title",
							"description",
							formattedQuery,
						),
					),
				)
				.limit(limit),

			// Search episodes - lowest priority
			db
				.select({
					type: sql<string>`'episode'`,
					id: episodes.id,
					title: episodes.title,
					description: sql<string>`substring(${episodes.content}, 1, 150)`, // Simplified and reduced length
					thumbnailUrl: sql<string>`coalesce(${episodes.episodeImage}, ${podcasts.podcastImage})`,
					publishedAt: episodes.pubDate,
					episodeSlug: episodes.episodeSlug,
					podcastId: episodes.podcastId,
					podcastSlug: podcasts.podcastSlug,
					podcastTitle: podcasts.title,
					priority: sql<number>`4`, // Lowest priority
					rank: createRankExpression(
						"episodes",
						"title",
						"content",
						formattedQuery,
					),
				})
				.from(episodes)
				.leftJoin(podcasts, sql`${episodes.podcastId} = ${podcasts.id}`)
				.where(
					createSearchCondition("episodes", "title", "content", formattedQuery),
				)
				.orderBy(
					desc(
						createRankExpression(
							"episodes",
							"title",
							"content",
							formattedQuery,
						),
					),
				)
				.limit(limit),
		]);

		// Flatten and format results
		const formattedResults: SearchResult[] = [
			// Format channel results
			...results[0].map((channel) => ({
				type: "channel" as const,
				id: channel.id,
				title: channel.title,
				description: channel.description,
				thumbnailUrl: channel.thumbnailUrl,
				publishedAt: channel.publishedAt,
				url: `/videos/channels/${channel.id}`,
				priority: channel.priority,
				rank: channel.rank,
			})),

			// Format podcast results
			...results[1].map((podcast) => ({
				type: "podcast" as const,
				id: podcast.id,
				title: podcast.title,
				description: podcast.description,
				thumbnailUrl: podcast.thumbnailUrl,
				publishedAt: podcast.publishedAt,
				url: `/podcasts/${podcast.podcastSlug}`,
				priority: podcast.priority,
				rank: podcast.rank,
			})),

			// Format video results
			...results[2].map((video) => ({
				type: "video" as const,
				id: video.id,
				title: video.title,
				description: video.description,
				thumbnailUrl: video.thumbnailUrl,
				publishedAt: video.publishedAt,
				url: `/videos/${video.id}`,
				channelTitle: video.channelTitle,
				priority: video.priority,
				rank: video.rank,
			})),

			// Format episode results
			...results[3].map((episode) => ({
				type: "episode" as const,
				id: episode.id,
				title: episode.title,
				description: episode.description,
				thumbnailUrl: episode.thumbnailUrl,
				publishedAt: episode.publishedAt,
				url: `/podcasts/${episode.podcastSlug}/${episode.episodeSlug}`,
				podcastTitle: episode.podcastTitle,
				priority: episode.priority,
				rank: episode.rank,
			})),
		];

		// Improved sorting algorithm that considers both priority and rank
		formattedResults.sort((a, b) => {
			// First sort by priority
			const priorityDiff = (a.priority || 999) - (b.priority || 999);
			if (priorityDiff !== 0) return priorityDiff;

			// If same priority, sort by rank (higher rank first)
			if (a.rank !== undefined && b.rank !== undefined) {
				return b.rank - a.rank;
			}

			// If rank not available, sort by date (newer first)
			if (a.publishedAt && b.publishedAt) {
				return b.publishedAt.getTime() - a.publishedAt.getTime();
			}

			return 0;
		});

		// Return limited results
		return formattedResults.slice(0, limit);
	},
	["global-search"], // Cache key
	{ revalidate: 600 }, // 10 minutes TTL
);

/**
 * Prepare a search query for PostgreSQL tsquery
 * This converts a user input string into a properly formatted tsquery
 */
function prepareSearchQuery(query: string): string {
	// Trim whitespace and ensure the query is not empty
	const trimmedQuery = query.trim();
	if (!trimmedQuery) return "";

	// Split the query into words and filter out empty strings
	const words = trimmedQuery
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => {
			// Escape special characters and add :* for prefix matching
			const escaped = word.replace(/['&|!:*()]/g, "\\$&");
			return `${escaped}:*`;
		});

	// Join words with & for AND logic
	return words.join(" & ");
}

/**
 * Optimized universal search across podcasts, episodes, and videos
 * Uses plainto_tsquery for safer user input handling
 */
export const universalSearch = createWeeklyCache(
	async (query: string, limit = 30) => {
		if (!query || query.trim().length < 2) {
			return {
				podcasts: [],
				episodes: [],
				videos: [],
			};
		}

		const preparedQuery = prepareSearchQuery(query);

		// Execute searches in parallel for better performance
		const [podcastResults, episodeResults, videoResults] = await Promise.all([
			// Podcast search
			db
				.select({
					id: podcasts.id,
					title: podcasts.title,
					image: podcasts.podcastImage,
					description: podcasts.description,
					type: sql<string>`'podcast'`.as("type"),
					rank: sql<number>`ts_rank(
					to_tsvector('english', ${podcasts.title} || ' ' || COALESCE(${podcasts.description}, '')), 
					to_tsquery('english', ${preparedQuery})
				)`.as("rank"),
				})
				.from(podcasts)
				.where(
					sql`to_tsvector('english', ${podcasts.title} || ' ' || COALESCE(${podcasts.description}, '')) @@ to_tsquery('english', ${preparedQuery})`,
				)
				.orderBy(desc(sql<string>`rank`))
				.limit(Number(limit)),

			// Episode search
			db
				.select({
					id: episodes.id,
					title: episodes.title,
					podcastId: episodes.podcastId,
					podcastTitle: podcasts.title,
					podcastImage: podcasts.podcastImage,
					podcastSlug: podcasts.podcastSlug,
					episodeSlug: episodes.episodeSlug,
					pubDate: episodes.pubDate,
					type: sql<string>`'episode'`.as("type"),
					rank: sql<number>`ts_rank(
					to_tsvector('english', ${episodes.title} || ' ' || COALESCE(${episodes.content}, '')), 
					to_tsquery('english', ${preparedQuery})
				)`.as("rank"),
				})
				.from(episodes)
				.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id)) // Use INNER JOIN instead of LEFT JOIN
				.where(
					sql`to_tsvector('english', ${episodes.title} || ' ' || COALESCE(${episodes.content}, '')) @@ to_tsquery('english', ${preparedQuery})`,
				)
				.orderBy(desc(sql<string>`rank`))
				.limit(Number(limit)),

			// Video search
			db
				.select({
					id: videos.id,
					title: videos.title,
					description: videos.description,
					thumbnailUrl: videos.thumbnailUrl,
					channelTitle: channels.title,
					publishedAt: videos.publishedAt,
					type: sql<string>`'video'`.as("type"),
					rank: sql<number>`ts_rank(
					to_tsvector('english', ${videos.title} || ' ' || COALESCE(${videos.description}, '')), 
					to_tsquery('english', ${preparedQuery})
				)`.as("rank"),
				})
				.from(videos)
				.innerJoin(channels, eq(videos.channelId, channels.id))
				.where(
					sql`to_tsvector('english', ${videos.title} || ' ' || COALESCE(${videos.description}, '')) @@ to_tsquery('english', ${preparedQuery})`,
				)
				.orderBy(desc(sql<string>`rank`))
				.limit(Number(limit)),
		]);

		return {
			podcasts: podcastResults,
			episodes: episodeResults,
			videos: videoResults,
		};
	},
	["universal-search"],
	["search"],
);

/**
 * Enhanced search for podcasts with ranking
 */
export const searchPodcasts = createWeeklyCache(
	async (query: string, limit = 30) => {
		if (!query || query.trim().length < 2) {
			return [];
		}

		const preparedQuery = prepareSearchQuery(query);

		return db
			.select({
				id: podcasts.id,
				title: podcasts.title,
				image: podcasts.podcastImage,
				description: podcasts.description,
				podcastSlug: podcasts.podcastSlug,
				rank: sql<number>`ts_rank(
				to_tsvector('english', ${podcasts.title} || ' ' || COALESCE(${podcasts.description}, '')), 
				to_tsquery('english', ${preparedQuery})
			)`.as("rank"),
			})
			.from(podcasts)
			.where(
				sql`to_tsvector('english', ${podcasts.title} || ' ' || COALESCE(${podcasts.description}, '')) @@ to_tsquery('english', ${preparedQuery})`,
			)
			.orderBy(desc(sql<string>`rank`))
			.limit(Number(limit));
	},
	["search-podcasts"],
	["search", "podcasts"],
);

/**
 * Enhanced search for episodes with ranking
 */
export const searchEpisodes = createWeeklyCache(
	async (query: string, limit = 30) => {
		if (!query || query.trim().length < 2) {
			return [];
		}

		const preparedQuery = prepareSearchQuery(query);

		return db
			.select({
				id: episodes.id,
				title: episodes.title,
				content: episodes.content,
				podcastId: episodes.podcastId,
				podcastTitle: podcasts.title,
				podcastImage: podcasts.podcastImage,
				podcastSlug: podcasts.podcastSlug,
				episodeSlug: episodes.episodeSlug,
				pubDate: episodes.pubDate,
				rank: sql<number>`ts_rank(
				to_tsvector('english', ${episodes.title} || ' ' || COALESCE(${episodes.content}, '')), 
				to_tsquery('english', ${preparedQuery})
			)`.as("rank"),
			})
			.from(episodes)
			.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
			.where(
				sql`to_tsvector('english', ${episodes.title} || ' ' || COALESCE(${episodes.content}, '')) @@ to_tsquery('english', ${preparedQuery})`,
			)
			.orderBy(desc(sql<string>`rank`))
			.limit(Number(limit));
	},
	["search-episodes"],
	["search", "episodes"],
);

/**
 * Enhanced search for videos with ranking
 */
export const searchVideos = createWeeklyCache(
	async (query: string, limit = 30) => {
		if (!query || query.trim().length < 2) {
			return [];
		}

		const preparedQuery = prepareSearchQuery(query);

		return db
			.select({
				id: videos.id,
				title: videos.title,
				description: videos.description,
				thumbnailUrl: videos.thumbnailUrl,
				channelId: videos.channelId,
				channelTitle: channels.title,
				publishedAt: videos.publishedAt,
				rank: sql<number>`ts_rank(
				to_tsvector('english', ${videos.title} || ' ' || COALESCE(${videos.description}, '')), 
				to_tsquery('english', ${preparedQuery})
			)`.as("rank"),
			})
			.from(videos)
			.innerJoin(channels, eq(videos.channelId, channels.id))
			.where(
				sql`to_tsvector('english', ${videos.title} || ' ' || COALESCE(${videos.description}, '')) @@ to_tsquery('english', ${preparedQuery})`,
			)
			.orderBy(desc(sql<string>`rank`))
			.limit(Number(limit));
	},
	["search-videos"],
	["search", "videos"],
);
