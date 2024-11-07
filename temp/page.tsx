/Users/patrickmorris/Sites/therunclub/src/app/videos/(.)videos/[videoId]/page.tsx

import { VideoPlayer } from "@/components/videos/video-player";
import { getVideoInfo } from "@/lib/youtube";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface VideoModalProps {
	params: {
		videoId: string[];
	};
}

export default async function VideoModal({ params }: VideoModalProps) {
	// Extract video ID from params
	const videoId = params.videoId?.[0];
	if (!videoId) return null;

	// Decode and fetch video data
	const decodedVideoId = decodeURIComponent(videoId);
	const videoData = await getVideoInfo(decodedVideoId);
	if (!videoData?.items.length) return null;

	const video = videoData.items[0];

	return (
		<Dialog open>
			<DialogContent className="max-w-4xl h-[90vh] p-0">
				<div className="relative h-full overflow-auto">
					{/* Close button */}
					<Link href="/videos" className="absolute right-4 top-4 z-10">
						<Button variant="ghost" size="icon">
							<X className="h-4 w-4" />
						</Button>
					</Link>

					{/* Video player */}
					<VideoPlayer videoId={decodedVideoId} />

					{/* Video info */}
					<div className="p-4">
						<h1 className="text-xl font-bold">{video.snippet.title}</h1>
						<div className="mt-2 flex items-center gap-2 text-muted-foreground">
							<span>{video.snippet.channelTitle}</span>
							<span>•</span>
							<span>
								{formatDistanceToNow(new Date(video.snippet.publishedAt), {
									addSuffix: true,
								})}
							</span>
						</div>
						<p className="mt-4 whitespace-pre-wrap line-clamp-3">
							{video.snippet.description}
						</p>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
