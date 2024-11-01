import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { type Podcast, type Episode, podcasts, episodes } from "./schema";
import { eq, sql } from "drizzle-orm";
import Parser from "rss-parser";
import { config } from "dotenv";
import { slugify } from "@/lib/utils";
import { FEEDS } from "@/lib/episodes";

config({ path: ".env" });

const isDevelopment = process.env.NODE_ENV === "development";
const BATCH_SIZE = 5; // Number of podcasts to process concurrently

const connectionString = isDevelopment
	? process.env.LOCAL_DB_URL ?? ""
	: process.env.DATABASE_URL ?? "";

export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);

async function processPodcast(podcast: Podcast, parser: Parser) {
	try {
		const data = await parser.parseURL(podcast.feedUrl);
		
		// Prepare episode values for bulk insert
		const episodeValues = (data.items ?? [])
			.filter((item): item is NonNullable<typeof item> => !!item.guid)
			.map((item): Episode => ({
				id: item.guid || "",
				podcastId: podcast.id,
				title: item.title ?? "",
				episodeSlug: slugify(item.title ?? ""),
				pubDate: new Date(item.pubDate ?? Date.now()),
				content: item.content ?? "",
				link: item.link ?? "",
				enclosureUrl: item.enclosure?.url ?? "",
				duration: item.itunes?.duration ?? "",
				explicit: item.itunes?.explicit === "yes" ? "yes" : "no", 
				image: item.itunes?.image ?? "",
				episodeNumber: item.itunes?.episode
					? parseInt(item.itunes.episode) 
					: null,
				season: item.itunes?.season ?? "",
			}));

		// Bulk operations
		await Promise.all([
			// Update podcast metadata
			db.update(podcasts)
				.set({
					title: data.title ?? "",
					description: data.description ?? "",
					image: data.image?.url ?? data.itunes?.image ?? "",
					author: data.itunes?.author ?? "",
					link: data.link ?? "",
					language: data.language ?? "",
					lastBuildDate: data.lastBuildDate ? new Date(data.lastBuildDate) : null,
					itunesOwnerName: data.itunes?.owner?.name ?? "",
					itunesOwnerEmail: data.itunes?.owner?.email ?? "",
					itunesImage: data.itunes?.image ?? "",
					itunesAuthor: data.itunes?.author ?? "",
					itunesSummary: data.itunes?.summary ?? "",
					itunesExplicit: data.itunes?.explicit === "yes" ? "yes" : "no",
				})
				.where(eq(podcasts.id, podcast.id)),

			// Bulk upsert episodes
			db.transaction(async (tx) => {
				if (episodeValues.length > 0) {
					await tx.insert(episodes)
						.values(episodeValues)
						.onConflictDoUpdate({
							target: episodes.id,
							set: {
								title: sql`EXCLUDED.title`,
								episodeSlug: sql`EXCLUDED.episode_slug`,
								pubDate: sql`EXCLUDED.pub_date`,
								content: sql`EXCLUDED.content`,
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
			})
		]);

		return { success: true, podcastId: podcast.id };
	} catch (error) {
		console.error(`Error updating podcast ${podcast.title}:`, error);
		return { success: false, podcastId: podcast.id, error };
	}
}

export async function updatePodcastData() {
	const allPodcasts = await db.select().from(podcasts);
	const parser = new Parser();
	const results = [];

	// Process podcasts in batches
	for (let i = 0; i < allPodcasts.length; i += BATCH_SIZE) {
		const batch = allPodcasts.slice(i, i + BATCH_SIZE);
		const batchResults = await Promise.all(
			batch.map(podcast => processPodcast(podcast, parser))
		);
		results.push(...batchResults);
	}

	return results;
}

export async function loadInitialData() {
	const parser = new Parser();
	const results = [];

	for (const feed of FEEDS) {
		try {
			const data = await parser.parseURL(feed.url);

			// Insert or update podcast
			const [insertedPodcast] = (await db
				.insert(podcasts)
				.values({
					title: data.title ?? "",
					feedUrl: data.url,
					podcastSlug: slugify(data.title ?? ""),
					description: data.description ?? "",
					image: data.image?.url ?? data.itunes?.image ?? "",
					author: data.itunes?.author ?? "",
					link: data.link ?? "",
					language: data.language ?? "",
					lastBuildDate: data.lastBuildDate ? new Date(data.lastBuildDate) : null,
					itunesOwnerName: data.itunes?.owner?.name ?? "",
					itunesOwnerEmail: data.itunes?.owner?.email ?? "",
					itunesImage: data.itunes?.image ?? "",
					itunesAuthor: data.itunes?.author ?? "",
					itunesSummary: data.itunes?.summary ?? "",
					itunesExplicit: data.itunes?.explicit === "yes" ? "yes" : "no",
				})
				.onConflictDoUpdate({
					target: podcasts.feedUrl,
					set: {
						title: data.title ?? "",
						podcastSlug: slugify(data.title ?? ""),
						description: data.description ?? "",
						image: data.image?.url ?? data.itunes?.image ?? "",
						author: data.itunes?.author ?? "",
						link: data.link ?? "",
						language: data.language ?? "",
						lastBuildDate: data.lastBuildDate ? new Date(data.lastBuildDate) : null,
						itunesOwnerName: data.itunes?.owner?.name ?? "",
						itunesOwnerEmail: data.itunes?.owner?.email ?? "",
						itunesImage: data.itunes?.image ?? "",
						itunesAuthor: data.itunes?.author ?? "",
						itunesSummary: data.itunes?.summary ?? "",
						itunesExplicit: data.itunes?.explicit === "yes" ? "yes" : "no",
					},
				})
				.returning()) as [Podcast];

			// Prepare episode values for bulk insert
			const episodeValues = (data.items ?? [])
				.filter((item): item is NonNullable<typeof item> => !!item.guid)
				.map((item): Episode => ({
					id: item.guid || "",
					podcastId: insertedPodcast.id,
					title: item.title || "",
					episodeSlug: slugify(item.title || ""),
					pubDate: new Date(item.pubDate || Date.now()),
					content: item.content ?? null,
					link: item.link ?? null,
					enclosureUrl: item.enclosure?.url ?? "",
					duration: item.itunes?.duration ?? null,
					explicit: item.itunes?.explicit === "yes" ? "yes" : "no",
					image: item.itunes?.image ?? null,
					episodeNumber: item.itunes?.episode 
						? parseInt(item.itunes.episode) || null 
						: null,
					season: item.itunes?.season ?? null,
				}));

			// Bulk upsert episodes
			if (episodeValues.length > 0) {
				await db.insert(episodes)
					.values(episodeValues)
					.onConflictDoUpdate({
						target: episodes.id,
						set: {
							title: sql`EXCLUDED.title`,
							episodeSlug: sql`EXCLUDED.episode_slug`,
							pubDate: sql`EXCLUDED.pub_date`,
							content: sql`EXCLUDED.content`,
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

			results.push({ success: true, feedUrl: feed.url });
		} catch (error) {
			console.error(`Error loading feed ${feed.url}:`, error);
			results.push({ success: false, feedUrl: feed.url, error });
		}
	}

	return results;
}
