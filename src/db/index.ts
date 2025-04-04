import { db } from "./client";
import { channels, videos } from "./schema";
import { eq, sql } from "drizzle-orm";
import { updatePodcastColors } from "@/lib/server/update-podcast-colors";
import { config } from "dotenv";
import { safeDateParse } from "@/lib/date-utils";
import {
	fetchChannelData,
	fetchInitialVideos,
	fetchChannelVideos,
	type FetchVideosOptions,
} from "@/lib/youtube-service";

config({ path: ".env" });

// Add a function to update channel videos
export async function updateChannelVideos(
	channelId: string,
	uploadsPlaylistId: string,
	options: FetchVideosOptions = {},
) {
	try {
		const videoItems = await fetchChannelVideos(
			channelId,
			uploadsPlaylistId,
			options,
		);

		if (videoItems.length === 0) {
			return {
				success: true,
				videosAdded: 0,
				message: "No new videos found",
			};
		}

		const videoValues = videoItems.map((video) => ({
			youtubeVideoId: video.id,
			channelId,
			title: video.snippet.title,
			description: video.snippet.description,
			channelTitle: video.snippet.channelTitle,
			thumbnailUrl:
				video.snippet.thumbnails.high?.url ||
				video.snippet.thumbnails.medium?.url ||
				video.snippet.thumbnails.default?.url ||
				"",
			publishedAt: safeDateParse(video.snippet.publishedAt),
			viewCount: video.statistics.viewCount,
			likeCount: video.statistics.likeCount,
			commentCount: video.statistics.commentCount,
			tags: video.snippet.tags || [],
			duration: video.contentDetails.duration,
		}));

		await db
			.insert(videos)
			.values(videoValues)
			.onConflictDoUpdate({
				target: [videos.youtubeVideoId],
				set: {
					title: sql`EXCLUDED.title`,
					description: sql`EXCLUDED.description`,
					thumbnailUrl: sql`EXCLUDED.thumbnail_url`,
					viewCount: sql`EXCLUDED.view_count`,
					likeCount: sql`EXCLUDED.like_count`,
					commentCount: sql`EXCLUDED.comment_count`,
					tags: sql`EXCLUDED.tags`,
					duration: sql`EXCLUDED.duration`,
				},
			});

		return {
			success: true,
			videosAdded: videoItems.length,
			message: `Successfully processed ${videoItems.length} videos`,
		};
	} catch (error) {
		console.error("Error updating channel videos:", error);
		return {
			success: false,
			videosAdded: 0,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}

export async function addNewChannel(channelId: string) {
	try {
		// First check if channel already exists
		const [existingChannel] = await db
			.select()
			.from(channels)
			.where(eq(channels.youtubeChannelId, channelId))
			.limit(1);

		if (existingChannel) {
			return {
				success: false,
				error: "Channel already exists",
				channel: existingChannel,
			};
		}

		// Fetch channel data from YouTube API
		const channelData = await fetchChannelData(channelId);
		const thumbnailUrl =
			channelData.snippet.thumbnails.high?.url ||
			channelData.snippet.thumbnails.medium?.url ||
			channelData.snippet.thumbnails.default?.url ||
			"";

		// Insert the new channel
		const [insertedChannel] = await db
			.insert(channels)
			.values({
				youtubeChannelId: channelId,
				title: channelData.snippet.title,
				description: channelData.snippet.description,
				customUrl: channelData.snippet.customUrl,
				publishedAt: safeDateParse(channelData.snippet.publishedAt),
				thumbnailUrl: thumbnailUrl,
				country: channelData.snippet.country || null,
				viewCount: channelData.statistics.viewCount,
				subscriberCount: channelData.statistics.subscriberCount,
				videoCount: channelData.statistics.videoCount,
				uploadsPlaylistId: channelData.contentDetails.relatedPlaylists.uploads,
			})
			.returning();

		if (!insertedChannel) {
			return {
				success: false,
				error: "Failed to insert channel",
			};
		}

		// Extract vibrant color from thumbnail
		if (thumbnailUrl) {
			try {
				await updatePodcastColors(insertedChannel.id, thumbnailUrl);
			} catch (colorError) {
				console.error("Failed to extract vibrant color:", colorError);
				// Continue even if color extraction fails
			}
		}

		// Fetch initial videos
		const videoItems = await fetchInitialVideos(
			channelId,
			channelData.contentDetails.relatedPlaylists.uploads,
		);

		// Insert videos if we got any
		if (videoItems.length > 0) {
			const videoValues = videoItems.map((video) => ({
				youtubeVideoId: video.id,
				channelId: insertedChannel.id,
				title: video.snippet.title,
				description: video.snippet.description,
				channelTitle: video.snippet.channelTitle,
				thumbnailUrl:
					video.snippet.thumbnails.high?.url ||
					video.snippet.thumbnails.medium?.url ||
					video.snippet.thumbnails.default?.url ||
					"",
				publishedAt: safeDateParse(video.snippet.publishedAt),
				viewCount: video.statistics.viewCount,
				likeCount: video.statistics.likeCount,
				commentCount: video.statistics.commentCount,
				tags: video.snippet.tags || [],
				duration: video.contentDetails.duration,
			}));

			try {
				await db
					.insert(videos)
					.values(videoValues)
					.onConflictDoUpdate({
						target: [videos.youtubeVideoId],
						set: {
							title: sql`EXCLUDED.title`,
							description: sql`EXCLUDED.description`,
							thumbnailUrl: sql`EXCLUDED.thumbnail_url`,
							viewCount: sql`EXCLUDED.view_count`,
							likeCount: sql`EXCLUDED.like_count`,
							commentCount: sql`EXCLUDED.comment_count`,
							tags: sql`EXCLUDED.tags`,
							duration: sql`EXCLUDED.duration`,
						},
					});
			} catch (videoError) {
				console.error("Error inserting videos:", videoError);
				// Continue even if video insertion fails
			}
		}

		return {
			success: true,
			channel: insertedChannel,
			videosAdded: videoItems.length,
		};
	} catch (error) {
		console.error("Error adding new channel:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}
