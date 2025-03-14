import { desc, eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db/client";
import { podcasts, episodes } from "./schema";

// Function to revalidate cache
export function revalidatePodcastsAndEpisodes() {
	// Revalidate main tags
	revalidateTag("podcasts");
	revalidateTag("episodes");

	// Revalidate specific podcast-related tags
	revalidateTag("podcast");
	revalidateTag("podcast-by-slug");
	revalidateTag("last-ten-episodes");
	revalidateTag("last-ten-episodes-by-slug");
	revalidateTag("last-episode");
	revalidateTag("podcasts-and-last-episodes");
	revalidateTag("all-podcasts-with-last-episodes");
	revalidateTag("episode-titles");
	revalidateTag("episode");
	revalidateTag("featured-podcasts");
	revalidateTag("podcast-tags");
	revalidateTag("new-episodes");
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
			enclosureUrl: episodes.enclosureUrl,
		})
		.from(episodes)
		.leftJoin(podcasts, eq(episodes.podcastId, podcasts.id))
		.where(
			sql`to_tsvector('english', ${episodes.title} || ' ' || ${episodes.content}) @@ to_tsquery('english', ${query})`,
		)
		.orderBy(desc(episodes.pubDate));
};
