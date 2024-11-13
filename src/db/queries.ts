import { desc, eq, sql, and, max } from "drizzle-orm";
import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "./index";
import {
	podcasts,
	episodes,
	profiles,
	videos,
	channels,
	runningClubs,
} from "./schema";

// Existing query (for reference)
// Need to fix this query
export const getLastEpisodeForEachPodcast = unstable_cache(
	async () => {
		return db
			.select({
				podcastId: podcasts.id,
				podcastTitle: podcasts.title,
				episodeId: episodes.id,
				episodeTitle: episodes.title,
				pubDate: episodes.pubDate,
			})
			.from(podcasts)
			.leftJoin(episodes, eq(podcasts.id, episodes.podcastId))
			.groupBy(podcasts.id, podcasts.title)
			.having(
				eq(
					episodes.pubDate,
					db
						.select({ maxPubDate: sql<Date>`max(${episodes.pubDate})` })
						.from(episodes)
						.where(eq(episodes.podcastId, podcasts.id))
						.as("subquery"),
				),
			)
			.orderBy(desc(episodes.pubDate));
	},
	["last-episodes-for-each-podcast"],
	{ tags: ["podcasts"] },
);

export const getNewEpisodes = async () => {
	return db
		.select({
			podcastId: podcasts.id,
			podcastTitle: podcasts.title,
			podcastImage: podcasts.image,
			podcastSlug: podcasts.podcastSlug,
			episodeId: episodes.id,
			episodeTitle: episodes.title,
			episodeImage: episodes.image,
			episodeDuration: episodes.duration,
			episodeSlug: episodes.episodeSlug,
			pubDate: episodes.pubDate,
		})
		.from(podcasts)
		.leftJoin(episodes, eq(podcasts.id, episodes.podcastId))
		.orderBy(desc(episodes.pubDate))
		.limit(3);
};

// New queries based on episodes.ts functions

export const getLastTenEpisodes = unstable_cache(
	async (podcastId: string) => {
		return db
			.select({
				id: episodes.id,
				title: episodes.title,
				pubDate: episodes.pubDate,
				image: episodes.image,
				podcastId: episodes.podcastId,
				podcastTitle: podcasts.title,
				podcastImage: podcasts.image,
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
	{ tags: ["episodes"] },
);

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
	{ tags: ["episodes"] },
);

export const getLastEpisodesByPodcast = unstable_cache(
	async () => {
		const rankedEpisodes = db
			.select({
				id: episodes.id,
				podcastId: episodes.podcastId,
				episodeSlug: episodes.episodeSlug,
				podcastSlug: podcasts.podcastSlug,
				pubDate: episodes.pubDate,
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
				id: rankedEpisodes.id,
				podcastId: rankedEpisodes.podcastId,
				episodeSlug: rankedEpisodes.episodeSlug,
				podcastSlug: rankedEpisodes.podcastSlug,
				pubDate: rankedEpisodes.pubDate,
			})
			.from(rankedEpisodes)
			.where(sql`${rankedEpisodes.rowNum} <= 100`);
	},
	["last-episodes-by-podcast"],
	{ tags: ["episodes"] },
);

export async function getPodcastById(podcastId: string) {
	return db
		.select()
		.from(podcasts)
		.where(eq(podcasts.id, podcastId))
		.then((results) => results[0] || null);
}

export const getPodcastMetadata = unstable_cache(
	async (podcastId: string) => {
		return db
			.select({
				title: podcasts.title,
				description: podcasts.description,
				image: podcasts.image,
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

export const getPodcastAndLastEpisodes = unstable_cache(
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
				description: podcasts.description,
				image: podcasts.image,
				episodeTitle: episodes.title,
				episodePubDate: episodes.pubDate,
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
	["podcasts-and-last-episodes"],
	{ tags: ["podcasts", "episodes"] },
);

export const getDebugData = unstable_cache(
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
				description: podcasts.description,
				image: podcasts.image,
				episodeTitle: episodes.title,
				episodeId: episodes.id,
				episodePubDate: episodes.pubDate,
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
	["debug-data"],
	{ tags: ["debug"] },
);

export const getAllPodcastAndLastEpisodes = async () => {
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
			image: podcasts.image,
			episodeTitle: episodes.title,
			episodeId: episodes.id,
			episodePubDate: episodes.pubDate,
			episodeSlug: episodes.episodeSlug,
			podcastSlug: podcasts.podcastSlug,
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
};

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
	{ tags: ["episodes"] },
);

export const getEpisode = unstable_cache(
	async (episodeSlug: string) => {
		return db
			.select({
				id: episodes.id,
				title: episodes.title,
				pubDate: episodes.pubDate,
				content: episodes.content,
				podcastId: episodes.podcastId,
				podcastTitle: podcasts.title,
				podcastAuthor: podcasts.author,
				podcastImage: podcasts.image,
				enclosureUrl: episodes.enclosureUrl,
				duration: episodes.duration,
				explicit: episodes.explicit,
				image: episodes.image,
				episodeSlug: episodes.episodeSlug,
				podcastSlug: podcasts.podcastSlug,
			})
			.from(episodes)
			.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
			.where(and(eq(episodes.episodeSlug, episodeSlug)))
			.then((results) => results[0] || null);
	},
	["episode"],
	{ tags: ["episodes"] },
);

export const getPodcastBySlug = unstable_cache(
	async (podcastSlug: string) => {
		return db
			.select({
				id: podcasts.id,
				title: podcasts.title,
				description: podcasts.description,
				image: podcasts.image,
				author: podcasts.author,
				itunesExplicit: podcasts.itunesExplicit,
				podcastSlug: podcasts.podcastSlug,
			})
			.from(podcasts)
			.where(eq(podcasts.podcastSlug, podcastSlug))
			.then((results) => results[0] || null);
	},
	["podcast-by-slug"],
	{ tags: ["podcasts"] },
);

// Function to revalidate cache
export function revalidatePodcastsAndEpisodes() {
	revalidateTag("podcasts");
	revalidateTag("episodes");
}

// Add new function to get episodes by podcast slug
export const getLastTenEpisodesByPodcastSlug = unstable_cache(
	async (podcastSlug: string) => {
		return db
			.select({
				id: episodes.id,
				title: episodes.title,
				pubDate: episodes.pubDate,
				image: episodes.image,
				podcastId: episodes.podcastId,
				podcastTitle: podcasts.title,
				podcastImage: podcasts.image,
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
			.where(eq(podcasts.podcastSlug, podcastSlug))
			.orderBy(desc(episodes.pubDate))
			.limit(10);
	},
	["last-ten-episodes-by-slug"],
	{ tags: ["episodes"] },
);

export const getProfile = unstable_cache(
	async (userId: string) => {
		return db.select().from(profiles).where(eq(profiles.id, userId));
	},
	["profile"],
	{ tags: ["profiles"] },
);

export const getLatestVideos = unstable_cache(
	async () => {
		return db
			.select({
				id: videos.id,
				title: videos.title,
				description: videos.description,
				thumbnailUrl: videos.thumbnailUrl,
				channelTitle: channels.title,
				channelId: channels.id,
				publishedAt: videos.publishedAt,
				duration: videos.duration,
			})
			.from(videos)
			.innerJoin(channels, eq(videos.channelId, channels.id))
			.orderBy(desc(videos.publishedAt))
			.limit(3);
	},
	["latest-videos"],
	{ tags: ["videos"] },
);

export const getPopularRunClubs = unstable_cache(
	async () => {
		return db
			.select({
				id: runningClubs.id,
				clubName: runningClubs.clubName,
				description: runningClubs.description,
				location: runningClubs.location,
				website: runningClubs.website,
				socialMedia: runningClubs.socialMedia,
			})
			.from(runningClubs)
			.limit(3);
	},
	["popular-run-clubs"],
	{ tags: ["run-clubs"] },
);
