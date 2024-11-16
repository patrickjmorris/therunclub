import { Metadata } from "next";
import { VideoPlayer } from "@/components/videos/video-player";
import { getVideoById } from "@/lib/services/video-service";
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

export async function generateMetadata({
	params,
}: VideoPageProps): Promise<Metadata> {
	const { video } = await params;
	const videoData = await getVideoById(video);

	if (!videoData) {
		return {
			title: "Video Not Found",
		};
	}

	return {
		title: `${videoData.title} | The Run Club`,
		description: videoData.description ?? undefined,
		keywords: videoData.tags,
		openGraph: {
			title: videoData.title,
			description: videoData.description ?? undefined,
			type: "video.other",
			videos: [
				{
					url: `https://youtube.com/watch?v=${videoData.youtubeVideoId}`,
				},
			],
		},
	};
}

export default async function VideoPage({ params }: VideoPageProps) {
	const { video } = await params;

	try {
		const videoData = await getVideoById(video);
		if (!videoData) {
			notFound();
		}

		// Format numbers for better readability
		const views = new Intl.NumberFormat().format(
			Number(videoData.viewCount ?? 0),
		);
		const likes = new Intl.NumberFormat().format(
			Number(videoData.likeCount ?? 0),
		);
		const comments = new Intl.NumberFormat().format(
			Number(videoData.commentCount ?? 0),
		);

		return (
			<div className="container py-8">
				<VideoPlayer
					videoId={videoData.youtubeVideoId}
					title={videoData.title}
				/>
				<div className="mt-4">
					<h1 className="text-2xl font-bold">{videoData.title}</h1>

					{/* Channel and date info */}
					<div className="mt-2 flex items-center gap-2 text-muted-foreground">
						<Link
							href={`/videos/channels/${videoData.channelId}`}
							className="hover:text-foreground transition-colors"
						>
							{videoData.channelTitle}
						</Link>
						<span>•</span>
						<span
							title={
								videoData.publishedAt
									? format(videoData.publishedAt, "PPP")
									: undefined
							}
						>
							{videoData.publishedAt &&
								formatDistanceToNow(videoData.publishedAt, {
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
					{videoData.tags && videoData.tags.length > 0 && (
						<div className="mt-4 flex flex-wrap gap-2">
							<Tag className="h-4 w-4 text-muted-foreground" />
							{videoData.tags.map((tag) => (
								<Badge key={tag} variant="secondary">
									{tag}
								</Badge>
							))}
						</div>
					)}

					{/* Description */}
					<div className="mt-6 prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap break-words">
						{videoData.description?.split("\n").map((line, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: needed for react
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
