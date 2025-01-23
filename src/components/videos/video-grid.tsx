"use client";

import { VideoCard } from "./video-card";
import { useShare } from "./use-share";
import type { BasicVideo } from "@/types/shared";

interface VideoGridProps {
	videos: BasicVideo[];
}

export function VideoGrid({ videos }: VideoGridProps) {
	const handleShare = useShare();

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{videos.map((video) => (
				<VideoCard key={video.id} video={video} onShare={handleShare} />
			))}
		</div>
	);
}
