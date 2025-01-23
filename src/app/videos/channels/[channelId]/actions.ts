"use server";

import { getChannelVideos } from "@/lib/services/video-service";
import type { BasicVideo } from "@/types/shared";

export async function fetchMore(
	channelId: string,
	page: number,
): Promise<BasicVideo[]> {
	const limit = 12;
	const offset = (page - 1) * limit;
	const videos = await getChannelVideos(channelId, limit, offset);

	return videos.map((video) => ({
		id: video.id,
		title: video.title,
		thumbnailUrl: video.thumbnailUrl,
		channelTitle: video.channelTitle,
		channelId: video.channelId,
		publishedAt: video.publishedAt,
		description: video.description,
		viewCount: video.viewCount,
		likeCount: video.likeCount,
		commentCount: video.commentCount,
		duration: video.duration,
		youtubeVideoId: video.youtubeVideoId ?? "",
		createdAt: video.createdAt,
		updatedAt: video.updatedAt,
		tags: video.tags ?? [],
	}));
}
