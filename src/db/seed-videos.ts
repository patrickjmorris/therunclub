import { db } from "./client";
import { channels, videos } from "./schema";
import {
  CHANNELS,
  getChannelInfo,
  getAllPlaylistItems,
  getVideoInfo,
} from "@/lib/youtube";
import { sql } from "drizzle-orm";

// Only run seeding if script is called directly
const isDirectRun = require.main === module;

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

export async function seedVideos(
  options: {
    limit?: number;
    videosPerChannel?: number;
    youtubeChannelId?: string;
    forceUpdate?: boolean;
  } = { limit: 50, videosPerChannel: 10 },
) {
  console.log("Starting video database seeding process...");

  try {
    const isConnected = await checkConnection();
    if (!isConnected) {
      throw new Error("Failed to connect to database");
    }

    const results = {
      channels: { updated: 0, failed: 0 },
      videos: { updated: 0, failed: 0 },
    };

    // Use single channel or process multiple channels
    const channelsToProcess = options.youtubeChannelId
      ? [options.youtubeChannelId]
      : CHANNELS.slice(0, options.limit);

    // If specific channel provided, override videosPerChannel limit
    if (options.youtubeChannelId) {
      options.videosPerChannel = Infinity; // Load all videos
    }

    console.log(`Processing ${channelsToProcess.length} channels...`);

    // Process channels in sequence to respect rate limits
    for (const channelId of channelsToProcess) {
      console.log(`Processing channel: ${channelId}`);

      try {
        // Check if channel exists in database first
        const existingChannel = await db
          .select()
          .from(channels)
          .where(sql`youtube_channel_id = ${channelId}`)
          .limit(1);

        // biome-ignore lint/suspicious/noExplicitAny: fix me
        let channelInfo: any;
        if (!existingChannel.length || options.forceUpdate) {
          // Always fetch if forced or channel doesn't exist
          channelInfo = await getChannelInfo(channelId);
          if (!channelInfo?.items[0]) {
            console.log(`No channel info found for ${channelId}`);
            results.channels.failed++;
            continue;
          }
        } else {
          // Check cache only if not forced
          const lastUpdate = existingChannel[0].updatedAt;
          if (
            !options.forceUpdate &&
            lastUpdate &&
            Date.now() - lastUpdate.getTime() < 24 * 60 * 60 * 1000
          ) {
            console.log(`Using cached channel data for ${channelId}`);
            continue;
          }
          channelInfo = await getChannelInfo(channelId);
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

        // Process only the specified number of videos per channel
        const videosToProcess = playlistItems.slice(
          0,
          options.videosPerChannel,
        );
        console.log(
          `Processing ${videosToProcess.length} videos for channel ${channelId}`,
        );

        // Add delay between video processing to respect rate limits
        for (const item of videosToProcess) {
          try {
            // Check if video exists in database first
            const existingVideo = await db
              .select()
              .from(videos)
              .where(sql`youtube_video_id = ${item.snippet.resourceId.videoId}`)
              .limit(1);

            if (existingVideo.length && !options.forceUpdate) {
              // Skip if video exists and not forced
              const lastUpdate = existingVideo[0].updatedAt;
              if (
                !options.forceUpdate &&
                lastUpdate &&
                Date.now() - lastUpdate.getTime() < 24 * 60 * 60 * 1000
              ) {
                console.log(
                  `Using cached video data for ${item.snippet.resourceId.videoId}`,
                );
                continue;
              }
            }

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

            // Add small delay between video requests
            await new Promise((resolve) => setTimeout(resolve, 100));
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

      // Add delay between channel processing
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("Video database update completed", results);
    return results;
  } catch (error) {
    console.error("Fatal error during video update process:", error);
    throw error;
  }
}

// Only run if script is called directly
if (isDirectRun) {
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
}
