import { desc, eq, sql, and } from 'drizzle-orm';
import { unstable_cache, revalidateTag } from 'next/cache';
import { db } from './index';
import { podcasts, episodes } from './schema';

// Existing query (for reference)
export const getLastEpisodeForEachPodcast = unstable_cache(
    async () => {
      return db.select({
        podcastId: podcasts.uuid,
        podcastTitle: podcasts.title,
        episodeId: episodes.id,
        episodeTitle: episodes.title,
        pubDate: episodes.pubDate,
      })
      .from(podcasts)
      .leftJoin(episodes, eq(podcasts.uuid, episodes.podcastId))
      .groupBy(podcasts.uuid, podcasts.title)
      .having(
        eq(
          episodes.pubDate,
          db.select({ maxPubDate: sql<Date>`max(${episodes.pubDate})` })
            .from(episodes)
            .where(eq(episodes.podcastId, podcasts.uuid))
            .as('subquery')
        )
      )
      .orderBy(desc(episodes.pubDate));
    },
    ['last-episodes-for-each-podcast'],
    { tags: ['podcasts'] }
  );

// New queries based on episodes.ts functions

export const getLastTenEpisodes = unstable_cache(
  async (podcastTitle: string) => {
    return db.select()
      .from(episodes)
      .innerJoin(podcasts, eq(episodes.podcastId, podcasts.uuid))
      .where(eq(podcasts.title, podcastTitle))
      .orderBy(desc(episodes.pubDate))
      .limit(10);
  },
  ['last-ten-episodes'],
  { tags: ['episodes'] }
);

export const getLastEpisode = unstable_cache(
  async (podcastTitle: string) => {
    return db.select()
      .from(episodes)
      .innerJoin(podcasts, eq(episodes.podcastId, podcasts.uuid))
      .where(eq(podcasts.title, podcastTitle))
      .orderBy(desc(episodes.pubDate))
      .limit(1)
      .then(results => results[0] || null);
  },
  ['last-episode'],
  { tags: ['episodes'] }
);

export const getEpisode = unstable_cache(
  async (podcastTitle: string, episodeId: string) => {
    return db.select()
      .from(episodes)
      .innerJoin(podcasts, eq(episodes.podcastId, podcasts.uuid))
      .where(
        and(
            eq(podcasts.title, podcastTitle),
            eq(episodes.id, episodeId)
        )
      )
      .then(results => results[0] || null);
  },
  ['episode'],
  { tags: ['episodes'] }
);

export const getEpisodeTitles = unstable_cache(
  async (podcastTitle: string) => {
    return db.select({ title: episodes.title })
      .from(episodes)
      .innerJoin(podcasts, eq(episodes.podcastId, podcasts.uuid))
      .where(eq(podcasts.title, podcastTitle))
      .orderBy(desc(episodes.pubDate));
  },
  ['episode-titles'],
  { tags: ['episodes'] }
);

export const getPodcastMetadata = unstable_cache(
  async (podcastTitle: string) => {
    return db.select({
      title: podcasts.title,
      description: podcasts.description,
      image: podcasts.image,
      author: podcasts.author,
      itunesExplicit: podcasts.itunesExplicit,
    })
    .from(podcasts)
    .where(eq(podcasts.title, podcastTitle))
    .then(results => results[0] || null);
  },
  ['podcast-metadata'],
  { tags: ['podcasts'] }
);

export const getPodcastAndLastEpisodes = unstable_cache(
  async () => {
    return db.select({
      title: podcasts.title,
      description: podcasts.description,
      image: podcasts.image,
      episodeTitle: episodes.title,
      episodePubDate: episodes.pubDate,
    })
    .from(podcasts)
    .leftJoin(episodes, eq(podcasts.uuid, episodes.podcastId))
    .groupBy(podcasts.uuid)
    .having(
      eq(
        episodes.pubDate,
        db.select({ maxPubDate: sql<Date>`max(${episodes.pubDate})` })
          .from(episodes)
          .where(eq(episodes.podcastId, podcasts.uuid))
          .as('subquery')
      )
    )
    .orderBy(desc(episodes.pubDate));
  },
  ['podcasts-and-last-episodes'],
  { tags: ['podcasts', 'episodes'] }
);

// Function to revalidate cache
export function revalidatePodcastsAndEpisodes() {
  revalidateTag('podcasts');
  revalidateTag('episodes');
}
