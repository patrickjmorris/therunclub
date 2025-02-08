import { db } from "@/db/client";
import { podcasts, episodes, type Episode, type Podcast } from "@/db/schema";
import { webSubManager } from "@/lib/websub-manager";
import { eq, sql, isNull } from "drizzle-orm";
import Parser from "rss-parser";
import { updatePodcastColors } from "@/lib/update-podcast-colors";
import { createPodcastIndexClient } from "@/lib/podcast-index";
import type { iTunesSearchResponse } from "@/lib/itunes-types";
import { decode } from "html-entities";
import { slugify } from "@/lib/utils";
import { parseDate, safeDateParse } from "@/lib/date-utils";

const BATCH_SIZE = 5;

const podcastIndex = createPodcastIndexClient({
	key: process.env.PODCAST_INDEX_API_KEY || "",
	secret: process.env.PODCAST_INDEX_API_SECRET || "",
});

// Define types for RSS Parser output
interface CustomFeed {
	title?: string;
	description?: string;
	url?: string;
	image?: {
		url?: string;
	};
	itunes?: {
		author?: string;
		owner?: {
			name?: string;
			email?: string;
		};
		image?: string;
		summary?: string;
		explicit?: string;
		id?: string;
	};
	link?: string;
	language?: string;
	lastBuildDate?: string;
	items?: CustomItem[];
}

interface CustomItem {
	title?: string;
	pubDate?: string;
	content?: string;
	link?: string;
	enclosure?: {
		url?: string;
	};
	itunes?: {
		duration?: string;
		explicit?: string;
		image?: string;
	};
}

// Configure parser with custom types
const parser: Parser<CustomFeed, CustomItem> = new Parser({
	timeout: 5000,
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

async function findWebSubHub(feedUrl: string): Promise<string | null> {
    try {
        const response = await fetch(feedUrl);
        const text = await response.text();
        
        // Look for WebSub hub in the Link header
        const linkHeader = response.headers.get('link');
        if (linkHeader) {
            const links = linkHeader.split(',');
            for (const link of links) {
                const [url, rel] = link.split(';');
                if (rel.trim() === 'rel="hub"') {
                    return url.trim().replace(/[<>]/g, '');
                }
            }
        }
        
        // Look for WebSub hub in the feed XML
        const hubMatch = text.match(/<link[^>]*rel=["']hub["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
                        text.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']hub["'][^>]*>/i);
        
        return hubMatch ? hubMatch[1] : null;
    } catch (error) {
        console.error('Error finding WebSub hub:', error);
        return null;
    }
}

async function processPodcast(
	podcast: Podcast,
	customParser: Parser<CustomFeed, CustomItem>,
) {
	console.log("\n--- Starting podcast processing ---");
	console.log({
		podcastId: podcast.id,
		title: podcast.title,
		feedUrl: podcast.feedUrl,
		lastBuildDate: podcast.lastBuildDate,
	});

	// Check for WebSub hub and subscribe if found
	const hubUrl = await findWebSubHub(podcast.feedUrl);
	if (hubUrl) {
		console.log(`Found WebSub hub for ${podcast.title}: ${hubUrl}`);
		await webSubManager.subscribe(podcast.feedUrl, hubUrl);
	}

	try {
		// Quick RSS feed check first
		let data: CustomFeed;
		try {
			data = await customParser.parseURL(podcast.feedUrl);
		} catch (error) {
			console.error(`Failed to parse RSS feed for ${podcast.title}:`, error);
			return {
				success: false,
				podcastId: podcast.id,
				error: "Failed to parse RSS feed",
			};
		}

		// Parse and validate lastBuildDate
		const lastBuildDate = parseDate(data.lastBuildDate);

		// Check if feed has been updated since last check
		if (
			lastBuildDate &&
			podcast.lastBuildDate &&
			lastBuildDate <= podcast.lastBuildDate
		) {
			console.log(
				`Skipping ${podcast.title} - no new content since last update`,
			);
			return {
				success: true,
				podcastId: podcast.id,
				episodesUpdated: 0,
				skippedReason: "No new content",
			};
		}

		// Only check health and iTunes data if this is a new podcast or it's been more than 7 days
		const shouldCheckExternalAPIs =
			!podcast.lastBuildDate ||
			(podcast.lastBuildDate &&
				Date.now() - podcast.lastBuildDate.getTime() > 7 * 24 * 60 * 60 * 1000);

		let healthCheck = null;
		let itunesData = null;

		if (shouldCheckExternalAPIs) {
			// Get health check from Podcast Index
			healthCheck = await podcastIndex.getPodcastByFeedUrl(podcast.feedUrl);
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
			itunesData = await getITunesPodcastByID(podcast.iTunesId ?? "");
			console.log("iTunes data status:", {
				found: !!itunesData,
				iTunesId: podcast.iTunesId,
			});
		}

		// Update podcast metadata with what we have
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
				episodeCount: healthCheck?.episodeCount || podcast.episodeCount,
				isDead: healthCheck?.isDead || podcast.isDead,
				hasParseErrors: healthCheck?.hasParseErrors || podcast.hasParseErrors,
				iTunesId:
					itunesData?.collectionId?.toString() || podcast.iTunesId || "",
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
						const episodeDate = parseDate(item.pubDate);
						if (!episodeDate) return true; // Include episodes with invalid dates
						return episodeDate > latestEpisode.pubDate;
					}

					return true;
				})
				.map((item) => ({
					podcastId: podcast.id,
					title: decode(item.title || ""),
					episodeSlug: slugify(decode(item.title || "")),
					pubDate: item.pubDate ? parseDate(item.pubDate) : null,
					content: item.content || null,
					link: item.link || null,
					enclosureUrl: item.enclosure?.url || "",
					duration: item.itunes?.duration || "",
					explicit: item.itunes?.explicit === "yes" ? "yes" : "no",
					image: item.itunes?.image || null,
				}));

			if (episodeValues.length > 0) {
				console.log(`Attempting to upsert ${episodeValues.length} episodes`);

				// Remove duplicates by keeping only the first occurrence
				const uniqueEpisodes = episodeValues.filter(
					(episode, index, self) =>
						index ===
						self.findIndex((e) => e.enclosureUrl === episode.enclosureUrl),
				);

				if (episodeValues.length !== uniqueEpisodes.length) {
					console.log(
						`Removed ${
							episodeValues.length - uniqueEpisodes.length
						} duplicate episodes`,
					);
					episodeValues = uniqueEpisodes;
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

interface UpdatePodcastOptions {
	minHoursSinceUpdate?: number;
	limit?: number;
	randomSample?: boolean;
}

export async function updatePodcastData(options: UpdatePodcastOptions = {}) {
	const {
		minHoursSinceUpdate = 24,
		limit,
		randomSample = false
	} = options;

	// Calculate the cutoff time for updates
	const cutoffDate = new Date();
	cutoffDate.setHours(cutoffDate.getHours() - minHoursSinceUpdate);

	// Build the base query conditions
	const formattedCutoffDate = cutoffDate.toISOString();
	const baseConditions = sql`(${podcasts.updatedAt} IS NULL OR ${podcasts.updatedAt} < ${formattedCutoffDate}) OR
		(${podcasts.lastBuildDate} IS NULL OR ${podcasts.lastBuildDate} < ${formattedCutoffDate})`;

	// Create the query based on whether random sampling is requested
	const podcastsToUpdate = await (randomSample && limit
		? db
				.select()
				.from(podcasts)
				.where(baseConditions)
				.orderBy(sql`RANDOM()`)
				.limit(limit)
		: db
				.select()
				.from(podcasts)
				.where(baseConditions)
				.orderBy((cols) => [cols.updatedAt])
				.limit(limit || Number.MAX_SAFE_INTEGER));

	console.log(`Updating ${podcastsToUpdate.length} podcasts`);

	const results = [];

	// Process podcasts in batches
	for (let i = 0; i < podcastsToUpdate.length; i += BATCH_SIZE) {
		const batch = podcastsToUpdate.slice(i, i + BATCH_SIZE);
		const batchResults = await Promise.all(
			batch.map((podcast) => processPodcast(podcast, parser)),
		);
		results.push(...batchResults);
	}

	return results;
}

export async function updatePodcastByFeedUrl(feedUrl: string) {
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

export async function addNewPodcast(feedUrl: string) {
	console.log("Adding new podcast:", feedUrl);

	try {
		// First check if podcast already exists
		const [existingPodcast] = await db
			.select()
			.from(podcasts)
			.where(eq(podcasts.feedUrl, feedUrl))
			.limit(1);

		if (existingPodcast) {
			return {
				success: false,
				error: "Podcast already exists",
				podcast: existingPodcast,
			};
		}

		// Get health check first
		const healthCheck = await podcastIndex.getPodcastByFeedUrl(feedUrl);
		if (!healthCheck) {
			return {
				success: false,
				error: "Failed health check - podcast may be dead or have parse errors",
			};
		}

		// Parse the RSS feed
		let data: CustomFeed;
		try {
			data = await parser.parseURL(feedUrl);
		} catch (error) {
			console.error("Failed to parse RSS feed:", error);
			return {
				success: false,
				error: "Failed to parse RSS feed",
			};
		}

		// Get iTunes data if available
		let itunesData = null;
		// Try to get iTunes ID from feed first
		if (data.itunes?.id) {
			itunesData = await getITunesPodcastByID(data.itunes.id);
		}

		// If no iTunes data yet, try searching by title and author
		if (!itunesData && data.title) {
			try {
				const searchQuery = `${data.title} ${data.itunes?.author || ""}`.trim();
				const response = await fetch(
					`https://itunes.apple.com/search?term=${encodeURIComponent(
						searchQuery,
					)}&entity=podcast&limit=1`,
				);
				if (response.ok) {
					const searchData = (await response.json()) as iTunesSearchResponse;
					if (searchData.results.length > 0) {
						itunesData = searchData.results[0];
					}
				}
			} catch (error) {
				console.error("iTunes search error:", error);
			}
		}

		// Insert the new podcast
		const [insertedPodcast] = await db
			.insert(podcasts)
			.values({
				title: decode(data.title || ""),
				podcastSlug: slugify(decode(data.title || "")),
				feedUrl: feedUrl,
				description: decode(data.description || ""),
				image: data.image?.url || data.itunes?.image || "",
				author: decode(data.itunes?.author || ""),
				link: data.link || "",
				language: data.language || "",
				lastBuildDate: data.lastBuildDate ? new Date(data.lastBuildDate) : null,
				itunesOwnerName: decode(data.itunes?.owner?.name || ""),
				itunesOwnerEmail: data.itunes?.owner?.email || "",
				itunesImage: itunesData?.artworkUrl600 || data.itunes?.image || "",
				itunesAuthor: decode(
					itunesData?.artistName || data.itunes?.author || "",
				),
				itunesSummary: decode(data.itunes?.summary || ""),
				itunesExplicit: data.itunes?.explicit === "yes" ? "yes" : "no",
				episodeCount: healthCheck.episodeCount,
				isDead: healthCheck.isDead,
				hasParseErrors: healthCheck.hasParseErrors,
				iTunesId: itunesData?.collectionId?.toString() || "",
			})
			.returning();

		if (!insertedPodcast) {
			return {
				success: false,
				error: "Failed to insert podcast",
			};
		}

		// Process initial episodes
		const episodeValues = (data.items ?? [])
			.filter(
				(item): item is NonNullable<typeof item> => !!item?.enclosure?.url,
			)
			.map((item) => ({
				podcastId: insertedPodcast.id,
				title: decode(item.title || ""),
				episodeSlug: slugify(decode(item.title || "")),
				pubDate: item.pubDate ? parseDate(item.pubDate) : null,
				content: item.content || null,
				link: item.link || null,
				enclosureUrl: item.enclosure?.url || "",
				duration: item.itunes?.duration || "",
				explicit: item.itunes?.explicit === "yes" ? "yes" : "no",
				image: item.itunes?.image || null,
			}));

		if (episodeValues.length > 0) {
			await db.insert(episodes).values(episodeValues as Episode[]);
		}

		return {
			success: true,
			podcast: insertedPodcast,
			episodesAdded: episodeValues.length,
		};
	} catch (error) {
		console.error("Error adding new podcast:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
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
			const [insertedPodcast] = await db
				.insert(podcasts)
				.values({
					title: decode(data.title || ""),
					podcastSlug: slugify(decode(data.title || "")),
					feedUrl: feed.feedUrl,
					description: decode(data.description || ""),
					image: data.image?.url || data.itunes?.image || "",
					author: decode(data.itunes?.author || ""),
					link: data.link || "",
					language: data.language || "",
					lastBuildDate:
						data.lastBuildDate ?? itunesData?.releaseDate
							? new Date(data.lastBuildDate ?? itunesData?.releaseDate)
							: null,
					itunesOwnerName: decode(data.itunes?.owner?.name || ""),
					itunesOwnerEmail: data.itunes?.owner?.email || "",
					itunesImage: data.itunes?.image || "",
					itunesAuthor: decode(data.itunes?.author || ""),
					itunesSummary: decode(data.itunes?.summary || ""),
					itunesExplicit: data.itunes?.explicit === "yes" ? "yes" : "no",
					iTunesId: itunesData?.collectionId?.toString() || "",
					vibrantColor: null,
				})
				.returning();

			if (insertedPodcast) {
				// Process initial episodes
				const episodeValues = (data.items ?? [])
					.filter(
						(item): item is NonNullable<typeof item> => !!item?.enclosure?.url,
					)
					.map((item) => ({
						podcastId: insertedPodcast.id,
						title: decode(item.title || ""),
						episodeSlug: slugify(decode(item.title || "")),
						pubDate: item.pubDate ? parseDate(item.pubDate) : null,
						content: item.content || null,
						link: item.link || null,
						enclosureUrl: item.enclosure?.url || "",
						duration: item.itunes?.duration || "",
						explicit: item.itunes?.explicit === "yes" ? "yes" : "no",
						image: item.itunes?.image || null,
					}));

				if (episodeValues.length > 0) {
					await db.insert(episodes).values(episodeValues as Episode[]);
				}
			}

			results.push({ success: true, feedUrl: feed.feedUrl });
		} catch (error) {
			console.error(`Error loading feed ${feed.feedUrl}:`, error);
			results.push({ success: false, feedUrl: feed.feedUrl, error });
		}
	}

	return results;
}
