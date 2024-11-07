"use client";

import { VideoCard } from "./video-card";
import { useShare } from "./use-share";

interface Video {
	id: string;
	title: string;
	channelTitle: string;
	thumbnailUrl: string;
	publishedAt: string;
}

interface VideoGridProps {
	videos: Video[];
}

export function VideoGrid({ videos }: VideoGridProps) {
	const handleShare = useShare();

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{videos.map((video) => (
				<VideoCard key={video.id} {...video} onShare={handleShare} />
			))}
		</div>
	);
}
