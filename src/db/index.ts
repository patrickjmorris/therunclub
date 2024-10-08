import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { type Podcast, type Episode, podcasts, episodes } from './schema';
import { eq } from 'drizzle-orm';
import { parsePodcastFeed, FEEDS } from '../lib/episodes';
import Parser from 'rss-parser';
import 'dotenv/config'
import { slugify } from '@/lib/utils';

const isDevelopment = process.env.NODE_ENV === 'development'

const connectionString = isDevelopment
  ? `postgresql://${process.env.LOCAL_DB_USER}:${process.env.LOCAL_DB_PASSWORD}@${process.env.LOCAL_DB_HOST}:${process.env.LOCAL_DB_PORT}/${process.env.LOCAL_DB_NAME}`
  : process.env.LOCAL_DB_URL!

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, {schema: {podcasts, episodes}});

function formatDuration(duration: string): string {
  // Convert duration to HH:MM:SS format
  const [hours, minutes, seconds] = duration.split(':').map(Number);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export async function loadInitialData() {
  for (const feed of FEEDS) {
    const parser = new Parser();
    const data = await parser.parseURL(feed.url);

    // Insert or update podcast
    const [insertedPodcast] = await db.insert(podcasts).values({
      title: data.title || '',
      feedUrl: data.url,
      description: data.description || '',
      image: data.image?.url || data.itunes?.image || '',
      author: data.itunes?.author || '',
      link: data.link || '',
      language: data.language || '',
      lastBuildDate: data.lastBuildDate ? new Date(data.lastBuildDate) : null,
      itunesOwnerName: data.itunes?.owner?.name || '',
      itunesOwnerEmail: data.itunes?.owner?.email || '',
      itunesImage: data.itunes?.image || '',
      itunesAuthor: data.itunes?.author || '',
      itunesSummary: data.itunes?.summary || '',
      itunesExplicit: data.itunes?.explicit === 'yes' ? 'yes' : 'no',
    }).onConflictDoUpdate({
      target: podcasts.feedUrl,
      set: {
        title: data.title || '',
        feedUrl: data.url,
        description: data.description || '',
        image: data.image?.url || data.itunes?.image || '',
        author: data.itunes?.author || '',
        link: data.link || '',
        language: data.language || '',
        lastBuildDate: data.lastBuildDate ? new Date(data.lastBuildDate) : null,
        itunesOwnerName: data.itunes?.owner?.name || '',
        itunesOwnerEmail: data.itunes?.owner?.email || '',
        itunesImage: data.itunes?.image || '',
        itunesAuthor: data.itunes?.author || '',
        itunesSummary: data.itunes?.summary || '',
        itunesExplicit: data.itunes?.explicit === 'yes' ? 'yes' : 'no',
      },
    }).returning() as [Podcast]

    const podcastId = insertedPodcast.uuid;

    // Insert or update episodes
    for (const item of data.items) {
      await db.insert(episodes).values({
        id: item.guid || '',
        podcastId: podcastId,
        title: item.title || '',
        pubDate: new Date(item.pubDate || Date.now()),
        content: item.content || '',
        link: item.link || '',
        enclosureUrl: item.enclosure?.url || null,
        duration: item.itunes?.duration || '',
        explicit: item.itunes?.explicit === 'yes' ? 'yes' : 'no',
        image: item.itunes?.image || '',
        episodeNumber: item.itunes?.episode ? parseInt(item.itunes.episode) : null,
        season: item.itunes?.season || '',
      }).onConflictDoUpdate({
        target: episodes.id,
        set: {
          podcastId: podcastId,
          title: item.title,
          pubDate: new Date(item.pubDate ?? Date.now()),
          content: item.content || '',
          link: item.link,
          enclosureUrl: item.enclosure?.url ?? null,
          duration: item.itunes.duration,
          explicit: item.itunes.explicit === 'yes' ? 'yes' : 'no',
          image: item.itunes.image,
          episodeNumber: parseInt(item.itunes.episode) || null,
          season: item.itunes.season,
        },
      });
    }
  }
}

export async function updatePodcastData() {
  const allPodcasts = await db.select().from(podcasts);

  for (const podcast of allPodcasts) {
    const parser = new Parser();
    const data = await parser.parseURL(podcast.feedUrl);

    // Update podcast metadata
    await db.update(podcasts)
      .set({
        title: data.title || '',
        feedUrl: data.url,
        description: data.description || '',
        image: data.image?.url || data.itunes?.image || '',
        author: data.itunes?.author || '',
        link: data.link || '',
        language: data.language || '',
        lastBuildDate: data.lastBuildDate ? new Date(data.lastBuildDate) : null,
        itunesOwnerName: data.itunes?.owner?.name || '',
        itunesOwnerEmail: data.itunes?.owner?.email || '',
        itunesImage: data.itunes?.image || '',
        itunesAuthor: data.itunes?.author || '',
        itunesSummary: data.itunes?.summary || '',
        itunesExplicit: data.itunes?.explicit === 'yes' ? 'yes' : 'no',
      })
      .where(eq(podcasts.uuid, podcast.uuid));

    // Insert or update episodes
    for (const item of data.items) {
      await db.insert(episodes).values({
        id: item.guid || '',
        podcastId: podcast.uuid,
        title: item.title || '',
        pubDate: new Date(item.pubDate || Date.now()),
        content: item.content || '',
        link: item.link || '',
        enclosureUrl: item.enclosure?.url || null,
        duration: item.itunes?.duration || '',
        explicit: item.itunes?.explicit === 'yes' ? 'yes' : 'no',
        image: item.itunes?.image || '',
        episodeNumber: item.itunes?.episode ? parseInt(item.itunes.episode) : null,
        season: item.itunes?.season || '',
      }).onConflictDoUpdate({
        target: episodes.id,
        set: {
          // No need to update podcastId here as it shouldn't change
          title: item.title,
          pubDate: new Date(item.pubDate ?? Date.now()),
          content: item.content || '',
          link: item.link,
          enclosureUrl: item.enclosure?.url ?? null,
          duration: item.itunes.duration,
          explicit: item.itunes.explicit === 'yes' ? 'yes' : 'no',
          image: item.itunes.image,
          episodeNumber: parseInt(item.itunes.episode) || null,
          season: item.itunes.season,
        },
      });
    }
  }
}