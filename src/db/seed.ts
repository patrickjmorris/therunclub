import { db, client } from "./client";
import { podcasts, episodes, Episode } from "./schema";
import Parser from "rss-parser";
import { sql, eq } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import type { iTunesSearchResponse } from "@/lib/itunes-types";
import { createPodcastIndexClient } from "@/lib/podcast-index";
import { decode } from "html-entities";

const podcastIndex = createPodcastIndexClient({
  key: process.env.PODCAST_INDEX_API_KEY || "",
  secret: process.env.PODCAST_INDEX_API_SECRET || "",
});

async function checkConnection() {
  try {
    const result = await db.execute(sql`SELECT 1`);
    console.log("Connection test result:", result);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

async function getITunesPodcasts() {
  const response = await fetch(
    "https://itunes.apple.com/search?term=podcast&genreId=1551&limit=200",
    { next: { revalidate: 3600 } },
  );

  if (!response.ok) {
    throw new Error(`iTunes API error: ${response.statusText}`);
  }

  const data = (await response.json()) as iTunesSearchResponse;
  return data.results;
}

export async function seedPodcasts() {
  console.log("Starting database seeding process...");

  try {
    const isConnected = await checkConnection();
    if (!isConnected) {
      console.error("Failed to connect to database. Exiting...");
      process.exit(1);
    }

    const parser = new Parser({
      timeout: 5000,
    });

    const itunesPodcasts = await getITunesPodcasts();
    console.log(`Found ${itunesPodcasts.length} podcasts from iTunes`);

    for (const itunesPodcast of itunesPodcasts) {
      try {
        // Check if podcast already exists
        const [existingPodcast] = await db
          .select()
          .from(podcasts)
          .where(eq(podcasts.iTunesId, itunesPodcast.collectionId.toString()))
          .limit(1);

        // Parse feed and get health check regardless of existence
        const healthCheck = await podcastIndex.getPodcastByFeedUrl(
          itunesPodcast.feedUrl,
        );
        if (!healthCheck) {
          console.log(
            `Skipping ${itunesPodcast.collectionName} - failed health check`,
          );
          continue;
        }

        const data = await parser.parseURL(itunesPodcast.feedUrl);

        // Always insert/update podcast data
        const [insertedPodcast] = await db
          .insert(podcasts)
          .values({
            title: decode(data.title || itunesPodcast.collectionName),
            podcastSlug: slugify(
              decode(data.title || itunesPodcast.collectionName),
            ),
            feedUrl: itunesPodcast.feedUrl,
            description: decode(
              data.description || itunesPodcast.description || "",
            ),
            image: data.image?.url || itunesPodcast.artworkUrl600 || "",
            author: decode(
              itunesPodcast.artistName || data.itunes?.author || "",
            ),
            link: data.link || itunesPodcast.collectionViewUrl || "",
            language: data.language || "",
            lastBuildDate: data.lastBuildDate
              ? new Date(data.lastBuildDate)
              : new Date(itunesPodcast.releaseDate),
            itunesOwnerName: decode(data.itunes?.owner?.name || ""),
            itunesOwnerEmail: data.itunes?.owner?.email || "",
            itunesImage:
              itunesPodcast.artworkUrl600 || data.itunes?.image || "",
            itunesAuthor: decode(
              itunesPodcast.artistName || data.itunes?.author || "",
            ),
            itunesSummary: decode(data.itunes?.summary || ""),
            itunesExplicit: data.itunes?.explicit === "yes" ? "yes" : "no",
            episodeCount: healthCheck.episodeCount,
            isDead: healthCheck.isDead,
            hasParseErrors: healthCheck.hasParseErrors,
            iTunesId: itunesPodcast.collectionId.toString(),
          })
          .onConflictDoUpdate({
            target: podcasts.iTunesId,
            set: {
              title: sql`EXCLUDED.title`,
              podcastSlug: sql`EXCLUDED.podcast_slug`,
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
              episodeCount: sql`EXCLUDED.episode_count`,
              isDead: sql`EXCLUDED.is_dead`,
              hasParseErrors: sql`EXCLUDED.has_parse_errors`,
            },
          })
          .returning();

        if (insertedPodcast) {
          // Get latest episode if podcast existed
          const [latestEpisode] = existingPodcast
            ? await db
                .select({ pubDate: episodes.pubDate })
                .from(episodes)
                .where(eq(episodes.podcastId, existingPodcast.id))
                .orderBy(sql`${episodes.pubDate} DESC`)
                .limit(1)
            : [null];

          // Filter and prepare episodes
          const episodeValues = (data.items ?? [])
            .filter((item): item is NonNullable<typeof item> => {
              if (!item.enclosure?.url) return false;
              if (latestEpisode?.pubDate && item.pubDate) {
                return new Date(item.pubDate) > latestEpisode.pubDate;
              }
              return true;
            })
            .map((item) => ({
              title: decode(item.title || ""),
              podcastId: insertedPodcast.id,
              episodeSlug: slugify(decode(item.title || "")),
              pubDate: item.pubDate ? new Date(item.pubDate) : null,
              content: item.content || null,
              link: item.link || null,
              enclosureUrl: item.enclosure?.url,
              duration: item.itunes?.duration || "",
              explicit: item.itunes?.explicit === "yes" ? "yes" : "no",
              image: item.itunes?.image || null,
            }));

          if (episodeValues.length > 0) {
            await db
              .insert(episodes)
              .values(episodeValues as Episode[])
              .onConflictDoUpdate({
                target: [episodes.enclosureUrl],
                set: {
                  title: sql`EXCLUDED.title`,
                  episodeSlug: sql`EXCLUDED.episode_slug`,
                  pubDate: sql`EXCLUDED.pub_date`,
                  content: sql`EXCLUDED.content`,
                  link: sql`EXCLUDED.link`,
                  duration: sql`EXCLUDED.duration`,
                  explicit: sql`EXCLUDED.explicit`,
                  image: sql`EXCLUDED.image`,
                },
              });
          }

          console.log(
            `${existingPodcast ? "Updated" : "Created"} podcast ${
              itunesPodcast.collectionName
            } with ${episodeValues.length} episodes`,
          );
        }
      } catch (error) {
        console.error(
          `Error processing podcast ${itunesPodcast.collectionName}:`,
          error,
        );
      }
    }

    console.log("Database seeding completed");
  } catch (error) {
    console.error("Fatal error during seeding process:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Only run seeding if script is called directly
if (require.main === module) {
  const SEED_TIMEOUT = 3000000; // 5 minutes

  Promise.race([
    seedPodcasts(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Seeding timed out")), SEED_TIMEOUT),
    ),
  ])
    .then(() => {
      console.log("Seeding completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error seeding database:", error);
      process.exit(1);
    });
}
