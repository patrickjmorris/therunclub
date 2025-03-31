import { db } from "@/db/client";
import { podcasts, episodes, videos, channels, contentTags } from "@/db/schema";
import { desc, eq, and, sql, isNotNull, like } from "drizzle-orm";
import { createWeeklyCache, createDailyCache } from "@/lib/utils/cache";

/**
 * A standardized interface for pagination parameters
 */
export interface PaginationParams {
	page?: number;
	pageSize?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	filter?: Record<string, string | number | boolean | undefined>;
}

/**
 * A standardized interface for pagination results
 */
export interface PaginatedResult<T> {
	data: T[];
	pagination: {
		currentPage: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
}

// Define types for each entity's return shape
export interface VideoResult {
	id: string;
	title: string;
	description: string | null;
	thumbnailUrl: string | null;
	publishedAt: Date | null;
	duration: string | null;
	viewCount: string | null;
	likeCount: string | null;
	channelId: string;
	channelTitle: string;
}

export interface PodcastResult {
	id: string;
	title: string;
	description: string | null;
	podcastImage: string | null;
	podcastSlug: string | null;
	author: string | null;
	lastBuildDate: Date | null;
	episodeCount: number | null;
	language: string | null;
	vibrantColor: string | null;
}

export interface EpisodeResult {
	id: string;
	title: string;
	episodeSlug: string | null;
	pubDate: Date | null;
	duration: string | null;
	enclosureUrl: string | null;
	episodeImage: string | null;
	podcastId: string;
	podcastTitle: string;
	podcastSlug: string | null;
	podcastImage: string | null;
}

/**
 * Get paginated videos with optimized queries
 */
export const getPaginatedVideos = createDailyCache(
	async (
		params: PaginationParams = {},
	): Promise<PaginatedResult<VideoResult>> => {
		const {
			page = 1,
			pageSize = 12,
			sortBy = "publishedAt",
			sortOrder = "desc",
			filter = {},
		} = params;

		// Calculate offset
		const offset = (page - 1) * pageSize;

		// Build WHERE conditions based on filters
		const whereConditions = [];

		if (filter.channelId) {
			whereConditions.push(eq(videos.channelId, String(filter.channelId)));
		}

		if (filter.tag && typeof filter.tag === "string") {
			// Find videos with this tag
			const videoIdsWithTag = db
				.select({ id: contentTags.contentId })
				.from(contentTags)
				.where(
					and(
						eq(contentTags.contentType, "video"),
						eq(contentTags.tag, filter.tag),
					),
				);

			whereConditions.push(sql`${videos.id} IN (${videoIdsWithTag})`);
		}

		// If no conditions, use a simple TRUE condition
		const whereClause =
			whereConditions.length > 0 ? and(...whereConditions) : sql`TRUE`;

		// Execute count query for pagination
		const countResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(videos)
			.where(whereClause);

		const totalCount = Number(countResult[0]?.count || 0);

		// Determine which query to execute based on sort field and order

		let results: VideoResult[];

		const baseSelection = {
			id: videos.id,
			title: videos.title,
			description: videos.description,
			thumbnailUrl: videos.thumbnailUrl,
			publishedAt: videos.publishedAt,
			duration: videos.duration,
			viewCount: videos.viewCount,
			likeCount: videos.likeCount,
			channelId: videos.channelId,
			channelTitle: channels.title,
		};

		// Based on sort options, execute the appropriate query
		if (sortBy === "publishedAt") {
			if (sortOrder === "asc") {
				results = await db
					.select(baseSelection)
					.from(videos)
					.innerJoin(channels, eq(videos.channelId, channels.id))
					.where(whereClause)
					.orderBy(videos.publishedAt)
					.limit(Number(pageSize))
					.offset(offset);
			} else {
				results = await db
					.select(baseSelection)
					.from(videos)
					.innerJoin(channels, eq(videos.channelId, channels.id))
					.where(whereClause)
					.orderBy(desc(videos.publishedAt))
					.limit(Number(pageSize))
					.offset(offset);
			}
		} else if (sortBy === "title") {
			if (sortOrder === "asc") {
				results = await db
					.select(baseSelection)
					.from(videos)
					.innerJoin(channels, eq(videos.channelId, channels.id))
					.where(whereClause)
					.orderBy(videos.title)
					.limit(Number(pageSize))
					.offset(offset);
			} else {
				results = await db
					.select(baseSelection)
					.from(videos)
					.innerJoin(channels, eq(videos.channelId, channels.id))
					.where(whereClause)
					.orderBy(desc(videos.title))
					.limit(Number(pageSize))
					.offset(offset);
			}
		} else if (sortBy === "viewCount") {
			if (sortOrder === "asc") {
				results = await db
					.select(baseSelection)
					.from(videos)
					.innerJoin(channels, eq(videos.channelId, channels.id))
					.where(whereClause)
					.orderBy(sql`CAST(${videos.viewCount} AS INTEGER)`)
					.limit(Number(pageSize))
					.offset(offset);
			} else {
				results = await db
					.select(baseSelection)
					.from(videos)
					.innerJoin(channels, eq(videos.channelId, channels.id))
					.where(whereClause)
					.orderBy(desc(sql`CAST(${videos.viewCount} AS INTEGER)`))
					.limit(Number(pageSize))
					.offset(offset);
			}
		} else {
			// Default sort by publishedAt desc
			results = await db
				.select(baseSelection)
				.from(videos)
				.innerJoin(channels, eq(videos.channelId, channels.id))
				.where(whereClause)
				.orderBy(desc(videos.publishedAt))
				.limit(Number(pageSize))
				.offset(offset);
		}

		// Calculate pagination metadata
		const totalPages = Math.ceil(totalCount / pageSize);

		return {
			data: results,
			pagination: {
				currentPage: page,
				pageSize,
				totalItems: totalCount,
				totalPages,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1,
			},
		};
	},
	["paginated-videos"],
	["videos"],
);

/**
 * Get paginated podcasts with optimized queries
 */
export const getPaginatedPodcasts = createDailyCache(
	async (
		params: PaginationParams = {},
	): Promise<PaginatedResult<PodcastResult>> => {
		const {
			page = 1,
			pageSize = 12,
			sortBy = "lastBuildDate",
			sortOrder = "desc",
			filter = {},
		} = params;

		// Calculate offset
		const offset = (page - 1) * pageSize;

		// Build WHERE conditions based on filters
		const whereConditions = [];

		if (filter.language && typeof filter.language === "string") {
			whereConditions.push(like(podcasts.language, `${filter.language}%`));
		}

		if (filter.tag && typeof filter.tag === "string") {
			// Find podcasts with this tag
			const podcastIdsWithTag = db
				.select({ id: contentTags.contentId })
				.from(contentTags)
				.where(
					and(
						eq(contentTags.contentType, "podcast"),
						eq(contentTags.tag, filter.tag),
					),
				);

			whereConditions.push(sql`${podcasts.id} IN (${podcastIdsWithTag})`);
		}

		// If no conditions, use a simple condition to find non-dead podcasts with images
		if (whereConditions.length === 0) {
			whereConditions.push(
				and(eq(podcasts.isDead, 0), isNotNull(podcasts.podcastImage)),
			);
		}

		const whereClause = and(...whereConditions);

		// Execute count query for pagination
		const countResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(podcasts)
			.where(whereClause);

		const totalCount = Number(countResult[0]?.count || 0);

		// Determine which query to execute based on sort field and order

		let results: PodcastResult[];

		const baseSelection = {
			id: podcasts.id,
			title: podcasts.title,
			description: podcasts.description,
			podcastImage: podcasts.podcastImage,
			podcastSlug: podcasts.podcastSlug,
			author: podcasts.author,
			lastBuildDate: podcasts.lastBuildDate,
			episodeCount: podcasts.episodeCount,
			language: podcasts.language,
			vibrantColor: podcasts.vibrantColor,
		};

		// Based on sort options, execute the appropriate query
		if (sortBy === "lastBuildDate") {
			if (sortOrder === "asc") {
				results = await db
					.select(baseSelection)
					.from(podcasts)
					.where(whereClause)
					.orderBy(podcasts.lastBuildDate)
					.limit(Number(pageSize))
					.offset(offset);
			} else {
				results = await db
					.select(baseSelection)
					.from(podcasts)
					.where(whereClause)
					.orderBy(desc(podcasts.lastBuildDate))
					.limit(Number(pageSize))
					.offset(offset);
			}
		} else if (sortBy === "title") {
			if (sortOrder === "asc") {
				results = await db
					.select(baseSelection)
					.from(podcasts)
					.where(whereClause)
					.orderBy(podcasts.title)
					.limit(Number(pageSize))
					.offset(offset);
			} else {
				results = await db
					.select(baseSelection)
					.from(podcasts)
					.where(whereClause)
					.orderBy(desc(podcasts.title))
					.limit(Number(pageSize))
					.offset(offset);
			}
		} else if (sortBy === "episodeCount") {
			if (sortOrder === "asc") {
				results = await db
					.select(baseSelection)
					.from(podcasts)
					.where(whereClause)
					.orderBy(podcasts.episodeCount)
					.limit(Number(pageSize))
					.offset(offset);
			} else {
				results = await db
					.select(baseSelection)
					.from(podcasts)
					.where(whereClause)
					.orderBy(desc(podcasts.episodeCount))
					.limit(Number(pageSize))
					.offset(offset);
			}
		} else {
			// Default sort by lastBuildDate desc
			results = await db
				.select(baseSelection)
				.from(podcasts)
				.where(whereClause)
				.orderBy(desc(podcasts.lastBuildDate))
				.limit(Number(pageSize))
				.offset(offset);
		}

		// Calculate pagination metadata
		const totalPages = Math.ceil(totalCount / pageSize);

		return {
			data: results,
			pagination: {
				currentPage: page,
				pageSize,
				totalItems: totalCount,
				totalPages,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1,
			},
		};
	},
	["paginated-podcasts"],
	["podcasts"],
);

/**
 * Get paginated episodes with optimized queries
 */
export const getPaginatedEpisodes = createDailyCache(
	async (
		params: PaginationParams = {},
	): Promise<PaginatedResult<EpisodeResult>> => {
		const {
			page = 1,
			pageSize = 12,
			sortBy = "pubDate",
			sortOrder = "desc",
			filter = {},
		} = params;

		// Calculate offset
		const offset = (page - 1) * pageSize;

		// Build WHERE conditions based on filters
		const whereConditions = [];

		if (filter.podcastId) {
			whereConditions.push(eq(episodes.podcastId, String(filter.podcastId)));
		}

		if (filter.tag && typeof filter.tag === "string") {
			// Find episodes with this tag
			const episodeIdsWithTag = db
				.select({ id: contentTags.contentId })
				.from(contentTags)
				.where(
					and(
						eq(contentTags.contentType, "episode"),
						eq(contentTags.tag, filter.tag),
					),
				);

			whereConditions.push(sql`${episodes.id} IN (${episodeIdsWithTag})`);
		}

		// Always include only episodes with a publication date
		whereConditions.push(isNotNull(episodes.pubDate));

		const whereClause = and(...whereConditions);

		// Execute count query for pagination
		const countResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(episodes)
			.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
			.where(whereClause);

		const totalCount = Number(countResult[0]?.count || 0);

		// Determine which query to execute based on sort field and order

		let results: EpisodeResult[];

		const baseSelection = {
			id: episodes.id,
			title: episodes.title,
			episodeSlug: episodes.episodeSlug,
			pubDate: episodes.pubDate,
			duration: episodes.duration,
			enclosureUrl: episodes.enclosureUrl,
			episodeImage: episodes.episodeImage,
			podcastId: podcasts.id,
			podcastTitle: podcasts.title,
			podcastSlug: podcasts.podcastSlug,
			podcastImage: podcasts.podcastImage,
		};

		// Based on sort options, execute the appropriate query
		if (sortBy === "pubDate") {
			if (sortOrder === "asc") {
				results = await db
					.select(baseSelection)
					.from(episodes)
					.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
					.where(whereClause)
					.orderBy(episodes.pubDate)
					.limit(Number(pageSize))
					.offset(offset);
			} else {
				results = await db
					.select(baseSelection)
					.from(episodes)
					.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
					.where(whereClause)
					.orderBy(desc(episodes.pubDate))
					.limit(Number(pageSize))
					.offset(offset);
			}
		} else if (sortBy === "title") {
			if (sortOrder === "asc") {
				results = await db
					.select(baseSelection)
					.from(episodes)
					.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
					.where(whereClause)
					.orderBy(episodes.title)
					.limit(Number(pageSize))
					.offset(offset);
			} else {
				results = await db
					.select(baseSelection)
					.from(episodes)
					.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
					.where(whereClause)
					.orderBy(desc(episodes.title))
					.limit(Number(pageSize))
					.offset(offset);
			}
		} else {
			// Default sort by pubDate desc
			results = await db
				.select(baseSelection)
				.from(episodes)
				.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
				.where(whereClause)
				.orderBy(desc(episodes.pubDate))
				.limit(Number(pageSize))
				.offset(offset);
		}

		// Calculate pagination metadata
		const totalPages = Math.ceil(totalCount / pageSize);

		return {
			data: results,
			pagination: {
				currentPage: page,
				pageSize,
				totalItems: totalCount,
				totalPages,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1,
			},
		};
	},
	["paginated-episodes"],
	["episodes"],
);
