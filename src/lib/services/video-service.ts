import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getVideoById(videoId: string) {
	return db
		.select()
		.from(videos)
		.where(eq(videos.youtubeVideoId, videoId))
		.limit(1);
}

export async function saveVideo(videoData: {
	youtubeVideoId: string;
	title: string;
	channelTitle: string;
	category?: string;
	publishedAt?: Date;
}) {
	return db.insert(videos).values(videoData).onConflictDoNothing();
}
