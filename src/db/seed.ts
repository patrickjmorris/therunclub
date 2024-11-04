import { db, client } from "./index";
import { podcasts, episodes } from "./schema";
import { FEEDS } from "../lib/episodes";
import Parser from "rss-parser";
import { sql } from "drizzle-orm";
import { slugify } from "@/lib/utils";

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

export async function seed() {
	console.log("Starting database seeding process...");

	try {
		// Check connection first
		const isConnected = await checkConnection();
		if (!isConnected) {
			console.error("Failed to connect to database. Exiting...");
			process.exit(1);
		}

		const parser = new Parser({
			timeout: 5000, // Add timeout for RSS parser
		});

		for (const feed of FEEDS) {
			console.log(`Processing feed: ${feed.url}`);
			
			try {
				const data = await parser.parseURL(feed.url);
				console.log(`Successfully parsed feed: ${feed.url}`);

				// Insert or update podcast
				try {
					const [insertedPodcast] = await db
						.insert(podcasts)
						.values({
							title: data.title || "",
							podcastSlug: slugify(data.title || ""),
							feedUrl: feed.url,
							description: data.description || "",
							image: data.image?.url || data.itunes?.image || "",
							author: data.itunes?.author || "",
							link: data.link || "",
							language: data.language || "",
							lastBuildDate: data.lastBuildDate
								? new Date(data.lastBuildDate)
								: null,
							itunesOwnerName: data.itunes?.owner?.name || "",
							itunesOwnerEmail: data.itunes?.owner?.email || "",
							itunesImage: data.itunes?.image || "",
							itunesAuthor: data.itunes?.author || "",
							itunesSummary: data.itunes?.summary || "",
							itunesExplicit: data.itunes?.explicit === "yes" ? "yes" : "no",
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
							},
						})
						.returning();
					console.log(`Inserted/updated podcast: ${insertedPodcast.title}`);

					const podcastId = insertedPodcast.id;

					// Insert or update episodes
					for (const item of data.items) {
						try {
							await db
								.insert(episodes)
								.values({
									id: item.guid || "",
									podcastId: podcastId,
									episodeSlug: slugify(item.title || ""),
									title: item.title || "",
									pubDate: new Date(item.pubDate || Date.now()),
									content: item.content || "",
									link: item.link || "",
									enclosureUrl: item.enclosure?.url ?? "",
									duration: item.itunes?.duration || "",
									explicit: item.itunes?.explicit || "no",
									image: item.itunes?.image || "",
									episodeNumber: item.itunes?.episode
										? parseInt(item.itunes.episode)
										: null,
									season: item.itunes?.season || "",
								})
								.onConflictDoUpdate({
									target: episodes.id,
									set: {
										podcastId: sql`EXCLUDED.podcast_id`,
										episodeSlug: sql`EXCLUDED.episode_slug`,
										title: sql`EXCLUDED.title`,
										pubDate: sql`EXCLUDED.pub_date`,
										content: item.content || "",
										link: sql`EXCLUDED.link`,
										enclosureUrl: sql`EXCLUDED.enclosure_url`,
										duration: sql`EXCLUDED.duration`,
										explicit: sql`EXCLUDED.explicit`,
										image: sql`EXCLUDED.image`,
										episodeNumber: sql`EXCLUDED.episode_number`,
										season: sql`EXCLUDED.season`,
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
						`Processed ${data.items.length} episodes for ${data.title}`,
					);
				} catch (podcastError) {
					console.error(
						`Error inserting/updating podcast: ${feed.url}`,
						podcastError,
					);
				}
			} catch (parseError) {
				console.error(`Error parsing feed: ${feed.url}`, parseError);
				// biome-ignore lint/correctness/noUnnecessaryContinue: <explanation>
continue; // Skip to next feed on error
			}
		}
		
		console.log("Database seeding completed");
		
	} catch (error) {
		console.error("Fatal error during seeding process:", error);
		throw error;
	} finally {
		// Clean up connection
		await client.end();
	}
}

// Add timeout to the entire process
const SEED_TIMEOUT = 60000; // 1 minute timeout

Promise.race([
	seed(),
	new Promise((_, reject) => 
		setTimeout(() => reject(new Error("Seeding timed out")), SEED_TIMEOUT)
	)
])
	.then(() => {
		console.log("Seeding completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		console.error("Error seeding database:", error);
		process.exit(1);
	});
