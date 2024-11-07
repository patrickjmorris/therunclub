import { Metadata } from "next";
import { VideoPlayer } from "@/components/videos/video-player";
import { getVideoInfo } from "@/lib/youtube";
import { notFound } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { Eye, ThumbsUp, MessageCircle, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface VideoPageProps {
	params: Promise<{
		video: string;
	}>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({
	params,
}: VideoPageProps): Promise<Metadata> {
	const { video } = await params;
	const videoId = decodeURIComponent(video);
	const videoData = await getVideoInfo(videoId);

	if (!videoData?.items.length) {
		return {
			title: "Video Not Found",
		};
	}

	const videoDetails = videoData.items[0];

	return {
		title: `${videoDetails.snippet.title} | The Run Club`,
		description: videoDetails.snippet.description,
		keywords: videoDetails.snippet.tags,
		openGraph: {
			title: videoDetails.snippet.title,
			description: videoDetails.snippet.description,
			type: "video.other",
			videos: [
				{
					url: `https://youtube.com/watch?v=${videoId}`,
				},
			],
		},
	};
}

export default async function VideoPage({ params }: VideoPageProps) {
	const { video } = await params;

	try {
		const videoId = decodeURIComponent(video);
		const videoData = await getVideoInfo(videoId);

		if (!videoData?.items?.length) {
			notFound();
		}

		const videoDetails = videoData.items[0];
		const { snippet, statistics } = videoDetails;

		// Format numbers for better readability
		const views = new Intl.NumberFormat().format(Number(statistics.viewCount));
		const likes = new Intl.NumberFormat().format(Number(statistics.likeCount));
		const comments = new Intl.NumberFormat().format(
			Number(statistics.commentCount),
		);

		return (
			<div className="container py-8">
				<VideoPlayer videoId={videoId} title={snippet.title} />
				<div className="mt-4">
					<h1 className="text-2xl font-bold">{snippet.title}</h1>

					{/* Channel and date info */}
					<div className="mt-2 flex items-center gap-2 text-muted-foreground">
						<Link
							href={`/videos/channels/${snippet.channelId}`}
							className="hover:text-foreground transition-colors"
						>
							{snippet.channelTitle}
						</Link>
						<span>•</span>
						<span title={format(new Date(snippet.publishedAt), "PPP")}>
							{formatDistanceToNow(new Date(snippet.publishedAt), {
								addSuffix: true,
							})}
						</span>
					</div>

					{/* Statistics */}
					<div className="mt-4 flex gap-4 text-sm text-muted-foreground">
						<div className="flex items-center gap-1">
							<Eye className="h-4 w-4" />
							<span>{views} views</span>
						</div>
						<div className="flex items-center gap-1">
							<ThumbsUp className="h-4 w-4" />
							<span>{likes} likes</span>
						</div>
						<div className="flex items-center gap-1">
							<MessageCircle className="h-4 w-4" />
							<span>{comments} comments</span>
						</div>
					</div>

					{/* Tags */}
					{snippet.tags && snippet.tags.length > 0 && (
						<div className="mt-4 flex flex-wrap gap-2">
							<Tag className="h-4 w-4 text-muted-foreground" />
							{snippet.tags.map((tag) => (
								<Badge key={tag} variant="secondary">
									{tag}
								</Badge>
							))}
						</div>
					)}

					{/* Description */}
					<div className="mt-6 prose prose-sm max-w-none dark:prose-invert">
						{snippet.description.split("\n").map((line, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: Iterating over lines
							<p key={i}>{line}</p>
						))}
					</div>
				</div>
			</div>
		);
	} catch (error) {
		console.error("Error loading video:", error);
		notFound();
	}
}
