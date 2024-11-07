import { VideoPlayer } from "@/components/videos/video-player";
import { getVideoInfo } from "@/lib/youtube";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { parseAsString } from "nuqs/server";
import { Metadata } from "next";

interface VideoModalProps {
	params: {
		video: string;
	};
	searchParams: { [key: string]: string | string[] | undefined };
}

// Generate dynamic metadata for SEO
export async function generateMetadata({
	params,
}: VideoModalProps): Promise<Metadata> {
	const videoId = await parseAsString
		.withDefault("")
		.parseServerSide(params.video);
	if (!videoId) {
		return {
			title: "Video Not Found",
		};
	}

	const videoData = await getVideoInfo(videoId);
	if (!videoData?.items.length) {
		return {
			title: "Video Not Found",
		};
	}

	const video = videoData.items[0];

	return {
		title: `${video.snippet.title} | The Run Club`,
		description: video.snippet.description,
		openGraph: {
			title: video.snippet.title,
			description: video.snippet.description,
			type: "video.other",
			videos: [
				{
					url: `https://youtube.com/watch?v=${videoId}`,
				},
			],
		},
	};
}

export default async function VideoModal({
	params,
	searchParams,
}: VideoModalProps) {
	if (!params.video) return null;

	try {
		// Parse and validate videoId parameter
		const videoId = await parseAsString
			.withDefault("")
			.parseServerSide(params.video);
		if (!videoId) return null;

		// Fetch video data
		const videoData = await getVideoInfo(videoId);
		if (!videoData?.items.length) return null;

		const video = videoData.items[0];

		return (
			<Dialog open>
				<DialogContent className="max-w-4xl h-[90vh] p-0">
					<div className="relative h-full overflow-auto">
						<Link href="/videos" className="absolute right-4 top-4 z-10">
							<Button variant="ghost" size="icon">
								<X className="h-4 w-4" />
							</Button>
						</Link>
						<VideoPlayer videoId={videoId} title={video.snippet.title} />
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
	} catch (error) {
		console.error("Error loading video:", error);
		return null;
	}
}
