import { db } from "@/db/client";
import { contentTags, videos, episodes, podcasts } from "@/db/schema";
import { eq, and, desc, sql, count, gte, inArray } from "drizzle-orm";
import { subDays, format } from "date-fns";
import { createDailyCache } from "@/lib/utils/cache";

// Get the top tags from the past X days
export async function getTopTags(
	contentType: "video" | "episode" | "podcast",
	daysAgo = 5,
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

// Below this a tag page is a handful of links, too thin to index.
const MIN_ITEMS_PER_TAG = 10;

export type TagHubType = "episode" | "video";

export interface TagHub {
	type: TagHubType;
	tag: string;
	count: number;
	lastModified: string;
}

export const getTagHubs = createDailyCache(
	async (): Promise<TagHub[]> => {
		const rows = await db
			.select({
				type: contentTags.contentType,
				tag: contentTags.tag,
				count: count(),
				lastModified: sql<string>`max(${contentTags.createdAt})`,
			})
			.from(contentTags)
			.where(inArray(contentTags.contentType, ["episode", "video"]))
			.groupBy(contentTags.contentType, contentTags.tag)
			.having(gte(count(), MIN_ITEMS_PER_TAG))
			.orderBy(desc(count()), contentTags.tag);
		return rows.map((row) => ({
			type: row.type as TagHubType,
			tag: row.tag,
			count: row.count,
			lastModified: new Date(row.lastModified).toISOString(),
		}));
	},
	["tag-hubs"],
	["tags"],
);

export function tagHubPath(hub: Pick<TagHub, "type" | "tag">) {
	return `/tags/${hub.type}/${encodeURIComponent(hub.tag)}`;
}
