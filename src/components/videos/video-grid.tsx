"use client";

import { VideoCard } from "./video-card";
import { useShare } from "./use-share";
import { Video } from "@/db/schema";

interface VideoGridProps {
	videos: Video[];
	onShare?: (id: string) => Promise<void>;
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
