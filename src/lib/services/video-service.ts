import { db } from "@/db/client";
import { videos, channels, type Video, type Channel } from "@/db/schema";
import { desc, eq, ilike, sql, isNotNull } from "drizzle-orm";
import {
	CHANNELS,
	getChannelInfo,
	getAllPlaylistItems,
	getVideoInfo,
} from "@/lib/youtube";
import { unstable_cache } from "next/cache";

// Get video by ID
export async function getVideoById(videoId: string) {
	const [video] = await db
		.select()
		.from(videos)
		.where(eq(videos.id, videoId))
		.limit(1);

	return video;
}

// Get latest videos for home page
export const getHomeLatestVideos = unstable_cache(
	async (limit = 3) => {
		return db
			.select({
				id: videos.id,
				title: videos.title,
				description: videos.description,
				thumbnailUrl: videos.thumbnailUrl,
				channelTitle: channels.title,
				channelId: channels.id,
				publishedAt: videos.publishedAt,
				duration: videos.duration,
			})
			.from(videos)
			.innerJoin(channels, eq(videos.channelId, channels.id))
			.orderBy(desc(videos.publishedAt))
			.limit(limit);
	},
	["home-latest-videos"],
	{ tags: ["videos"], revalidate: 3600 }, // 60 minutes in seconds
);

// Get latest videos (full data)
export const getLatestVideos = unstable_cache(
	async (limit = 3) => {
		return db
			.select({
				video: {
					id: videos.id,
					title: videos.title,
					description: videos.description,
					thumbnailUrl: videos.thumbnailUrl,
					publishedAt: videos.publishedAt,
					viewCount: videos.viewCount,
					likeCount: videos.likeCount,
					commentCount: videos.commentCount,
					duration: videos.duration,
					youtubeVideoId: videos.youtubeVideoId,
					createdAt: videos.createdAt,
					updatedAt: videos.updatedAt,
					tags: videos.tags,
					channelId: videos.channelId,
				},
				channel: {
					id: channels.id,
					title: channels.title,
					thumbnailUrl: channels.thumbnailUrl,
				},
			})
			.from(videos)
			.innerJoin(channels, eq(videos.channelId, channels.id))
			.orderBy(desc(videos.publishedAt))
			.limit(limit);
	},
	["latest-videos"],
	{ tags: ["videos"], revalidate: 3600 }, // 60 minutes in seconds
);

// Get channel by ID
export async function getChannelById(channelId: string) {
	const [channel] = await db
		.select()
		.from(channels)
		.where(eq(channels.id, channelId))
		.limit(1);

	return channel;
}

// Get all channels
export async function getAllChannels() {
	const subscriberCountCol = sql`CAST(${channels.subscriberCount} AS INTEGER)`;
	return db
		.select({
			id: channels.id,
			title: channels.title,
			youtubeChannelId: channels.youtubeChannelId,
			customUrl: channels.customUrl,
			description: channels.description,
			thumbnailUrl: channels.thumbnailUrl,
			subscriberCount: subscriberCountCol,
			videoCount: channels.videoCount,
			viewCount: channels.viewCount,
			createdAt: channels.createdAt,
			updatedAt: channels.updatedAt,
			country: channels.country,
		})
		.from(channels)
		.orderBy(desc(subscriberCountCol));
}

// Get featured channels
export const getFeaturedChannels = unstable_cache(
	async (limit = 3) => {
		const subscriberCountCol = sql`CAST(${channels.subscriberCount} AS INTEGER)`;
		return db
			.select({
				id: channels.id,
				title: channels.title,
				thumbnailUrl: channels.thumbnailUrl,
				vibrantColor: channels.vibrantColor,
				subscriberCount: channels.subscriberCount,
				viewCount: channels.viewCount,
			})
			.from(channels)
			.where(isNotNull(channels.thumbnailUrl))
			.orderBy(desc(subscriberCountCol))
			.limit(limit);
	},
	["featured-channels"],
	{ tags: ["channels"], revalidate: 3600 },
);

// Get channel videos
export async function getChannelVideos(
	channelId: string,
	limit = 10,
	offset = 0,
) {
	return db
		.select()
		.from(videos)
		.where(eq(videos.channelId, channelId))
		.orderBy(desc(videos.publishedAt))
		.limit(limit)
		.offset(offset);
}

// Get videos with channel info
export async function getVideosWithChannels(limit = 30) {
	return db
		.select({
			video: videos,
			channel: channels,
		})
		.from(videos)
		.innerJoin(channels, eq(videos.channelId, channels.id))
		.orderBy(desc(videos.publishedAt))
		.limit(limit);
}

// Search videos with channel info
export async function searchVideosWithChannels(query: string, limit = 30) {
	return db
		.select({
			video: videos,
			channel: channels,
		})
		.from(videos)
		.innerJoin(channels, eq(videos.channelId, channels.id))
		.where(
			sql`to_tsvector('english', ${videos.title} || ' ' || ${videos.description}) @@ to_tsquery('english', ${query})`,
		)
		.orderBy(desc(videos.publishedAt))
		.limit(limit);
}

// Types for the combined queries
export interface VideoWithChannel {
	video: Video;
	channel: Channel;
}

// Process a single video efficiently
export async function processVideo(
	videoId: string,
	channelId: string,
	forceUpdate = false,
) {
	try {
		console.log(`Processing video ${videoId} for channel ${channelId}...`);

		// Check if video exists and was recently updated
		const existingVideo = await db
			.select()
			.from(videos)
			.where(eq(videos.youtubeVideoId, videoId))
			.limit(1);

		if (
			existingVideo.length &&
			!forceUpdate &&
			existingVideo[0].updatedAt &&
			Date.now() - existingVideo[0].updatedAt.getTime() < 24 * 60 * 60 * 1000
		) {
			const lastUpdate = new Date(existingVideo[0].updatedAt).toLocaleString();
			console.log(
				`Using cached video data for ${videoId} (last updated: ${lastUpdate})`,
			);
			return { status: "cached" as const };
		}

		console.log(`Fetching video info from YouTube for ${videoId}...`);
		// Fetch video info from YouTube
		const videoInfo = await getVideoInfo(videoId);
		if (!videoInfo?.items[0]) {
			console.log(
				`No video info found for ${videoId} - video may be private or deleted`,
			);
			return { status: "not_found" as const };
		}

		const videoData = videoInfo.items[0];
		console.log(
			`Updating video in database: "${videoData.snippet.title}" (${videoId})`,
		);

		// Insert or update video
		await db
			.insert(videos)
			.values({
				youtubeVideoId: videoData.id,
				channelId,
				title: videoData.snippet.title,
				description: videoData.snippet.description,
				channelTitle: videoData.snippet.channelTitle,
				thumbnailUrl:
					videoData.snippet.thumbnails.maxres?.url ||
					videoData.snippet.thumbnails.high?.url,
				publishedAt: new Date(videoData.snippet.publishedAt),
				viewCount: String(videoData.statistics.viewCount),
				likeCount: String(videoData.statistics.likeCount),
				commentCount: String(videoData.statistics.commentCount),
				tags: videoData.snippet.tags || [],
			})
			.onConflictDoUpdate({
				target: videos.youtubeVideoId,
				set: {
					title: sql`EXCLUDED.title`,
					description: sql`EXCLUDED.description`,
					thumbnailUrl: sql`EXCLUDED.thumbnail_url`,
					viewCount: sql`EXCLUDED.view_count`,
					likeCount: sql`EXCLUDED.like_count`,
					commentCount: sql`EXCLUDED.comment_count`,
					tags: sql`EXCLUDED.tags`,
					updatedAt: sql`CURRENT_TIMESTAMP`,
				},
			});

		console.log(`Successfully updated video: ${videoData.snippet.title}`);
		return { status: "updated" as const, data: videoData };
	} catch (error) {
		console.error(`Error processing video ${videoId}:`, error);
		return { status: "error" as const, error };
	}
}

// Add this helper function for processing selected videos
async function processSelectedVideos(channelId: string, forceUpdate = false) {
	console.log("\nProcessing selected videos for channel:", channelId);

	try {
		// Get all videos for this channel from our database
		const existingVideos = await db
			.select({
				id: videos.id,
				youtubeVideoId: videos.youtubeVideoId,
				updatedAt: videos.updatedAt,
			})
			.from(videos)
			.where(eq(videos.channelId, channelId));

		if (!existingVideos.length) {
			console.log("No videos found for channel");
			return [];
		}

		console.log(`Found ${existingVideos.length} videos to process`);

		// Process videos in batches of 50 (YouTube API limit)
		const batchSize = 50;
		const videoResults = [];

		for (let i = 0; i < existingVideos.length; i += batchSize) {
			const batch = existingVideos.slice(i, i + batchSize);
			console.log(
				`Processing batch ${i / batchSize + 1} of ${Math.ceil(
					existingVideos.length / batchSize,
				)}`,
			);

			// Process each video in the batch
			for (const video of batch) {
				const result = await processVideo(
					video.youtubeVideoId,
					channelId,
					forceUpdate,
				);
				videoResults.push(result);
			}

			// Add a small delay between batches to avoid rate limiting
			if (i + batchSize < existingVideos.length) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}

		return videoResults;
	} catch (error) {
		console.error("Error processing selected videos:", error);
		return [];
	}
}

// Process a single channel efficiently
export async function processChannel(
	youtubeChannelId: string,
	options: {
		videosPerChannel?: number;
		maxVideos?: number;
		forceUpdate?: boolean;
	} = {},
) {
	console.log("\nStarting processChannel with detailed logging...");
	console.log("Channel ID:", youtubeChannelId);
	console.log("Options:", JSON.stringify(options, null, 2));

	const {
		videosPerChannel = 10,
		maxVideos = 10,
		forceUpdate = false,
	} = options;

	try {
		console.log("\nChecking database for channel...");
		const [existingChannel] = await db
			.select()
			.from(channels)
			.where(eq(channels.youtubeChannelId, youtubeChannelId))
			.limit(1);

		const channelStatus = existingChannel ? "existing" : "new";
		console.log("Channel status:", channelStatus);

		if (existingChannel) {
			console.log("Channel last updated:", existingChannel.updatedAt);
			console.log("Channel import type:", existingChannel.importType);

			// Skip processing if channel is marked as "none"
			if (existingChannel.importType === "none") {
				console.log("Channel marked as 'none' - skipping processing");
				return {
					status: "cached",
					message: "Channel marked as 'none' - skipping processing",
					videos: [],
				};
			}

			// Check if channel needs update
			if (
				!forceUpdate &&
				existingChannel.updatedAt &&
				Date.now() - existingChannel.updatedAt.getTime() < 24 * 60 * 60 * 1000
			) {
				console.log("Channel recently updated - using cache");
				return {
					status: "cached",
					message: "Channel recently updated - using cache",
					videos: [],
				};
			}
		}

		if (forceUpdate) {
			console.log("Force update requested - processing videos");
		}

		// Get channel info from YouTube
		console.log("\nFetching channel info from YouTube...");
		const channelInfo = await getChannelInfo(youtubeChannelId);
		if (!channelInfo?.items?.[0]) {
			console.error("Channel not found on YouTube");
			return {
				status: "error",
				message: "Channel not found on YouTube",
				videos: [],
			};
		}

		const channelData = channelInfo.items[0];

		// Insert or update channel
		console.log("\nUpdating channel in database...");
		const [updatedChannel] = await db
			.insert(channels)
			.values({
				youtubeChannelId: channelData.id,
				title: channelData.snippet.title,
				description: channelData.snippet.description,
				customUrl: channelData.snippet.customUrl,
				thumbnailUrl:
					channelData.snippet.thumbnails.high?.url ||
					channelData.snippet.thumbnails.medium?.url ||
					channelData.snippet.thumbnails.default?.url,
				subscriberCount: channelData.statistics.subscriberCount,
				videoCount: channelData.statistics.videoCount,
				viewCount: channelData.statistics.viewCount,
				country: channelData.snippet.country,
				importType: existingChannel?.importType || "full_channel", // Preserve existing import type
			})
			.onConflictDoUpdate({
				target: channels.youtubeChannelId,
				set: {
					title: sql`EXCLUDED.title`,
					description: sql`EXCLUDED.description`,
					customUrl: sql`EXCLUDED.custom_url`,
					thumbnailUrl: sql`EXCLUDED.thumbnail_url`,
					subscriberCount: sql`EXCLUDED.subscriber_count`,
					videoCount: sql`EXCLUDED.video_count`,
					viewCount: sql`EXCLUDED.view_count`,
					country: sql`EXCLUDED.country`,
					updatedAt: sql`now()`,
				},
			})
			.returning();

		// Process videos based on import type
		const videoResults: Array<{
			status: "updated" | "cached" | "error";
			message?: string;
		}> = [];

		if (updatedChannel.importType === "full_channel") {
			console.log("\nProcessing videos for full channel...");
			// Get channel's uploads playlist
			const uploads = await getAllPlaylistItems(
				`UU${youtubeChannelId.substring(2)}`,
			);

			if (!uploads || uploads.length === 0) {
				console.error("No videos found in uploads playlist");
				return {
					status: "error",
					message: "No videos found in uploads playlist",
					videos: [],
				};
			}

			// Process each video
			for (const item of uploads.slice(0, maxVideos)) {
				try {
					const videoResult = await processVideo(
						item.snippet.resourceId.videoId,
						updatedChannel.id,
						forceUpdate,
					);
					videoResults.push({
						status:
							videoResult.status === "not_found" ? "error" : videoResult.status,
						message:
							videoResult.status === "not_found"
								? "Video not found"
								: undefined,
					});
				} catch (err) {
					videoResults.push({
						status: "error",
						message: "Failed to process video",
					});
				}
			}
		} else if (updatedChannel.importType === "selected_videos") {
			console.log("\nUpdating only existing videos for selected channel...");
			// Get existing videos for this channel
			const existingVideos = await db
				.select({
					youtubeVideoId: videos.youtubeVideoId,
				})
				.from(videos)
				.where(eq(videos.channelId, updatedChannel.id));

			// Update each existing video
			for (const video of existingVideos) {
				try {
					const videoResult = await processVideo(
						video.youtubeVideoId,
						updatedChannel.id,
						forceUpdate,
					);
					videoResults.push({
						status:
							videoResult.status === "not_found" ? "error" : videoResult.status,
						message:
							videoResult.status === "not_found"
								? "Video not found"
								: undefined,
					});
				} catch (err) {
					videoResults.push({
						status: "error",
						message: "Failed to process video",
					});
				}
			}
		}

		return {
			status: "success",
			message: "Channel processed successfully",
			videos: videoResults,
		};
	} catch (error) {
		console.error("\nDetailed error in processChannel:", error);
		return {
			status: "error",
			message: "Error processing channel",
			videos: [],
		};
	}
}

// Helper function to extract YouTube video ID from URL
export function extractYouTubeVideoId(url: string): string | null {
	if (!url) return null;

	// Handle standard youtube.com URLs
	const regexYoutube =
		/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
	const matchYoutube = url.match(regexYoutube);

	if (matchYoutube?.[1]) {
		return matchYoutube[1];
	}

	// Handle youtu.be short URLs
	const regexShort = /youtu\.be\/([^"&?\/\s]{11})/i;
	const matchShort = url.match(regexShort);

	if (matchShort?.[1]) {
		return matchShort[1];
	}

	// If the URL is already just an ID (11 characters)
	if (/^[A-Za-z0-9_-]{11}$/.test(url)) {
		return url;
	}

	return null;
}

// Modify getChannelsNeedingUpdate to handle query typing correctly
export async function getChannelsNeedingUpdate(
	options: {
		minHoursSinceUpdate?: number;
		limit?: number;
		randomSample?: boolean;
		importType?: "full_channel" | "selected_videos" | "none";
	} = {},
) {
	const {
		minHoursSinceUpdate = 24,
		limit = 50,
		randomSample = false,
		importType,
	} = options;

	const minTimestamp = new Date(
		Date.now() - minHoursSinceUpdate * 60 * 60 * 1000,
	).toISOString();

	// Build the SQL query conditions
	const conditions = [
		sql`${channels.updatedAt} IS NULL OR ${channels.updatedAt} < ${minTimestamp}::timestamp`,
	];

	// Add importType filter if specified
	if (importType) {
		conditions.push(sql`${channels.importType} = ${importType}`);
	}

	// Combine conditions with AND
	const whereClause = sql.join(conditions, sql` AND `);

	// Create and execute the query
	const query = db
		.select({
			id: channels.id,
			youtubeChannelId: channels.youtubeChannelId,
			title: channels.title,
			updatedAt: channels.updatedAt,
		})
		.from(channels)
		.where(whereClause);

	// Add appropriate ordering and limit
	return randomSample
		? query.orderBy(sql`RANDOM()`).limit(limit)
		: query.orderBy(channels.updatedAt).limit(limit);
}

// Add a function to update only selected videos
export async function updateSelectedVideos(
	options: {
		limit?: number;
		videosPerChannel?: number;
		maxVideos?: number;
		forceUpdate?: boolean;
		minHoursSinceUpdate?: number;
		randomSample?: boolean;
	} = {},
) {
	return updateVideos({
		...options,
		updateByLastUpdated: true,
		importTypeFilter: "selected_videos" as const,
	});
}

// Update the updateVideos interface to include importTypeFilter
export async function updateVideos(
	options: {
		limit?: number;
		videosPerChannel?: number;
		maxVideos?: number;
		youtubeChannelId?: string;
		forceUpdate?: boolean;
		minHoursSinceUpdate?: number;
		updateByLastUpdated?: boolean;
		randomSample?: boolean;
		importTypeFilter?: "full_channel" | "selected_videos" | "none";
	} = {},
) {
	const {
		limit = 50,
		videosPerChannel = 10,
		maxVideos = videosPerChannel,
		youtubeChannelId,
		forceUpdate = false,
		minHoursSinceUpdate = 24,
		updateByLastUpdated = false,
		randomSample = false,
		importTypeFilter,
	} = options;

	try {
		console.log("\n=== Starting Video Update Process ===");
		console.log("Update options:", {
			limit,
			videosPerChannel,
			maxVideos,
			youtubeChannelId: youtubeChannelId || "all channels",
			forceUpdate,
			minHoursSinceUpdate,
			updateByLastUpdated,
			randomSample,
			importTypeFilter: importTypeFilter || "all",
		});

		const results = {
			channels: { updated: 0, cached: 0, failed: 0 },
			videos: { updated: 0, cached: 0, failed: 0 },
		};

		// Determine which channels to process
		let channelsToProcess: string[] = [];

		if (youtubeChannelId) {
			// Single channel update
			channelsToProcess = [youtubeChannelId];
		} else {
			// Always use database query to respect importTypeFilter
			console.log(
				"\nFetching channels from database with filter:",
				importTypeFilter || "all",
			);
			const outdatedChannels = await getChannelsNeedingUpdate({
				minHoursSinceUpdate,
				limit,
				randomSample,
				importType: importTypeFilter,
			});
			channelsToProcess = outdatedChannels.map((c) => c.youtubeChannelId);
			console.log(`Found ${channelsToProcess.length} channels needing update`);
		}

		console.log(`\nProcessing ${channelsToProcess.length} channels...`);
		let processedChannels = 0;

		// Process channels in sequence
		for (const channelId of channelsToProcess) {
			processedChannels++;
			console.log(
				`\n--- Processing Channel ${processedChannels}/${channelsToProcess.length} ---`,
			);

			const result = await processChannel(channelId, {
				videosPerChannel: youtubeChannelId
					? Infinity
					: Number(videosPerChannel),
				maxVideos: youtubeChannelId ? Infinity : Number(maxVideos),
				forceUpdate,
			});

			if (result.status === "error") {
				results.channels.failed++;
			} else if (result.status === "cached") {
				results.channels.cached++;
			} else if (result.status === "success") {
				results.channels.updated++;

				// Count video results
				for (const videoResult of result.videos) {
					if (videoResult.status === "error") {
						results.videos.failed++;
					} else if (videoResult.status === "cached") {
						results.videos.cached++;
					} else if (videoResult.status === "updated") {
						results.videos.updated++;
					}
				}
			}

			// Log progress
			console.log(
				`\nChannel Progress: ${processedChannels}/${channelsToProcess.length}`,
			);
			console.log("Current totals:", {
				channels: results.channels,
				videos: results.videos,
			});
		}

		console.log("\n=== Video Update Process Completed ===");
		console.log("Final Results:", {
			channels: {
				total: channelsToProcess.length,
				...results.channels,
			},
			videos: {
				total:
					results.videos.updated +
					results.videos.cached +
					results.videos.failed,
				...results.videos,
			},
		});

		return results;
	} catch (err) {
		console.error("\nDetailed error in video update process:", err);
		throw new Error("Video update process failed. Check logs for details.");
	}
}

// Get videos with filters and search
export async function getFilteredVideos({
	tag,
	searchQuery,
	limit = 30,
	offset = 0,
}: {
	tag?: string;
	searchQuery?: string;
	limit?: number;
	offset?: number;
}) {
	const baseQuery = db
		.select({
			video: {
				id: videos.id,
				title: videos.title,
				description: videos.description,
				thumbnailUrl: videos.thumbnailUrl,
				publishedAt: videos.publishedAt,
				viewCount: videos.viewCount,
				likeCount: videos.likeCount,
				commentCount: videos.commentCount,
				duration: videos.duration,
				youtubeVideoId: videos.youtubeVideoId,
				createdAt: videos.createdAt,
				updatedAt: videos.updatedAt,
				tags: videos.tags,
				channelId: videos.channelId,
			},
			channel: {
				id: channels.id,
				title: channels.title,
				thumbnailUrl: channels.thumbnailUrl,
			},
		})
		.from(videos)
		.innerJoin(channels, eq(videos.channelId, channels.id))
		.$dynamic();

	// Build conditions array
	const conditions = [];

	// Add tag filter if provided
	if (tag) {
		conditions.push(sql`${videos.tags} @> ARRAY[${tag}]::text[]`);
	}

	// Add search filter if provided
	if (searchQuery) {
		conditions.push(sql`
			(
				to_tsvector('english', coalesce(${videos.title}, '') || ' ' || 
				left(coalesce(${videos.description}, ''), 500))
			) @@ websearch_to_tsquery('english', ${searchQuery})
		`);
	}

	// Apply conditions if any exist
	let query = baseQuery;
	if (conditions.length > 0) {
		query = query.where(sql.join(conditions, sql` AND `));
	}

	// Calculate a score based on views, recency, and search relevance
	const viewScore = sql`log(CAST(NULLIF(${videos.viewCount}, '0') AS INTEGER) + 1)`;
	// Recency score with gentler time decay - use 0.95 base for slower decay
	const recencyScore = sql`pow(0.95, extract(days from now() - ${videos.publishedAt}))`;
	const searchScore = searchQuery
		? sql`ts_rank(
				(
					to_tsvector('english', coalesce(${videos.title}, '') || ' ' || 
					left(coalesce(${videos.description}, ''), 500))
				),
				websearch_to_tsquery('english', ${searchQuery})
			)`
		: sql`1.0`;

	// Combine scores with weights - adjust to give more weight to views (0.25) while keeping recency primary (0.6)
	const finalScore = sql`
		(${viewScore} * 0.25) + 
		(${recencyScore} * 0.6) + 
		(${searchScore} * 0.15)
	`;

	return query.orderBy(desc(finalScore)).limit(limit).offset(offset);
}

// Get top video tags
export async function getTopVideoTags(limit = 10) {
	return db
		.select({
			tag: sql<string>`lower(unnest(${videos.tags}))`,
			count: sql<number>`count(1)`,
		})
		.from(videos)
		.groupBy(sql`1`)
		.orderBy(sql`2 desc`)
		.limit(limit);
}

/**
 * Import an individual video by its YouTube video ID or URL
 * Creates or updates the associated channel with import type "selected_videos"
 */
export async function importIndividualVideo(
	videoInput: string,
	options: {
		forceUpdate?: boolean;
	} = {},
): Promise<{
	status: "success" | "error" | "not_found" | "invalid_input";
	video?: Video;
	channel?: Channel;
	error?: unknown;
	message?: string;
}> {
	try {
		const { forceUpdate = false } = options;

		// Extract the YouTube video ID
		const youtubeVideoId = extractYouTubeVideoId(videoInput);

		if (!youtubeVideoId) {
			return {
				status: "invalid_input",
				message: "Could not extract a valid YouTube video ID from the input",
			};
		}

		// Check if video already exists
		const existingVideo = await db
			.select()
			.from(videos)
			.where(eq(videos.youtubeVideoId, youtubeVideoId))
			.limit(1);

		if (
			existingVideo.length &&
			!forceUpdate &&
			existingVideo[0].updatedAt &&
			Date.now() - existingVideo[0].updatedAt.getTime() < 24 * 60 * 60 * 1000
		) {
			// Video exists and is recent, get channel info
			const channel = await db
				.select()
				.from(channels)
				.where(eq(channels.id, existingVideo[0].channelId))
				.limit(1);

			return {
				status: "success",
				video: existingVideo[0],
				channel: channel[0],
				message: "Using existing video record",
			};
		}

		// Fetch video info from YouTube
		const videoInfo = await getVideoInfo(youtubeVideoId);
		if (!videoInfo?.items?.[0]) {
			return {
				status: "not_found",
				message: "Video not found on YouTube",
			};
		}

		const videoData = videoInfo.items[0];
		const youtubeChannelId = videoData.snippet.channelId;

		// Check if the channel exists
		let channelRecord = await db
			.select()
			.from(channels)
			.where(eq(channels.youtubeChannelId, youtubeChannelId))
			.limit(1);

		let channelId: string;

		if (!channelRecord.length) {
			// Channel doesn't exist, create a minimal record
			console.log(
				`Creating new channel record for YouTube channel ID: ${youtubeChannelId}`,
			);

			// Get basic channel info
			const channelInfo = await getChannelInfo(youtubeChannelId);
			if (!channelInfo?.items[0]) {
				return {
					status: "error",
					message: "Failed to fetch channel information for the video",
					error: "Channel not found",
				};
			}

			const channelData = channelInfo.items[0];

			// Insert new channel with import type "selected_videos"
			const [insertedChannel] = await db
				.insert(channels)
				.values({
					youtubeChannelId: channelData.id,
					title: channelData.snippet.title,
					description: channelData.snippet.description,
					customUrl: channelData.snippet.customUrl,
					thumbnailUrl:
						channelData.snippet.thumbnails.high?.url ||
						channelData.snippet.thumbnails.medium?.url ||
						channelData.snippet.thumbnails.default?.url,
					subscriberCount: channelData.statistics.subscriberCount,
					videoCount: channelData.statistics.videoCount,
					viewCount: channelData.statistics.viewCount,
					country: channelData.snippet.country,
					importType: "selected_videos", // Set import type
				})
				.returning();

			channelId = insertedChannel.id;
			channelRecord = [insertedChannel];
		} else {
			channelId = channelRecord[0].id;

			// If channel exists but is not marked for selected videos, update it
			if (channelRecord[0].importType === "full_channel") {
				await db
					.update(channels)
					.set({ importType: "selected_videos" })
					.where(eq(channels.id, channelId));

				// Refresh channel record
				channelRecord = await db
					.select()
					.from(channels)
					.where(eq(channels.id, channelId))
					.limit(1);
			}
		}

		// Now insert or update the video
		const [insertedVideo] = await db
			.insert(videos)
			.values({
				youtubeVideoId: videoData.id,
				channelId,
				title: videoData.snippet.title,
				description: videoData.snippet.description,
				channelTitle: videoData.snippet.channelTitle,
				thumbnailUrl:
					videoData.snippet.thumbnails.maxres?.url ||
					videoData.snippet.thumbnails.high?.url,
				publishedAt: new Date(videoData.snippet.publishedAt),
				viewCount: String(videoData.statistics.viewCount),
				likeCount: String(videoData.statistics.likeCount),
				commentCount: String(videoData.statistics.commentCount),
				tags: videoData.snippet.tags || [],
			})
			.onConflictDoUpdate({
				target: videos.youtubeVideoId,
				set: {
					title: sql`EXCLUDED.title`,
					description: sql`EXCLUDED.description`,
					thumbnailUrl: sql`EXCLUDED.thumbnail_url`,
					viewCount: sql`EXCLUDED.view_count`,
					likeCount: sql`EXCLUDED.like_count`,
					commentCount: sql`EXCLUDED.comment_count`,
					tags: sql`EXCLUDED.tags`,
					updatedAt: sql`CURRENT_TIMESTAMP`,
				},
			})
			.returning();

		return {
			status: "success",
			video: insertedVideo,
			channel: channelRecord[0],
			message: existingVideo.length ? "Video updated" : "Video imported",
		};
	} catch (error: unknown) {
		console.error("Error importing individual video:", error);
		return {
			status: "error",
			error,
			message:
				error instanceof Error ? error.message : "An unknown error occurred",
		};
	}
}
