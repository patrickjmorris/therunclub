import { db } from "@/db/client";
import { videos, channels, type Video, type Channel } from "@/db/schema";
import { desc, eq, ilike, sql } from "drizzle-orm";

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
export async function getFeaturedChannels(limit = 4) {
	return db
		.select()
		.from(channels)
		.orderBy(desc(channels.subscriberCount))
		.limit(limit);
}

// Get channel videos
export async function getChannelVideos(channelId: string, limit = 10) {
	return db
		.select()
		.from(videos)
		.where(eq(videos.channelId, channelId))
		.orderBy(desc(videos.publishedAt))
		.limit(limit);
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
