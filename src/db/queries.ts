import { desc, eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db/client";
import { podcasts, episodes } from "./schema";

// Function to revalidate cache
export function revalidatePodcastsAndEpisodes() {
	revalidateTag("podcasts");
	revalidateTag("episodes");
}

export const searchEpisodesWithPodcasts = async (query: string) => {
	return db
		.select({
			podcastTitle: podcasts.title,
			podcastId: podcasts.id,
			podcastImage: podcasts.image,
			itunesImage: podcasts.itunesImage,
			episodeTitle: episodes.title,
			episodeId: episodes.id,
			pubDate: episodes.pubDate,
			episodeSlug: episodes.episodeSlug,
			podcastSlug: podcasts.podcastSlug,
		})
		.from(episodes)
		.leftJoin(podcasts, eq(episodes.podcastId, podcasts.id))
		.where(
			sql`to_tsvector('english', ${episodes.title} || ' ' || ${episodes.content}) @@ to_tsquery('english', ${query})`,
		)
		.orderBy(desc(episodes.pubDate));
};
