import { db } from "./index";
import { channels, videos } from "./schema";
import {
	CHANNELS,
	getChannelInfo,
	getAllPlaylistItems,
	getVideoInfo,
} from "@/lib/youtube";
import { sql } from "drizzle-orm";

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

export async function seedVideos() {
	console.log("Starting video database seeding process...");

	try {
		const isConnected = await checkConnection();
		if (!isConnected) {
			throw new Error("Failed to connect to database");
		}

		const results = {
			channels: {
				updated: 0,
				failed: 0,
			},
			videos: {
				updated: 0,
				failed: 0,
			},
		};

		// Process each channel
		for (const channelId of CHANNELS) {
			console.log(`Processing channel: ${channelId}`);

			try {
				const channelInfo = await getChannelInfo(channelId);
				if (!channelInfo?.items[0]) {
					console.log(`No channel info found for ${channelId}`);
					results.channels.failed++;
					continue;
				}

				const channelData = channelInfo.items[0];
				const thumbnail = channelData.snippet.thumbnails;
				const imageUrl =
					thumbnail.high?.url ??
					thumbnail.medium?.url ??
					thumbnail.default?.url;

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
						viewCount: channelData.statistics.viewCount,
						subscriberCount: channelData.statistics.subscriberCount,
						videoCount: channelData.statistics.videoCount,
						uploadsPlaylistId:
							channelData.contentDetails.relatedPlaylists.uploads,
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

				results.channels.updated++;
				console.log(`Updated channel: ${insertedChannel.title}`);

				// Get channel's videos
				const playlistId = channelData.contentDetails.relatedPlaylists.uploads;
				const playlistItems = await getAllPlaylistItems(playlistId);

				if (!playlistItems) {
					console.log(`No videos found for channel ${channelId}`);
					continue;
				}

				// Process each video
				for (const item of playlistItems.slice(0, 10)) {
					try {
						const videoInfo = await getVideoInfo(
							item.snippet.resourceId.videoId,
						);
						if (!videoInfo?.items[0]) {
							results.videos.failed++;
							continue;
						}

						const videoData = videoInfo.items[0];

						await db
							.insert(videos)
							.values({
								youtubeVideoId: videoData.id,
								channelId: insertedChannel.id,
								title: videoData.snippet.title,
								description: videoData.snippet.description,
								channelTitle: videoData.snippet.channelTitle,
								thumbnailUrl:
									videoData.snippet.thumbnails.maxres?.url ||
									videoData.snippet.thumbnails.high?.url,
								publishedAt: new Date(videoData.snippet.publishedAt),
								viewCount: videoData.statistics.viewCount,
								likeCount: videoData.statistics.likeCount,
								commentCount: videoData.statistics.commentCount,
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

						results.videos.updated++;
						console.log(`Updated video: ${videoData.snippet.title}`);
					} catch (videoError) {
						console.error(
							`Error processing video: ${item.snippet.resourceId.videoId}`,
							videoError,
						);
						results.videos.failed++;
					}
				}
			} catch (channelError) {
				console.error(`Error processing channel: ${channelId}`, channelError);
				results.channels.failed++;
			}
		}

		console.log("Video database update completed", results);
		return results;
	} catch (error) {
		console.error("Fatal error during video update process:", error);
		throw error;
	}
}

// Add timeout to the entire process
const SEED_TIMEOUT = 300000; // 5 minutes timeout

Promise.race([
	seedVideos(),
	new Promise((_, reject) =>
		setTimeout(
			() => reject(new Error("Video seeding timed out")),
			SEED_TIMEOUT,
		),
	),
])
	.then(() => {
		console.log("Video seeding completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		console.error("Error seeding video database:", error);
		process.exit(1);
	});
