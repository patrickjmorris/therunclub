import { desc, eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db/client";
import { podcasts, episodes } from "./schema";

// Function to revalidate cache
export function revalidatePodcastsAndEpisodes() {
	// Revalidate main tags
	revalidateTag("podcasts", { expire: 0 });
	revalidateTag("episodes", { expire: 0 });

	// Revalidate specific podcast-related tags
	revalidateTag("podcast", { expire: 0 });
	revalidateTag("podcast-by-slug", { expire: 0 });
	revalidateTag("last-ten-episodes", { expire: 0 });
	revalidateTag("last-ten-episodes-by-slug", { expire: 0 });
	revalidateTag("last-episode", { expire: 0 });
	revalidateTag("podcasts-and-last-episodes", { expire: 0 });
	revalidateTag("all-podcasts-with-last-episodes", { expire: 0 });
	revalidateTag("episode-titles", { expire: 0 });
	revalidateTag("episode", { expire: 0 });
	revalidateTag("featured-podcasts", { expire: 0 });
	revalidateTag("podcast-tags", { expire: 0 });
	revalidateTag("new-episodes", { expire: 0 });
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
