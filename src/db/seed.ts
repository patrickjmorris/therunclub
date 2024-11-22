import { db, client } from "./index";
import { podcasts, episodes } from "./schema";
import Parser from "rss-parser";
import { sql } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import type { iTunesSearchResponse } from "@/lib/itunes-types";
import { createPodcastIndexClient } from "@/lib/podcast-index";
import { nanoid } from "nanoid";

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

async function deletePodcastAndEpisodes(feedUrl: string) {
	try {
		// First, get the podcast ID
		const [podcast] = await db
			.select({ id: podcasts.id })
			.from(podcasts)
			.where(sql`${podcasts.feedUrl} = ${feedUrl}`);

		if (podcast) {
			// Delete all episodes first
			await db
				.delete(episodes)
				.where(sql`${episodes.podcastId} = ${podcast.id}`);

			// Then delete the podcast
			await db.delete(podcasts).where(sql`${podcasts.id} = ${podcast.id}`);

			console.log(
				`Successfully deleted podcast and episodes for feed: ${feedUrl}`,
			);
		}
	} catch (error) {
		console.error(
			`Error deleting podcast and episodes for feed: ${feedUrl}`,
			error,
		);
		throw error;
	}
}

export async function seed() {
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
			console.log(`Processing podcast: ${itunesPodcast.collectionName}`);

			// Check if podcast exists and needs to be removed
			const healthCheck = await podcastIndex.getPodcastByFeedUrl(
				itunesPodcast.feedUrl,
			);
			if (!healthCheck) {
				console.log(
					`Podcast ${itunesPodcast.collectionName} failed health check, removing if exists...`,
				);
				await deletePodcastAndEpisodes(itunesPodcast.feedUrl);
				continue;
			}

			try {
				const data = await parser.parseURL(itunesPodcast.feedUrl);
				console.log(`Successfully parsed feed: ${itunesPodcast.feedUrl}`);

				try {
					const [insertedPodcast] = await db
						.insert(podcasts)
						.values({
							title: data.title || itunesPodcast.collectionName,
							podcastSlug: slugify(data.title || itunesPodcast.collectionName),
							feedUrl: itunesPodcast.feedUrl,
							description: data.description || itunesPodcast.description || "",
							image: data.image?.url || "",
							author: itunesPodcast.artistName || data.itunes?.author || "",
							link: data.link || "",
							language: data.language || "",
							lastBuildDate: data.lastBuildDate
								? new Date(data.lastBuildDate)
								: new Date(itunesPodcast.releaseDate),
							itunesOwnerName: data.itunes?.owner?.name || "",
							itunesOwnerEmail: data.itunes?.owner?.email || "",
							itunesImage: data.itunes?.image || "",
							itunesAuthor: data.itunes?.author || "",
							itunesSummary: data.itunes?.summary || "",
							itunesExplicit: data.itunes?.explicit === "yes" ? "yes" : "no",
							episodeCount: healthCheck.episodeCount,
							isDead: healthCheck.isDead,
							hasParseErrors: healthCheck.hasParseErrors,
							iTunesId: itunesPodcast.collectionId.toString(),
						})
						.onConflictDoUpdate({
							target: podcasts.feedUrl,
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
								iTunesId: sql`EXCLUDED.itunes_id`,
							},
						})
						.returning();
					console.log(`Inserted/updated podcast: ${insertedPodcast.title}`);

					const podcastId = insertedPodcast.id;

					for (const item of data.items) {
						try {
							await db
								.insert(episodes)
								.values({
									podcastId: podcastId,
									episodeSlug: slugify(item.title || ""),
									title: item.title || "",
									pubDate: new Date(item.pubDate || ""),
									content: item.content || "",
									link: item.link || "",
									enclosureUrl: item.enclosure?.url ?? "",
									duration: item.itunes?.duration || "",
									explicit: item.itunes?.explicit || "no",
									image: item.itunes?.image || "",
								})
								.onConflictDoUpdate({
									target: episodes.id,
									set: {
										podcastId: sql`EXCLUDED.podcast_id`,
										episodeSlug: sql`EXCLUDED.episode_slug`,
										title: sql`EXCLUDED.title`,
										pubDate: sql`EXCLUDED.pub_date`,
										content: sql`EXCLUDED.content`,
										link: sql`EXCLUDED.link`,
										enclosureUrl: sql`EXCLUDED.enclosure_url`,
										duration: sql`EXCLUDED.duration`,
										explicit: sql`EXCLUDED.explicit`,
										image: sql`EXCLUDED.image`,
									},
								});
							console.log(`Inserted/updated episode: ${item.title}`);
						} catch (episodeError) {
							console.error(
								`Error inserting/updating episode: ${item.title}`,
								episodeError,
							);
						}
					}
					console.log(
						`Processed ${data.items.length} episodes for ${itunesPodcast.collectionName}`,
					);
				} catch (podcastError) {
					console.error(
						`Error inserting/updating podcast: ${itunesPodcast.feedUrl}`,
						podcastError,
					);
				}
			} catch (parseError) {
				console.error(
					`Error parsing feed: ${itunesPodcast.feedUrl}`,
					parseError,
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

const SEED_TIMEOUT = 3000000;

Promise.race([
	seed(),
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
