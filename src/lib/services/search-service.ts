import { db } from "@/db/client";
import { videos, channels, podcasts, episodes } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import DOMPurify from "isomorphic-dompurify";

export type SearchResult = {
	type: "video" | "podcast" | "episode";
	id: string;
	title: string;
	description: string | null;
	thumbnailUrl: string | null;
	publishedAt: Date | null;
	url: string;
	// Additional fields based on type
	channelTitle?: string | null;
	podcastTitle?: string | null;
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

export async function globalSearch(
	query: string,
	limit = 5,
): Promise<SearchResult[]> {
	// Format the query for PostgreSQL full-text search
	const formattedQuery = query
		.trim()
		.split(/\s+/)
		.map((term) => `${term}:*`)
		.join(" & ");

	// Search videos
	const videoResults = await db
		.select({
			video: {
				id: videos.id,
				title: videos.title,
				description: sql<string>`substring(regexp_replace(${videos.description}, '<[^>]*>', '', 'g'), 1, 250)`,
				thumbnailUrl: videos.thumbnailUrl,
				publishedAt: videos.publishedAt,
				channelId: videos.channelId,
				viewCount: videos.viewCount,
			},
			channel: channels,
		})
		.from(videos)
		.leftJoin(channels, sql`${videos.channelId} = ${channels.id}`)
		.where(
			sql`to_tsvector('english', ${videos.title} || ' ' || coalesce(regexp_replace(${videos.description}, '<[^>]*>', '', 'g'), '')) @@ to_tsquery('english', ${formattedQuery})`,
		)
		.orderBy(
			desc(
				sql`
					(log(CAST(NULLIF(${videos.viewCount}, '0') AS INTEGER) + 1) * 0.25) + 
					(pow(0.95, extract(days from now() - ${videos.publishedAt})) * 0.6) + 
					(ts_rank(
						to_tsvector('english', ${videos.title} || ' ' || coalesce(regexp_replace(${videos.description}, '<[^>]*>', '', 'g'), '')),
						to_tsquery('english', ${formattedQuery})
					) * 0.15)
				`,
			),
		)
		.limit(limit);

	// Search podcasts with improved scoring
	const podcastResults = await db
		.select({
			id: podcasts.id,
			title: podcasts.title,
			description: sql<string>`substring(regexp_replace(${podcasts.description}, '<[^>]*>', '', 'g'), 1, 250)`,
			image: podcasts.image,
			lastBuildDate: podcasts.lastBuildDate,
			podcastSlug: podcasts.podcastSlug,
		})
		.from(podcasts)
		.where(
			sql`to_tsvector('english', ${podcasts.title} || ' ' || coalesce(substring(regexp_replace(${podcasts.description}, '<[^>]*>', '', 'g'), 1, 300), '')) @@ to_tsquery('english', ${formattedQuery})`,
		)
		.orderBy(
			desc(
				sql`
					(pow(0.95, extract(days from now() - ${podcasts.lastBuildDate})) * 0.7) + 
					(ts_rank(
						to_tsvector('english', ${podcasts.title} || ' ' || coalesce(regexp_replace(${podcasts.description}, '<[^>]*>', '', 'g'), '')),
						to_tsquery('english', ${formattedQuery})
					) * 0.3)
				`,
			),
		)
		.limit(limit);

	// Search episodes with improved scoring
	const episodeResults = await db
		.select({
			episode: {
				id: episodes.id,
				title: episodes.title,
				content: sql<string>`substring(regexp_replace(${episodes.content}, '<[^>]*>', '', 'g'), 1, 250)`,
				image: episodes.image,
				pubDate: episodes.pubDate,
				episodeSlug: episodes.episodeSlug,
				podcastId: episodes.podcastId,
			},
			podcast: podcasts,
		})
		.from(episodes)
		.leftJoin(podcasts, sql`${episodes.podcastId} = ${podcasts.id}`)
		.where(
			sql`to_tsvector('english', ${episodes.title} || ' ' || coalesce(substring(regexp_replace(${episodes.content}, '<[^>]*>', '', 'g'), 1, 300), '')) @@ to_tsquery('english', ${formattedQuery})`,
		)
		.orderBy(
			desc(
				sql`
					(pow(0.95, extract(days from now() - ${episodes.pubDate})) * 0.7) + 
					(ts_rank(
						to_tsvector('english', ${episodes.title} || ' ' || coalesce(regexp_replace(${episodes.content}, '<[^>]*>', '', 'g'), '')),
						to_tsquery('english', ${formattedQuery})
					) * 0.3)
				`,
			),
		)
		.limit(limit);

	// Format video results
	const formattedVideoResults: SearchResult[] = videoResults.map((result) => ({
		type: "video",
		id: result.video.id,
		title: result.video.title,
		description: result.video.description,
		thumbnailUrl: result.video.thumbnailUrl,
		publishedAt: result.video.publishedAt,
		url: `/videos/${result.video.id}`,
		channelTitle: result.channel?.title,
	}));

	// Format podcast results
	const formattedPodcastResults: SearchResult[] = podcastResults.map(
		(podcast) => ({
			type: "podcast",
			id: podcast.id,
			title: podcast.title,
			description: podcast.description,
			thumbnailUrl: podcast.image,
			publishedAt: podcast.lastBuildDate,
			url: `/podcasts/${podcast.podcastSlug}`,
		}),
	);

	// Format episode results
	const formattedEpisodeResults: SearchResult[] = episodeResults.map(
		(result) => ({
			type: "episode",
			id: result.episode.id,
			title: result.episode.title,
			description: result.episode.content,
			thumbnailUrl: result.podcast?.image || result.episode.image,
			publishedAt: result.episode.pubDate,
			url: `/podcasts/${result.podcast?.podcastSlug}/${result.episode.episodeSlug}`,
			podcastTitle: result.podcast?.title,
		}),
	);

	// Combine and return all results
	return [
		...formattedVideoResults,
		...formattedPodcastResults,
		...formattedEpisodeResults,
	];
}
