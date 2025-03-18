import { db } from "@/db/client";
import { contentTags, videos, episodes, podcasts } from "@/db/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { subDays, format } from "date-fns";

// Get the top tags from the past X days
export async function getTopTags(
	contentType: "video" | "episode" | "podcast",
	daysAgo = 14,
	limit = 5,
) {
	const cutoffDate = subDays(new Date(), daysAgo);
	const formattedDate = format(cutoffDate, "yyyy-MM-dd HH:mm:ss");

	return db
		.select({
			tag: contentTags.tag,
			count: count(contentTags.id),
		})
		.from(contentTags)
		.where(
			and(
				eq(contentTags.contentType, contentType),
				sql`${contentTags.createdAt} >= ${formattedDate}::timestamp`,
			),
		)
		.groupBy(contentTags.tag)
		.orderBy(desc(sql`count`))
		.limit(limit);
}

// Get videos by tag
export async function getVideosByTag(tag: string, limit = 6) {
	return db
		.select({
			id: videos.id,
			title: videos.title,
			description: videos.description,
			thumbnailUrl: videos.thumbnailUrl,
			publishedAt: videos.publishedAt,
			channelTitle: videos.channelTitle,
			youtubeVideoId: videos.youtubeVideoId,
		})
		.from(videos)
		.innerJoin(
			contentTags,
			and(
				eq(videos.id, contentTags.contentId),
				eq(contentTags.contentType, "video"),
				eq(contentTags.tag, tag),
			),
		)
		.orderBy(desc(videos.publishedAt))
		.limit(limit);
}

// Get episodes by tag
export async function getEpisodesByTag(tag: string, limit = 6) {
	return db
		.select({
			id: episodes.id,
			title: episodes.title,
			podcastId: episodes.podcastId,
			episodeSlug: episodes.episodeSlug,
			pubDate: episodes.pubDate,
			enclosureUrl: episodes.enclosureUrl,
			image: episodes.episodeImage,
			// Join with podcasts to get podcast info
			podcastTitle: podcasts.title,
			podcastSlug: podcasts.podcastSlug,
			podcastImage: podcasts.podcastImage,
		})
		.from(episodes)
		.innerJoin(
			contentTags,
			and(
				eq(episodes.id, contentTags.contentId),
				eq(contentTags.contentType, "episode"),
				eq(contentTags.tag, tag),
			),
		)
		.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
		.orderBy(desc(episodes.pubDate))
		.limit(limit);
}
