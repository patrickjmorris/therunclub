import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { type Podcast, type Episode, podcasts, episodes } from "./schema";
import { eq, sql, isNotNull, and, isNull } from "drizzle-orm";
import Parser from "rss-parser";
import { config } from "dotenv";
import { slugify } from "@/lib/utils";

import { updatePodcastColors } from "@/lib/update-podcast-colors";
import { createPodcastIndexClient } from "@/lib/podcast-index";
import type { iTunesSearchResponse } from "@/lib/itunes-types";

import { decode } from "html-entities";
config({ path: ".env" });

// Default to development unless explicitly set to production
const isDevelopment = process.env.NODE_ENV !== "production";

const BATCH_SIZE = 5;
const connectionString = isDevelopment
	? process.env.LOCAL_DB_URL ?? ""
	: process.env.DATABASE_URL ?? "";

if (!connectionString) {
	throw new Error("Database connection string is not defined");
}

console.log("Environment:", isDevelopment ? "development" : "production");
console.log("Using connection:", connectionString.split("@")[1]); // Log only host part for security

export const client = postgres(connectionString, { prepare: false });
export const db = drizzle({ client, casing: "snake_case" });

const podcastIndex = createPodcastIndexClient({
	key: process.env.PODCAST_INDEX_API_KEY || "",
	secret: process.env.PODCAST_INDEX_API_SECRET || "",
});

async function getITunesPodcastByID(iTunesId: string) {
	try {
		const response = await fetch(
			`https://itunes.apple.com/lookup?id=${encodeURIComponent(
				iTunesId,
			)}&entity=podcast&limit=1`,
		);
		if (!response.ok) return null;

		const data = (await response.json()) as iTunesSearchResponse;
		return data.results[0] || null;
	} catch (error) {
		console.error("iTunes API error:", error);
		return null;
	}
}

async function processPodcast(podcast: Podcast, parser: Parser) {
	console.log("\n--- Starting podcast processing ---");
	console.log({
		podcastId: podcast.id,
		title: podcast.title,
		feedUrl: podcast.feedUrl,
		lastBuildDate: podcast.lastBuildDate,
	});

	try {
		// Get health check from Podcast Index
		const healthCheck = await podcastIndex.getPodcastByFeedUrl(podcast.feedUrl);
		console.log("Health check result:", {
			isDead: healthCheck?.isDead,
			episodeCount: healthCheck?.episodeCount,
			hasParseErrors: healthCheck?.hasParseErrors,
		});

		if (!healthCheck) {
			console.log(
				`Podcast ${podcast.title} failed health check, skipping update`,
			);
			return {
				success: false,
				podcastId: podcast.id,
				error: "Failed health check",
			};
		}

		// Get iTunes data
		const itunesData = await getITunesPodcastByID(podcast.iTunesId ?? "");
		console.log("iTunes data status:", {
			found: !!itunesData,
			iTunesId: podcast.iTunesId,
		});

		// Parse RSS feed
		const data = await parser.parseURL(podcast.feedUrl);
		console.log("RSS feed parsed:", {
			itemCount: data.items?.length ?? 0,
			feedTitle: data.title,
			lastBuildDate: data.lastBuildDate,
		});

		// Determine the lastBuildDate
		let lastBuildDate: Date | null = null;
		if (data.lastBuildDate) {
			lastBuildDate = new Date(data.lastBuildDate);
		} else if (itunesData?.releaseDate) {
			lastBuildDate = new Date(itunesData.releaseDate);
		}

		// Check if we need to update based on lastBuildDate
		// if (
		// 	lastBuildDate &&
		// 	podcast.lastBuildDate &&
		// 	lastBuildDate <= podcast.lastBuildDate
		// ) {
		// 	console.log(
		// 		`Skipping episode updates for ${podcast.title} - no new content since last update`,
		// 	);
		// 	return {
		// 		success: true,
		// 		podcastId: podcast.id,
		// 		episodesUpdated: 0,
		// 		skippedReason: "No new content",
		// 	};
		// }

		// Update podcast metadata first with decoded text
		const [updatedPodcast] = await db
			.insert(podcasts)
			.values({
				title: decode(data.title || podcast.title),
				podcastSlug: slugify(decode(data.title || podcast.title)),
				feedUrl: podcast.feedUrl,
				description:
					data.description || itunesData?.description || podcast.description,

				image:
					data.image?.url ||
					data.itunes?.image ||
					itunesData?.artworkUrl600 ||
					podcast.image,
				author: decode(
					itunesData?.artistName || data.itunes?.author || podcast.author,
				),
				link: data.link || podcast.link,
				language: data.language || podcast.language,
				lastBuildDate,
				itunesOwnerName: decode(
					data.itunes?.owner?.name || podcast.itunesOwnerName,
				),
				itunesOwnerEmail: data.itunes?.owner?.email || podcast.itunesOwnerEmail,
				itunesImage:
					itunesData?.artworkUrl600 ||
					data.itunes?.image ||
					podcast.itunesImage,
				itunesAuthor: decode(
					itunesData?.artistName || data.itunes?.author || podcast.itunesAuthor,
				),
				itunesSummary: decode(data.itunes?.summary || podcast.itunesSummary),
				itunesExplicit: data.itunes?.explicit === "yes" ? "yes" : "no",
				episodeCount: healthCheck.episodeCount,
				isDead: healthCheck.isDead,
				hasParseErrors: healthCheck.hasParseErrors,
				iTunesId: itunesData?.collectionId?.toString() || "",
			} satisfies Partial<Podcast>)
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
					episodeCount: sql`EXCLUDED.episode_count`,
					isDead: sql`EXCLUDED.is_dead`,
					hasParseErrors: sql`EXCLUDED.has_parse_errors`,
					iTunesId: sql`EXCLUDED.itunes_id`,
				},
			})
			.returning();

		// Process episodes if podcast was updated successfully
		if (updatedPodcast) {
			// Get the latest episode date from the database
			const [latestEpisode] = await db
				.select({ pubDate: episodes.pubDate })
				.from(episodes)
				.where(eq(episodes.podcastId, podcast.id))
				.orderBy(sql`${episodes.pubDate} DESC`)
				.limit(1);

			// Prepare episode values for bulk insert/update with decoded text
			let episodeValues = (data.items ?? [])
				.filter((item): item is NonNullable<typeof item> => {
					// Filter out episodes without enclosure URL
					if (!item.enclosure?.url) return false;

					// Filter out old episodes if we have a latest episode date
					if (latestEpisode?.pubDate && item.pubDate) {
						const episodeDate = new Date(item.pubDate);
						return episodeDate > latestEpisode.pubDate;
					}

					return true;
				})
				.map((item) => ({
					podcastId: podcast.id,
					title: decode(item.title || ""),
					episodeSlug: slugify(decode(item.title || "")),
					pubDate: new Date(item.pubDate || ""),
					content: item.content || null,
					link: item.link || null,
					enclosureUrl: item.enclosure?.url || "",
					duration: item.itunes?.duration || "",
					explicit: item.itunes?.explicit === "yes" ? "yes" : "no",
					image: item.itunes?.image || null,
				}));

			if (episodeValues.length > 0) {
				console.log(`Attempting to upsert ${episodeValues.length} episodes`);

				// Check for duplicate enclosureUrls
				// const enclosureUrls = episodeValues.map((ep) => ep.enclosureUrl);
				// const duplicates = enclosureUrls.filter(
				// 	(url, index) => enclosureUrls.indexOf(url) !== index,
				// );
				// New Logic to remove duplicates
				const enclosureUrls = episodeValues.map((ep) => ep.enclosureUrl);
				const duplicates = enclosureUrls.filter(
					(url, index) => enclosureUrls.indexOf(url) !== index,
				);

				if (duplicates.length > 0) {
					console.warn("Found duplicate enclosureUrls:", duplicates);
					// Remove duplicates by keeping only the first occurrence
					const uniqueEpisodes = episodeValues.filter(
						(episode, index, self) =>
							index ===
							self.findIndex((e) => e.enclosureUrl === episode.enclosureUrl),
					);
					console.log(
						`Removed ${
							episodeValues.length - uniqueEpisodes.length
						} duplicate episodes`,
					);
					episodeValues = uniqueEpisodes;
				}

				if (duplicates.length > 0) {
					console.warn("Found duplicate enclosureUrls:", duplicates);
				}

				try {
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
				} catch (upsertError) {
					console.error("Episode upsert error details:", {
						podcastId: podcast.id,
						podcastTitle: podcast.title,
						episodeCount: episodeValues.length,
						error: upsertError,
					});
					throw upsertError;
				}
			}

			return {
				success: true,
				podcastId: podcast.id,
				episodesUpdated: episodeValues.length,
				lastBuildDate,
			};
		}

		return {
			success: true,
			podcastId: podcast.id,
			episodesUpdated: 0,
			skippedReason: "No podcast update needed",
		};
	} catch (error) {
		console.error("Podcast processing error:", {
			podcastId: podcast.id,
			title: podcast.title,
			error: error instanceof Error ? error.message : error,
		});
		throw error;
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
			batch.map((podcast) => processPodcast(podcast, parser)),
		);
		results.push(...batchResults);
	}

	return results;
}

export async function updatePodcastByFeedUrl(feedUrl: string) {
	const parser = new Parser();

	// Find the podcast with the given feed URL
	const [podcast] = await db
		.select()
		.from(podcasts)
		.where(eq(podcasts.feedUrl, feedUrl))
		.limit(1);

	if (!podcast) {
		return {
			success: false,
			error: `No podcast found with feed URL: ${feedUrl}`,
		};
	}

	// Process the single podcast using the existing processPodcast function
	return processPodcast(podcast, parser);
}

export async function loadInitialData() {
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
	const podcastsFeeds = await getITunesPodcasts();

	const parser = new Parser();
	const results = [];

	for (const feed of podcastsFeeds) {
		try {
			const data = await parser.parseURL(feed.feedUrl);
			// Get iTunes data if available
			const itunesData = await getITunesPodcastByID(
				feed.collectionId.toString(),
			);

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
					lastBuildDate:
						data.lastBuildDate ?? itunesData?.releaseDate
							? new Date(data.lastBuildDate ?? itunesData?.releaseDate)
							: null,
					itunesOwnerName: data.itunes?.owner?.name ?? "",
					itunesOwnerEmail: data.itunes?.owner?.email ?? "",
					itunesImage: data.itunes?.image ?? "",
					itunesAuthor: data.itunes?.author ?? "",
					itunesSummary: data.itunes?.summary ?? "",
					itunesExplicit: data.itunes?.explicit === "yes" ? "yes" : "no",
					iTunesId: itunesData?.collectionId?.toString() || "",
					vibrantColor: null,
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
						lastBuildDate:
							data.lastBuildDate ?? itunesData?.releaseDate
								? new Date(data.lastBuildDate ?? itunesData?.releaseDate)
								: null,
						itunesOwnerName: data.itunes?.owner?.name ?? "",
						itunesOwnerEmail: data.itunes?.owner?.email ?? "",
						itunesImage: data.itunes?.image ?? "",
						itunesAuthor: data.itunes?.author ?? "",
						itunesSummary: data.itunes?.summary ?? "",
						itunesExplicit: data.itunes?.explicit === "yes" ? "yes" : "no",
						iTunesId: itunesData?.collectionId?.toString() || "",
						vibrantColor: null,
					},
				})
				.returning()) as [Podcast];

			// Prepare episode values for bulk insert
			const episodeValues = (data.items ?? [])
				.filter((item): item is NonNullable<typeof item> => !!item.enclosure)
				.map((item) => ({
					podcastId: insertedPodcast.id,
					title: item.title || "",
					episodeSlug: slugify(item.title || ""),
					pubDate: item.pubDate ? new Date(item.pubDate) : null,
					content: item.content ?? null,
					link: item.link ?? null,
					enclosureUrl: item.enclosure?.url ?? "",
					duration: item.itunes?.duration ?? "",
					explicit: item.itunes?.explicit === "yes" ? "yes" : "no",
					image: item.itunes?.image ?? null,
				}));

			// Bulk upsert episodes
			if (episodeValues.length > 0) {
				await db
					.insert(episodes)
					.values(episodeValues as Episode[])
					.onConflictDoUpdate({
						target: [episodes.enclosureUrl, episodes.episodeSlug],
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

			results.push({ success: true, feedUrl: feed.feedUrl });
		} catch (error) {
			console.error(`Error loading feed ${feed.feedUrl}:`, error);
			results.push({ success: false, feedUrl: feed.feedUrl, error });
		}
	}

	return results;
}

export async function updateAllPodcastColors() {
	try {
		// Get all podcasts without a vibrant color
		const allPodcasts = await db
			.select()
			.from(podcasts)
			.where(isNull(podcasts.vibrantColor));

		// Update colors for each podcast
		for (const podcast of allPodcasts) {
			if (podcast.image) {
				try {
					console.log(`Updating colors for podcast ${podcast.id}`);
					await updatePodcastColors(podcast.id, podcast.image);
					console.log(`Successfully updated colors for podcast ${podcast.id}`);
				} catch (error) {
					console.error(`Error updating podcast ${podcast.id}:`, error);
				}
			}
		}

		console.log("Finished updating podcast colors");
	} catch (error) {
		console.error("Error updating podcast colors:", error);
		process.exit(1);
	}
}
