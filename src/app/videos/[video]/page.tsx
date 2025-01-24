import { Metadata } from "next";
import { VideoPlayer } from "@/components/videos/video-player";
import { getVideoById } from "@/lib/services/video-service";
import { notFound } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { Eye, ThumbsUp, MessageCircle, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { extractUrlsFromText } from "@/lib/extract-urls";
import { LinkPreviewList } from "@/components/LinkPreview";
import type { OpenGraphData } from "@/lib/og";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { db } from "@/db/client";
import { videos } from "@/db/schema";
import { isNotNull } from "drizzle-orm";

interface VideoPageProps {
	params: Promise<{
		video: string;
	}>;
}

export async function generateStaticParams() {
	const allVideos = await db
		.select({ id: videos.id })
		.from(videos)
		.where(isNotNull(videos.id));

	return allVideos.map((video) => ({
		video: video.id,
	}));
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

function convertUrlsToLinks(text: string): string {
	// Escape HTML special characters first
	const escaped = text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");

	const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
	return escaped.replace(
		urlRegex,
		'<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline decoration-blue-600/30 dark:decoration-blue-400/30 hover:decoration-blue-600 dark:hover:decoration-blue-400 transition-colors">$1</a>',
	);
}

export const dynamic = "force-static";
export const revalidate = 3600; // Revalidate every hour

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

		// Extract URLs and convert them to links in the description
		const urls = videoData.description
			? extractUrlsFromText(videoData.description).slice(0, 10)
			: [];
		const descriptionWithLinks = videoData.description
			? convertUrlsToLinks(videoData.description)
			: "";

		// Prefetch OpenGraph data for all links using the cached API endpoint
		const preloadedOgData: Record<string, OpenGraphData> = {};
		if (urls.length > 0) {
			await Promise.all(
				urls.map(async (url) => {
					try {
						const response = await fetch(
							`${
								process.env.NEXT_PUBLIC_APP_URL || ""
							}/api/og?url=${encodeURIComponent(url)}`,
							{ next: { revalidate: 86400 } }, // Cache for 24 hours
						);
						if (response.ok) {
							const data = await response.json();
							if (data && !data.error) {
								preloadedOgData[url] = data;
							}
						}
					} catch (error) {
						console.error(
							`Error prefetching OpenGraph data for ${url}:`,
							error,
						);
					}
				}),
			);
		}

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

					{/* Content */}
					<div className="mt-6 max-w-3xl">
						{urls.length > 0 ? (
							<Tabs defaultValue="description">
								<TabsList className="justify-start">
									<TabsTrigger value="description">Description</TabsTrigger>
									<TabsTrigger value="links">Links ({urls.length})</TabsTrigger>
								</TabsList>
								<TabsContent value="description">
									<div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap break-words [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:decoration-blue-600/30 dark:[&_a]:decoration-blue-400/30 [&_a:hover]:decoration-blue-600 dark:[&_a:hover]:decoration-blue-400 [&_a]:transition-colors">
										<div
											// biome-ignore lint/security/noDangerouslySetInnerHtml: Content is escaped and URLs are safely converted to links
											dangerouslySetInnerHTML={{
												__html: descriptionWithLinks,
											}}
										/>
									</div>
								</TabsContent>
								<TabsContent value="links">
									<div className="space-y-4">
										<LinkPreviewList
											urls={urls}
											preloadedData={preloadedOgData}
										/>
									</div>
								</TabsContent>
							</Tabs>
						) : (
							<div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap break-words [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:decoration-blue-600/30 dark:[&_a]:decoration-blue-400/30 [&_a:hover]:decoration-blue-600 dark:[&_a:hover]:decoration-blue-400 [&_a]:transition-colors">
								<div
									// biome-ignore lint/security/noDangerouslySetInnerHtml: Content is escaped and URLs are safely converted to links
									dangerouslySetInnerHTML={{
										__html: descriptionWithLinks,
									}}
								/>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	} catch (error) {
		console.error("Error loading video:", error);
		notFound();
	}
}
