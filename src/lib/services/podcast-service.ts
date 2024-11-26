import { db } from "@/db/client";
import { podcasts, episodes, type Podcast, type Episode } from "@/db/schema";
import { desc, ilike, sql } from "drizzle-orm";

// Get latest podcasts
export async function getLatestPodcasts(limit = 30, offset = 0) {
  return db
    .select()
    .from(podcasts)
    .orderBy(desc(podcasts.lastBuildDate))
    .limit(limit)
    .offset(offset);
}

// Search podcasts
export async function searchPodcasts(query: string, limit = 30) {
  return db
    .select()
    .from(podcasts)
    .where(
      sql`to_tsvector('english', ${podcasts.title} || ' ' || ${podcasts.description}) @@ to_tsquery('english', ${query})`
    )
    .orderBy(desc(podcasts.lastBuildDate))
    .limit(limit);
}

// Get podcast by ID
export async function getPodcastById(podcastId: string) {
  const [podcast] = await db
    .select()
    .from(podcasts)
    .where(sql`${podcasts.id} = ${podcastId}`)
    .limit(1);

  return podcast;
}

// Get episodes for a podcast
export async function getPodcastEpisodes(podcastId: string, limit = 30) {
  return db
    .select()
    .from(episodes)
    .where(sql`${episodes.podcastId} = ${podcastId}`)
    .orderBy(desc(episodes.pubDate))
    .limit(limit);
}

// Search episodes
export async function searchEpisodes(query: string, limit = 30) {
  return db
    .select({
      episode: episodes,
      podcast: podcasts,
    })
    .from(episodes)
    .leftJoin(podcasts, sql`${episodes.podcastId} = ${podcasts.id}`)
    .where(
      sql`to_tsvector('english', ${episodes.title} || ' ' || ${episodes.content}) @@ to_tsquery('english', ${query})`
    )
    .orderBy(desc(episodes.pubDate))
    .limit(limit);
}

// Types for the combined queries
export type EpisodeWithPodcast = {
  episode: Episode;
  podcast: Podcast;
};
