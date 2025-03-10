import { db } from "@/db/client";
import { videos, channels, podcasts, episodes } from "@/db/schema";
import { desc, sql, asc } from "drizzle-orm";
import DOMPurify from "isomorphic-dompurify";
import { cache } from "react";

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
	return query
		.trim()
		.split(/\s+/)
		.map((term) => `${term}:*`)
		.join(" & ");
}

// Cache search results for 5 minutes
export const globalSearch = cache(
	async (query: string, limit = 10): Promise<SearchResult[]> => {
		// Skip empty queries
		if (!query.trim()) {
			return [];
		}

		const formattedQuery = formatSearchQuery(query);

		// Create a unified search query that prioritizes channels and podcasts
		const results = await Promise.all([
			// Search channels - highest priority
			db
				.select({
					type: sql<string>`'channel'`,
					id: channels.id,
					title: channels.title,
					description: sql<string>`substring(coalesce(${channels.description}, ''), 1, 250)`,
					thumbnailUrl: channels.thumbnailUrl,
					publishedAt: channels.createdAt,
					priority: sql<number>`1`, // Highest priority
					rank: sql<number>`ts_rank(
				to_tsvector('english', ${channels.title} || ' ' || coalesce(${channels.description}, '')),
				to_tsquery('english', ${formattedQuery})
			)`,
				})
				.from(channels)
				.where(
					sql`to_tsvector('english', ${channels.title} || ' ' || coalesce(${channels.description}, '')) @@ to_tsquery('english', ${formattedQuery})`,
				)
				.limit(limit),

			// Search podcasts - high priority
			db
				.select({
					type: sql<string>`'podcast'`,
					id: podcasts.id,
					title: podcasts.title,
					description: sql<string>`substring(regexp_replace(${podcasts.description}, '<[^>]*>', '', 'g'), 1, 250)`,
					thumbnailUrl: podcasts.image,
					publishedAt: podcasts.lastBuildDate,
					podcastSlug: podcasts.podcastSlug,
					priority: sql<number>`2`, // High priority
					rank: sql<number>`ts_rank(
				to_tsvector('english', ${podcasts.title} || ' ' || coalesce(regexp_replace(${podcasts.description}, '<[^>]*>', '', 'g'), '')),
				to_tsquery('english', ${formattedQuery})
			)`,
				})
				.from(podcasts)
				.where(
					sql`to_tsvector('english', ${podcasts.title} || ' ' || coalesce(regexp_replace(${podcasts.description}, '<[^>]*>', '', 'g'), '')) @@ to_tsquery('english', ${formattedQuery})`,
				)
				.limit(limit),

			// Search videos - medium priority
			db
				.select({
					type: sql<string>`'video'`,
					id: videos.id,
					title: videos.title,
					description: sql<string>`substring(regexp_replace(${videos.description}, '<[^>]*>', '', 'g'), 1, 250)`,
					thumbnailUrl: videos.thumbnailUrl,
					publishedAt: videos.publishedAt,
					channelId: videos.channelId,
					channelTitle: channels.title,
					priority: sql<number>`3`, // Medium priority
					rank: sql<number>`ts_rank(
				to_tsvector('english', ${videos.title} || ' ' || coalesce(regexp_replace(${videos.description}, '<[^>]*>', '', 'g'), '')),
				to_tsquery('english', ${formattedQuery})
			)`,
				})
				.from(videos)
				.leftJoin(channels, sql`${videos.channelId} = ${channels.id}`)
				.where(
					sql`to_tsvector('english', ${videos.title} || ' ' || coalesce(regexp_replace(${videos.description}, '<[^>]*>', '', 'g'), '')) @@ to_tsquery('english', ${formattedQuery})`,
				)
				.limit(limit),

			// Search episodes - lowest priority
			db
				.select({
					type: sql<string>`'episode'`,
					id: episodes.id,
					title: episodes.title,
					description: sql<string>`substring(regexp_replace(${episodes.content}, '<[^>]*>', '', 'g'), 1, 250)`,
					thumbnailUrl: sql<string>`coalesce(${episodes.image}, ${podcasts.image})`,
					publishedAt: episodes.pubDate,
					episodeSlug: episodes.episodeSlug,
					podcastId: episodes.podcastId,
					podcastSlug: podcasts.podcastSlug,
					podcastTitle: podcasts.title,
					priority: sql<number>`4`, // Lowest priority
					rank: sql<number>`ts_rank(
				to_tsvector('english', ${episodes.title} || ' ' || coalesce(regexp_replace(${episodes.content}, '<[^>]*>', '', 'g'), '')),
				to_tsquery('english', ${formattedQuery})
			)`,
				})
				.from(episodes)
				.leftJoin(podcasts, sql`${episodes.podcastId} = ${podcasts.id}`)
				.where(
					sql`to_tsvector('english', ${episodes.title} || ' ' || coalesce(regexp_replace(${episodes.content}, '<[^>]*>', '', 'g'), '')) @@ to_tsquery('english', ${formattedQuery})`,
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
			})),
		];

		// Sort by priority first (lower number = higher priority), then by rank
		formattedResults.sort((a, b) => {
			// First sort by priority
			const priorityDiff = (a.priority || 999) - (b.priority || 999);
			if (priorityDiff !== 0) return priorityDiff;

			// If same priority, sort by date (newer first)
			if (a.publishedAt && b.publishedAt) {
				return b.publishedAt.getTime() - a.publishedAt.getTime();
			}

			return 0;
		});

		// Return limited results
		return formattedResults.slice(0, limit);
	},
);
