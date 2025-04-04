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
import { optimizeImage } from "@/lib/image-utils";

const BATCH_SIZE = 5;
// Set to true to temporarily disable image processing if there are issues
const SKIP_IMAGE_PROCESSING = false;
// Skip actual image processing in development (faster, saves storage)
// but still validate the logic flow by returning a mock URL
// Can be overridden with FORCE_IMAGE_PROCESSING=true environment variable
const DEV_MODE_SKIP_ACTUAL_PROCESSING =
	process.env.NODE_ENV === "development" &&
	process.env.FORCE_IMAGE_PROCESSING !== "true";

// Function to simulate image processing in development
async function mockImageProcessing(
	imageUrl: string,
	prefix: string,
): Promise<string | null> {
	// Validate URL and check skipImageProcessing logic
	if (!imageUrl || shouldSkipImageProcessing(imageUrl)) {
		console.log(`[DEV-IMAGE] Would skip processing for: ${imageUrl}`);
		return null;
	}

	console.log(`[DEV-IMAGE] Would process image: ${imageUrl}`);

	// Generate a deterministic mock URL based on the input URL
	// This ensures we get the same result for the same input, which helps with testing
	// Using a hash of the URL would be better, but for simplicity:
	const mockId = imageUrl
		.replace(/[^a-z0-9]/gi, "") // Remove special chars
		.substring(0, 8); // Take first 8 chars

	return `https://dev-mocked-image-cdn.example.com/${prefix}/${mockId}.webp`;
}

// Wrapper function to handle image processing based on environment
async function processImage(
	imageUrl: string,
	size: number,
	prefix: string,
): Promise<string | null> {
	if (DEV_MODE_SKIP_ACTUAL_PROCESSING) {
		return mockImageProcessing(imageUrl, prefix);
	}
	return optimizeImage(imageUrl, size, prefix);
}

// Add a function to check if image processing should be skipped
function shouldSkipImageProcessing(url: string): boolean {
	// Global override
	if (SKIP_IMAGE_PROCESSING) return true;

	// Skip if URL is empty or null
	if (!url) return true;

	try {
		// Validate URL format
		new URL(url);
	} catch (e) {
		console.log(`[DEBUG] Skipping invalid image URL: ${url}`);
		return true;
	}

	// Skip based on known problematic hosts or patterns
	const problematicPatterns: string[] = [
		// Websites that commonly return HTML instead of images
		"cloudfront.net/image",
		"google.com",
		"facebook.com",
		"twitter.com",
		"instagram.com",
		// File types known to cause issues
		".php",
		"?",
		".aspx",
		"imgur.com/a/", // Album URLs instead of direct image URLs
		// Common redirectors
		"bit.ly",
		"tinyurl.com",
		"ow.ly",
		// Protocols other than http/https
		"data:",
		"ftp:",
	];

	const hasProblematicPattern = problematicPatterns.some((pattern) =>
		url.includes(pattern),
	);
	if (hasProblematicPattern) {
		console.log(`[DEBUG] Skipping problematic image URL pattern: ${url}`);
		return true;
	}

	// Skip non-image URLs (based on extension)
	const validImageExtensions = [
		".jpg",
		".jpeg",
		".png",
		".gif",
		".webp",
		".svg",
		".avif",
	];
	const hasValidExtension = validImageExtensions.some((ext) =>
		url.toLowerCase().includes(ext),
	);

	// Only process URLs that appear to be image files
	if (!hasValidExtension) {
		// Exception for common image CDNs that might not have extensions
		const trustedImageCDNs = [
			"imagecdn.app",
			"cloudinary.com",
			"res.cloudinary.com",
			"cdn.sanity.io",
			"images.unsplash.com",
			"storage.googleapis.com",
		];

		const isTrustedCDN = trustedImageCDNs.some((cdn) => url.includes(cdn));
		if (!isTrustedCDN) {
			console.log(`[DEBUG] Skipping URL without valid image extension: ${url}`);
			return true;
		}
	}

	return false;
}

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
	guid?: string;
	enclosure?: {
		url?: string;
	};
	itunes?: {
		duration?: string;
		explicit?: string;
		image?: string;
		episode?: string;
		season?: string;
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

	// Try to discover and subscribe to WebSub hub
	const hubUrl = await webSubManager.discoverWebSubHub(podcast.feedUrl);
	if (hubUrl) {
		console.log(`Found WebSub hub for ${podcast.title}: ${hubUrl}`);
		await webSubManager.subscribe(podcast.feedUrl, hubUrl);
	}

	try {
		// Quick RSS feed check first
		let data: CustomFeed;
		try {
			console.log(
				`[DEBUG] Attempting to parse RSS feed for ${podcast.title} (${podcast.feedUrl})`,
			);
			data = await customParser.parseURL(podcast.feedUrl);
			console.log(`[DEBUG] Successfully parsed RSS feed for ${podcast.title}`);
		} catch (error) {
			console.error(
				`[ERROR] Failed to parse RSS feed for ${podcast.title} (${podcast.feedUrl}):`,
				error,
			);
			// Even if we can't parse the feed, we should keep the podcast in the database
			// Just update the lastBuildDate to avoid constant retries
			await db
				.update(podcasts)
				.set({
					updatedAt: new Date(),
					hasParseErrors: 1,
				})
				.where(eq(podcasts.id, podcast.id));

			return {
				success: false,
				podcastId: podcast.id,
				error: "Failed to parse RSS feed",
			};
		}

		// Parse and validate lastBuildDate
		const lastBuildDate = parseDate(data.lastBuildDate);
		console.log(
			`[DEBUG] Parsed lastBuildDate: ${lastBuildDate}, current lastBuildDate: ${podcast.lastBuildDate}`,
		);

		// Check if feed has been updated since last check
		if (
			lastBuildDate &&
			podcast.lastBuildDate &&
			lastBuildDate <= podcast.lastBuildDate
		) {
			console.log(
				`[INFO] Skipping ${podcast.title} - no new content since last update`,
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
			try {
				console.log(
					`[DEBUG] Checking health for ${podcast.title} via Podcast Index`,
				);
				healthCheck = await podcastIndex.getPodcastByFeedUrl(podcast.feedUrl);
				console.log("[DEBUG] Health check result:", {
					isDead: healthCheck?.isDead,
					episodeCount: healthCheck?.episodeCount,
					hasParseErrors: healthCheck?.hasParseErrors,
				});
			} catch (error) {
				console.error(
					`[ERROR] Error checking podcast health for ${podcast.title}:`,
					error,
				);
				// Continue with the update even if health check fails
			}

			// Get iTunes data
			try {
				console.log(
					`[DEBUG] Fetching iTunes data for ${podcast.title} (iTunesId: ${podcast.iTunesId})`,
				);
				itunesData = await getITunesPodcastByID(podcast.iTunesId ?? "");
				console.log("[DEBUG] iTunes data status:", {
					found: !!itunesData,
					iTunesId: podcast.iTunesId,
				});
			} catch (error) {
				console.error(
					`[ERROR] Error fetching iTunes data for ${podcast.title}:`,
					error,
				);
				// Continue with the update even if iTunes data fetch fails
			}
		}

		// Get the podcast image URL
		const podcastImageUrl =
			data.image?.url ||
			data.itunes?.image ||
			itunesData?.artworkUrl600 ||
			podcast.image;

		console.log(`[IMAGE-DEBUG] Podcast: ${podcast.title}`, {
			currentPodcastImage: podcast.podcastImage,
			newImageUrl: podcastImageUrl,
			imageSource: data.image?.url
				? "RSS feed image"
				: data.itunes?.image
				  ? "iTunes feed image"
				  : itunesData?.artworkUrl600
					  ? "iTunes API image"
					  : podcast.image
						  ? "Existing image"
						  : "No image found",
		});

		// Optimize podcast image if we have one
		let podcast_image = undefined;
		if (podcastImageUrl && !shouldSkipImageProcessing(podcastImageUrl)) {
			console.log(
				`[IMAGE-DEBUG] Attempting to process image for ${podcast.title}`,
				{
					url: podcastImageUrl,
					skipImageProcessing: SKIP_IMAGE_PROCESSING,
					devMode: DEV_MODE_SKIP_ACTUAL_PROCESSING,
				},
			);

			try {
				const processedImage = await processImage(
					podcastImageUrl,
					1400,
					"podcasts",
				);
				if (processedImage) {
					podcast_image = processedImage;
					console.log(
						`[IMAGE-DEBUG] Successfully processed image for ${podcast.title}`,
						{
							originalUrl: podcastImageUrl,
							processedUrl: processedImage,
						},
					);
				} else {
					console.log(
						`[IMAGE-DEBUG] Image processing returned null for ${podcast.title}`,
						{
							originalUrl: podcastImageUrl,
						},
					);
				}
			} catch (error) {
				console.error(
					`[IMAGE-DEBUG] Error optimizing podcast image for ${podcast.title}:`,
					{
						error,
						originalUrl: podcastImageUrl,
						willPreserveExisting: true,
					},
				);
				// Don't set podcast_image to null, leave it undefined to preserve existing
			}
		} else {
			console.log(
				`[IMAGE-DEBUG] Skipping image processing for ${podcast.title}`,
				{
					hasUrl: !!podcastImageUrl,
					url: podcastImageUrl,
					skipReason: !podcastImageUrl ? "No URL" : "Failed skip check",
				},
			);
		}

		// Log the final state before update
		console.log(`[IMAGE-DEBUG] Final image state for ${podcast.title}`, {
			willUpdate: podcast_image !== undefined,
			newImageValue: podcast_image,
			willPreserveExisting: podcast_image === undefined,
			currentValue: podcast.podcastImage,
		});

		// Update podcast metadata with what we have
		console.log(`[DEBUG] Updating podcast metadata for ${podcast.title}`);
		const [updatedPodcast] = await db
			.insert(podcasts)
			.values({
				title: decode(data.title || podcast.title),
				podcastSlug: slugify(decode(data.title || podcast.title)),
				feedUrl: podcast.feedUrl,
				description:
					data.description || itunesData?.description || podcast.description,
				image: podcastImageUrl,
				podcastImage: podcast_image,
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
				// Only update these fields if we have new data, otherwise keep existing values
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
					podcastImage:
						podcast_image !== undefined
							? sql`EXCLUDED.podcast_image`
							: undefined,
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
					updatedAt: sql`CURRENT_TIMESTAMP`,
				},
			})
			.returning();

		// Process episodes if podcast was updated successfully
		if (updatedPodcast) {
			console.log(
				`[DEBUG] Successfully updated podcast metadata for ${podcast.title}`,
			);
			// Get the latest episode date from the database
			const [latestEpisode] = await db
				.select({ pubDate: episodes.pubDate })
				.from(episodes)
				.where(eq(episodes.podcastId, podcast.id))
				.orderBy(sql`${episodes.pubDate} DESC`)
				.limit(1);

			// Prepare episode values for bulk insert/update with decoded text
			const episodeValues = (data.items ?? [])
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
				.map(async (item) => {
					// Get the episode image URL
					const episodeImageUrl = item.itunes?.image || null;

					// Optimize episode image if we have one
					let episode_image = null;
					if (episodeImageUrl && !shouldSkipImageProcessing(episodeImageUrl)) {
						try {
							episode_image = await processImage(
								episodeImageUrl,
								1400,
								"episodes",
							);
						} catch (error) {
							console.error(
								`Error optimizing episode image for ${item.title}:`,
								error,
							);
							episode_image = null;
						}
					}

					return {
						podcastId: podcast.id,
						title: decode(item.title || ""),
						episodeSlug: slugify(decode(item.title || "")),
						pubDate: item.pubDate ? parseDate(item.pubDate) : null,
						content: item.content || null,
						link: item.link || null,
						enclosureUrl: item.enclosure?.url || "",
						duration: item.itunes?.duration || "",
						explicit: item.itunes?.explicit === "yes" ? "yes" : "no",
						image: episodeImageUrl,
						episodeImage: episode_image,
						guid: item.guid || null,
						itunesEpisode: item.itunes?.episode || null,
					};
				});

			if (episodeValues.length > 0) {
				console.log(
					`[DEBUG] Attempting to upsert ${episodeValues.length} episodes for ${podcast.title}`,
				);

				// Wait for all episode values to be processed
				const processedEpisodeValues = await Promise.all(episodeValues);

				// Remove duplicates by keeping only the first occurrence of each GUID or enclosureUrl
				const uniqueEpisodes = processedEpisodeValues.reduce((acc, episode) => {
					// If episode has a GUID, use that as the key
					if (episode.guid) {
						const key = episode.guid;
						if (!acc.has(key)) {
							acc.set(key, episode);
						}
					}
					// If no GUID, use enclosureUrl as the key
					else {
						const key = episode.enclosureUrl;
						if (!acc.has(key)) {
							acc.set(key, episode);
						}
					}
					return acc;
				}, new Map<string, (typeof processedEpisodeValues)[0]>());

				const deduplicatedEpisodes = Array.from(uniqueEpisodes.values());

				if (processedEpisodeValues.length !== deduplicatedEpisodes.length) {
					console.log(
						`[DEBUG] Removed ${
							processedEpisodeValues.length - deduplicatedEpisodes.length
						} duplicate episodes for ${podcast.title}`,
					);
				}

				// --- Add Logging Here ---
				console.log(
					`[DEBUG] Data prepared for upsert for ${podcast.title} (${deduplicatedEpisodes.length} episodes):`,
				);
				deduplicatedEpisodes.forEach((ep, index) => {
					console.log(
						`  [${index + 1}] guid: ${ep.guid}, enclosureUrl: ${
							ep.enclosureUrl
						}, title: ${ep.title}, pubDate: ${ep.pubDate}`,
					);
				});
				// --- End Logging ---

				try {
					// First try to upsert episodes with GUIDs
					const episodesWithGuid = deduplicatedEpisodes.filter(
						(episode) => episode.guid,
					) as Episode[];

					if (episodesWithGuid.length > 0) {
						console.log(
							`[DEBUG] Upserting ${episodesWithGuid.length} episodes with GUIDs for ${podcast.title}`,
						);
						await db
							.insert(episodes)
							.values(episodesWithGuid)
							.onConflictDoUpdate({
								target: episodes.guid,
								where: sql`${episodes.guid} IS NOT NULL AND EXCLUDED.guid IS NOT NULL`,
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
									episodeImage: sql`EXCLUDED.episode_image`,
									itunesEpisode: sql`EXCLUDED.itunes_episode`,
									updatedAt: sql`CURRENT_TIMESTAMP`,
								},
							});
					} else {
						console.log(
							`[DEBUG] No episodes with GUIDs to upsert for ${podcast.title}`,
						);
					}

					// Then handle episodes without GUIDs using enclosureUrl
					const episodesWithoutGuid = deduplicatedEpisodes.filter(
						(episode) => !episode.guid,
					) as Episode[];

					if (episodesWithoutGuid.length > 0) {
						console.log(
							`[DEBUG] Upserting ${episodesWithoutGuid.length} episodes without GUIDs for ${podcast.title}`,
						);
						await db
							.insert(episodes)
							.values(episodesWithoutGuid)
							.onConflictDoUpdate({
								target: episodes.enclosureUrl,
								set: {
									title: sql`EXCLUDED.title`,
									episodeSlug: sql`EXCLUDED.episode_slug`,
									pubDate: sql`EXCLUDED.pub_date`,
									content: sql`EXCLUDED.content`,
									link: sql`EXCLUDED.link`,
									duration: sql`EXCLUDED.duration`,
									explicit: sql`EXCLUDED.explicit`,
									image: sql`EXCLUDED.image`,
									episodeImage: sql`EXCLUDED.episode_image`,
									guid: sql`EXCLUDED.guid`,
									itunesEpisode: sql`EXCLUDED.itunes_episode`,
									updatedAt: sql`CURRENT_TIMESTAMP`,
								},
							});
					} else {
						console.log(
							`[DEBUG] No episodes without GUIDs to upsert for ${podcast.title}`,
						);
					}

					console.log(
						`[DEBUG] Successfully upserted ${deduplicatedEpisodes.length} episodes for ${podcast.title}`,
					);
				} catch (upsertError) {
					console.error("[ERROR] Episode upsert error details:", {
						podcastId: podcast.id,
						podcastTitle: podcast.title,
						episodeCount: deduplicatedEpisodes.length,
						error: upsertError,
					});
					throw upsertError;
				}
			} else {
				console.log(`[DEBUG] No new episodes to upsert for ${podcast.title}`);
			}

			return {
				success: true,
				podcastId: podcast.id,
				episodesUpdated: episodeValues.length,
				lastBuildDate,
			};
		}

		console.log(`[WARNING] No podcast update performed for ${podcast.title}`);
		return {
			success: true,
			podcastId: podcast.id,
			episodesUpdated: 0,
			skippedReason: "No podcast update needed",
		};
	} catch (error) {
		console.error("[ERROR] Podcast processing error:", {
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
	const { minHoursSinceUpdate = 24, limit, randomSample = false } = options;

	// Log the current image processing configuration
	console.log("\n--- Podcast Update Configuration ---");
	console.log({
		environment: process.env.NODE_ENV || "unknown",
		skipImageProcessing: SKIP_IMAGE_PROCESSING,
		devModeSkipActualProcessing: DEV_MODE_SKIP_ACTUAL_PROCESSING,
		isUsingMockedImages: DEV_MODE_SKIP_ACTUAL_PROCESSING
			? "Yes - using mock URLs"
			: "No - processing real images",
		processingLimit: limit || "unlimited",
		batchSize: BATCH_SIZE,
	});

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
	console.log("[INFO] Adding new podcast:", feedUrl);

	try {
		// First check if podcast already exists
		const [existingPodcast] = await db
			.select()
			.from(podcasts)
			.where(eq(podcasts.feedUrl, feedUrl))
			.limit(1);

		if (existingPodcast) {
			console.log(`[INFO] Podcast with feed URL ${feedUrl} already exists`);

			// Even if the podcast already exists, revalidate the caches
			// to ensure it appears correctly in the UI
			try {
				const { revalidatePodcastsAndEpisodes } = await import("@/db/queries");
				revalidatePodcastsAndEpisodes();
			} catch (error) {
				console.error("[ERROR] Failed to revalidate caches:", error);
			}

			return {
				success: false,
				error: "Podcast already exists",
				podcast: existingPodcast,
			};
		}

		// Get health check first
		let healthCheck = null;
		try {
			console.log(
				`[DEBUG] Checking health for new podcast ${feedUrl} via Podcast Index`,
			);
			healthCheck = await podcastIndex.getPodcastByFeedUrl(feedUrl);
			console.log("[DEBUG] Health check result:", {
				isDead: healthCheck?.isDead,
				episodeCount: healthCheck?.episodeCount,
				hasParseErrors: healthCheck?.hasParseErrors,
			});
		} catch (error) {
			console.error(
				`[ERROR] Error checking podcast health for ${feedUrl}:`,
				error,
			);
			// Continue with the addition even if health check fails
		}

		// Parse the RSS feed
		let data: CustomFeed;
		try {
			console.log(
				`[DEBUG] Attempting to parse RSS feed for new podcast ${feedUrl}`,
			);
			data = await parser.parseURL(feedUrl);
			console.log(
				`[DEBUG] Successfully parsed RSS feed for new podcast ${feedUrl}`,
			);
		} catch (error) {
			console.error(`[ERROR] Failed to parse RSS feed for ${feedUrl}:`, error);
			return {
				success: false,
				error: "Failed to parse RSS feed",
			};
		}

		// Get iTunes data if available
		let itunesData = null;
		// Try to get iTunes ID from feed first
		if (data.itunes?.id) {
			try {
				console.log(
					`[DEBUG] Fetching iTunes data for new podcast ${feedUrl} (iTunesId: ${data.itunes.id})`,
				);
				itunesData = await getITunesPodcastByID(data.itunes.id);
				console.log("[DEBUG] iTunes data status:", {
					found: !!itunesData,
					iTunesId: data.itunes.id,
				});
			} catch (error) {
				console.error(
					`[ERROR] Error fetching iTunes data for ${feedUrl}:`,
					error,
				);
				// Continue with the addition even if iTunes data fetch fails
			}
		}

		// If no iTunes data yet, try searching by title and author
		if (!itunesData && data.title) {
			try {
				const searchQuery = `${data.title} ${data.itunes?.author || ""}`.trim();
				console.log(`[DEBUG] Searching iTunes for "${searchQuery}"`);
				const response = await fetch(
					`https://itunes.apple.com/search?term=${encodeURIComponent(
						searchQuery,
					)}&entity=podcast&limit=1`,
				);
				if (response.ok) {
					const searchData = (await response.json()) as iTunesSearchResponse;
					if (searchData.results.length > 0) {
						itunesData = searchData.results[0];
						console.log(
							`[DEBUG] Found iTunes data via search for "${searchQuery}"`,
						);
					} else {
						console.log(
							`[DEBUG] No iTunes data found via search for "${searchQuery}"`,
						);
					}
				} else {
					console.error(
						`[ERROR] iTunes search failed for "${searchQuery}": ${response.status} ${response.statusText}`,
					);
				}
			} catch (error) {
				console.error(`[ERROR] iTunes search error for ${feedUrl}:`, error);
			}
		}

		// Insert the new podcast
		console.log(`[DEBUG] Inserting new podcast ${feedUrl} into database`);
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
				episodeCount: healthCheck?.episodeCount || 0,
				isDead: healthCheck?.isDead || 0,
				hasParseErrors: healthCheck?.hasParseErrors || 0,
				iTunesId: itunesData?.collectionId?.toString() || "",
			})
			.returning();

		if (!insertedPodcast) {
			console.error(`[ERROR] Failed to insert new podcast ${feedUrl}`);
			return {
				success: false,
				error: "Failed to insert podcast",
			};
		}

		console.log(
			`[DEBUG] Successfully inserted new podcast ${feedUrl} (${insertedPodcast.id})`,
		);

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
			console.log(
				`[DEBUG] Inserting ${episodeValues.length} episodes for new podcast ${feedUrl}`,
			);
			await db.insert(episodes).values(episodeValues as Episode[]);
			console.log(
				`[DEBUG] Successfully inserted ${episodeValues.length} episodes for new podcast ${feedUrl}`,
			);
		} else {
			console.log(`[WARNING] No episodes found for new podcast ${feedUrl}`);
		}

		// Revalidate all podcast-related caches
		try {
			const { revalidatePodcastsAndEpisodes } = await import("@/db/queries");
			revalidatePodcastsAndEpisodes();
		} catch (error) {
			console.error("[ERROR] Failed to revalidate caches:", error);
		}

		return {
			success: true,
			podcast: insertedPodcast,
			episodesAdded: episodeValues.length,
		};
	} catch (error) {
		console.error(`[ERROR] Error adding new podcast ${feedUrl}:`, error);
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
