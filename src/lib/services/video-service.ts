import { db } from "@/db/client";
import { videos, channels, type Video, type Channel } from "@/db/schema";
import { desc, eq, ilike, sql } from "drizzle-orm";
import {
	CHANNELS,
	getChannelInfo,
	getAllPlaylistItems,
	getVideoInfo,
} from "@/lib/youtube";
import { unstable_cache } from "next/cache";
import { isNotNull } from "drizzle-orm";

// Get video by ID
export async function getVideoById(videoId: string) {
	const [video] = await db
		.select()
		.from(videos)
		.where(eq(videos.id, videoId))
		.limit(1);

	return video;
}

// Get latest videos with pagination
export async function getLatestVideos(limit = 30, offset = 0) {
	return db
		.select()
		.from(videos)
		.orderBy(desc(videos.publishedAt))
		.limit(limit)
		.offset(offset);
}

// Search videos
export async function searchVideos(query: string, limit = 30) {
	return db
		.select()
		.from(videos)
		.where(
			sql`to_tsvector('english', ${videos.title} || ' ' || ${videos.description}) @@ to_tsquery('english', ${query})`,
		)
		.orderBy(desc(videos.publishedAt))
		.limit(limit);
}

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

// Process a single channel efficiently
export async function processChannel(
	channelId: string,
	options: {
		videosPerChannel?: number;
		forceUpdate?: boolean;
		maxVideos?: number;
	} = {},
) {
	if (!channelId) {
		console.error("Invalid channelId provided to processChannel");
		return { status: "error" as const, error: new Error("Invalid channelId") };
	}

	const {
		videosPerChannel = 10,
		forceUpdate = false,
		maxVideos = videosPerChannel,
	} = options;

	try {
		console.log(`\nProcessing channel ${channelId}...`);
		console.log("Process channel options:", {
			videosPerChannel,
			forceUpdate,
			maxVideos,
		});

		// Check if channel exists and was recently updated
		const existingChannel = await db
			.select()
			.from(channels)
			.where(eq(channels.youtubeChannelId, channelId))
			.limit(1);

		let channelInfo: Awaited<ReturnType<typeof getChannelInfo>> | undefined;
		if (
			!existingChannel.length ||
			forceUpdate ||
			!existingChannel[0].updatedAt ||
			Date.now() - existingChannel[0].updatedAt.getTime() >= 24 * 60 * 60 * 1000
		) {
			console.log(`Fetching channel info from YouTube for ${channelId}...`);
			channelInfo = await getChannelInfo(channelId);
			if (!channelInfo?.items[0]) {
				console.log(
					`No channel info found for ${channelId} - channel may be private or deleted`,
				);
				return { status: "not_found" as const };
			}
		} else {
			const lastUpdate = new Date(
				existingChannel[0].updatedAt,
			).toLocaleString();
			console.log(
				`Using cached channel data for ${channelId} (last updated: ${lastUpdate})`,
			);
			return { status: "cached" as const, data: existingChannel[0] };
		}

		const channelData = channelInfo.items[0];
		console.log(
			`Updating channel in database: "${channelData.snippet.title}" (${channelId})`,
		);

		const thumbnail = channelData.snippet.thumbnails;
		const imageUrl =
			thumbnail.high?.url ?? thumbnail.medium?.url ?? thumbnail.default?.url;

		// Insert or update channel
		const [insertedChannel] = await db
			.insert(channels)
			.values({
				youtubeChannelId: channelId,
				title: channelData.snippet.title,
				description: channelData.snippet.description,
				customUrl: channelData.snippet.customUrl,
				publishedAt: new Date(channelData.snippet.publishedAt),
				thumbnailUrl: imageUrl,
				country: channelData.snippet.country,
				viewCount: String(channelData.statistics.viewCount),
				subscriberCount: String(channelData.statistics.subscriberCount),
				videoCount: String(channelData.statistics.videoCount),
				uploadsPlaylistId: channelData.contentDetails.relatedPlaylists.uploads,
			})
			.onConflictDoUpdate({
				target: channels.youtubeChannelId,
				set: {
					title: sql`EXCLUDED.title`,
					description: sql`EXCLUDED.description`,
					customUrl: sql`EXCLUDED.custom_url`,
					thumbnailUrl: sql`EXCLUDED.thumbnail_url`,
					country: sql`EXCLUDED.country`,
					viewCount: sql`EXCLUDED.view_count`,
					subscriberCount: sql`EXCLUDED.subscriber_count`,
					videoCount: sql`EXCLUDED.video_count`,
					uploadsPlaylistId: sql`EXCLUDED.uploads_playlist_id`,
					updatedAt: sql`CURRENT_TIMESTAMP`,
				},
			})
			.returning();

		console.log(`Successfully updated channel: ${channelData.snippet.title}`);

		// Get channel's latest videos
		console.log(`Fetching playlist items for channel ${channelId}...`);
		const playlistId = channelData.contentDetails.relatedPlaylists.uploads;
		const playlistItems = await getAllPlaylistItems(playlistId);

		if (!playlistItems) {
			console.log(`No videos found for channel ${channelId}`);
			return { status: "success" as const, data: insertedChannel, videos: [] };
		}

		// Process only the specified number of videos
		const videosToProcess = playlistItems
			? playlistItems
					.slice(0, Math.min(maxVideos || videosPerChannel, videosPerChannel))
					.filter(Boolean)
			: [];
		console.log(
			`Processing ${videosToProcess.length} videos for channel ${channelId}...`,
		);

		const videoResults = [];
		let processedCount = 0;

		for (const item of videosToProcess) {
			processedCount++;
			console.log(
				`\nProcessing video ${processedCount}/${videosToProcess.length}...`,
			);

			const result = await processVideo(
				item.snippet.resourceId.videoId,
				insertedChannel.id,
				forceUpdate,
			);
			videoResults.push(result);

			// Log progress
			const stats = {
				updated: videoResults.filter((r) => r.status === "updated").length,
				cached: videoResults.filter((r) => r.status === "cached").length,
				failed: videoResults.filter(
					(r) => r.status === "error" || r.status === "not_found",
				).length,
			};
			console.log(
				`Progress: ${processedCount}/${videosToProcess.length} videos processed`,
			);
			console.log(
				`Stats so far: ${stats.updated} updated, ${stats.cached} cached, ${stats.failed} failed`,
			);
		}

		console.log(`\nFinished processing channel ${channelId}`);
		console.log(`Total videos processed: ${videoResults.length}`);

		return {
			status: "success" as const,
			data: insertedChannel,
			videos: videoResults,
		};
	} catch (error) {
		console.error(`Error processing channel ${channelId}:`, error);
		return { status: "error" as const, error };
	}
}

// Modify getChannelsNeedingUpdate to handle query typing correctly
export async function getChannelsNeedingUpdate(
	options: {
		minHoursSinceUpdate?: number;
		limit?: number;
		randomSample?: boolean;
	} = {},
) {
	const {
		minHoursSinceUpdate = 24,
		limit = 50,
		randomSample = false,
	} = options;

	const minTimestamp = new Date(
		Date.now() - minHoursSinceUpdate * 60 * 60 * 1000,
	).toISOString();

	const baseQuery = db
		.select({
			id: channels.id,
			youtubeChannelId: channels.youtubeChannelId,
			title: channels.title,
			updatedAt: channels.updatedAt,
		})
		.from(channels)
		.where(
			sql`${channels.updatedAt} IS NULL OR ${channels.updatedAt} < ${minTimestamp}::timestamp`,
		);

	// Execute the query with appropriate ordering
	return randomSample
		? baseQuery.orderBy(sql`RANDOM()`).limit(limit)
		: baseQuery.orderBy(channels.updatedAt).limit(limit);
}

// Update the updateVideos interface to include maxVideos
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
		});

		const results = {
			channels: { updated: 0, cached: 0, failed: 0 },
			videos: { updated: 0, cached: 0, failed: 0 },
		};

		// Determine which channels to process
		let channelsToProcess: string[] = [];

		if (youtubeChannelId) {
			channelsToProcess = [youtubeChannelId];
		} else if (updateByLastUpdated) {
			const outdatedChannels = await getChannelsNeedingUpdate({
				minHoursSinceUpdate,
				limit,
				randomSample,
			});
			channelsToProcess = outdatedChannels.map((c) => c.youtubeChannelId);
			console.log(`Found ${channelsToProcess.length} channels needing update`);
		} else {
			channelsToProcess = CHANNELS.slice(0, limit);
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
	} catch (error) {
		console.error("\nDetailed error in video update process:", error);
		throw error;
	}
}
