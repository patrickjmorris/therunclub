import { db } from './index';
import { podcasts, episodes } from './schema';
import { FEEDS } from '../lib/episodes';
import Parser from 'rss-parser';
import { sql } from 'drizzle-orm';

export async function seed() {
    console.log('Seeding database...');
    for (const feed of FEEDS) {
    console.log(`Processing feed: ${feed.url}`);
    const parser = new Parser();
    const data = await parser.parseURL(feed.url);

    // Insert or update podcast
    const [insertedPodcast] = await db
        .insert(podcasts)
        .values({
        title: data.title || '',
        feedUrl: feed.url,
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
        .onConflictDoUpdate({
        target: podcasts.feedUrl,
        set: {
            title: sql`EXCLUDED.title`,
            description: sql`EXCLUDED.description`,
            image: sql`EXCLUDED.image`,
            author: sql`EXCLUDED.author`,
            link: sql`EXCLUDED.link`,
            language: sql`EXCLUDED.language`,
            lastBuildDate: sql`EXCLUDED.last_build_date`,
            itunesOwnerName: sql`EXCLUDED.itunes_owner_name`,
            itunesOwnerEmail: sql`EXCLUDED.itunes_owner_email`,
            itunesImage: sql`EXCLUDED.itunes_image`,
            itunesAuthor: sql`EXCLUDED.itunes_author`,
            itunesSummary: sql`EXCLUDED.itunes_summary`,
            itunesExplicit: sql`EXCLUDED.itunes_explicit`,
        },
        })
        .returning();

    const podcastId = insertedPodcast.uuid;
    console.log(`Inserted/updated podcast: ${insertedPodcast.title}`);

    // Insert or update episodes
    for (const item of data.items) {
        await db
        .insert(episodes)
        .values({
            id: item.guid || '',
            podcastId: podcastId,
            title: item.title || '',
            pubDate: new Date(item.pubDate || Date.now()),
            content: item.content || '',
            link: item.link || '',
            enclosureUrl: item.enclosure?.url || null,
            duration: item.itunes?.duration || '',
            explicit: item.itunes?.explicit || 'no',
            image: item.itunes?.image || '',
            episodeNumber: item.itunes?.episode ? parseInt(item.itunes.episode) : null,
            season: item.itunes?.season || '',
        })
        .onConflictDoUpdate({
            target: episodes.id,
            set: {
            podcastId: sql`EXCLUDED.podcast_id`,
            title: sql`EXCLUDED.title`,
            pubDate: sql`EXCLUDED.pub_date`,
            content: item.content || '',
            link: sql`EXCLUDED.link`,
            enclosureUrl: sql`EXCLUDED.enclosure_url`,
            duration: sql`EXCLUDED.duration`,
            explicit: sql`EXCLUDED.explicit`,
            image: sql`EXCLUDED.image`,
            episodeNumber: sql`EXCLUDED.episode_number`,
            season: sql`EXCLUDED.season`,
            },
        });
    }
    console.log(`Inserted/updated ${data.items.length} episodes for ${data.title}`);
    }
    console.log('Database seeding completed');
}

seed()
    .then(() => {
    console.log('Seeding completed successfully');
    process.exit(0);
    })
    .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
    });