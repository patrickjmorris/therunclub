import { desc, eq, sql, and, max } from "drizzle-orm";
import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "./index";
import { podcasts, episodes } from "./schema";

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

export const getNewEpisodes = unstable_cache(
	async () => {
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
	},
	["new-episodes"],
	{ tags: ["podcasts"] },
);

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

export const getLastTenEpisodesByPodcast = unstable_cache(
	async () => {
		return db
			.select({ id: episodes.id, podcastId: episodes.podcastId })
			.from(episodes)
			.where(
				sql`row_number() over (partition by ${episodes.podcastId} order by ${episodes.pubDate} desc) <= 10`,
			);
	},
	["last-ten-episodes-by-podcast"],
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
	["all-podcasts-and-last-episodes"],
	{ tags: ["podcasts", "episodes"] },
);

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
	async (episodeId: string) => {
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
			})
			.from(episodes)
			.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
			.where(and(eq(episodes.id, episodeId)))
			.then((results) => results[0] || null);
	},
	["episode"],
	{ tags: ["episodes"] },
);

// Function to revalidate cache
export function revalidatePodcastsAndEpisodes() {
	revalidateTag("podcasts");
	revalidateTag("episodes");
}
