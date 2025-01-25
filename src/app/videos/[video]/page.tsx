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
import { isNotNull, desc, eq } from "drizzle-orm";
import { Suspense } from "react";
import { performance } from "perf_hooks";

interface VideoPageProps {
	params: Promise<{
		video: string;
	}>;
}

export async function generateStaticParams() {
	// Get all unique channel IDs
	const channels = await db
		.select({ channelId: videos.channelId })
		.from(videos)
		.where(isNotNull(videos.channelId))
		.groupBy(videos.channelId);

	const params = [];

	// For each channel, get the last 25 videos
	for (const channel of channels) {
		const recentVideos = await db
			.select({ id: videos.id })
			.from(videos)
			.where(eq(videos.channelId, channel.channelId))
			.orderBy(desc(videos.publishedAt))
			.limit(25);

		params.push(
			...recentVideos.map((video) => ({
				video: video.id,
			})),
		);
	}

	return params;
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

// Create a separate component for link previews
async function LinkPreviewSection({ urls }: { urls: string[] }) {
	const startTime = performance.now();
	console.log(
		`[Build][LinkPreview] Starting OpenGraph fetch for ${urls.length} URLs`,
	);

	// Prefetch OpenGraph data for all links using the cached API endpoint
	const preloadedOgData: Record<string, OpenGraphData> = {};

	if (urls.length > 0) {
		// Process URLs in batches of 3 to avoid overwhelming the server
		const batchSize = 3;
		for (let i = 0; i < urls.length; i += batchSize) {
			const batch = urls.slice(i, i + batchSize);
			console.log(
				`[Build][LinkPreview] Processing batch ${i / batchSize + 1}/${Math.ceil(
					urls.length / batchSize,
				)}`,
			);

			const batchStartTime = performance.now();
			const fetchPromises = batch.map(async (url) => {
				const urlStartTime = performance.now();
				try {
					// Add cache-control headers to the request
					const response = await fetch(
						`${
							process.env.NEXT_PUBLIC_APP_URL || ""
						}/api/og?url=${encodeURIComponent(url)}`,
						{
							next: { revalidate: 86400 }, // Cache for 24 hours
							signal: AbortSignal.timeout(3000), // Reduce timeout to 3 seconds
							headers: {
								"Cache-Control":
									"public, max-age=86400, stale-while-revalidate=604800",
							},
						},
					);

					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}

					const data = await response.json();
					if (data && !data.error) {
						preloadedOgData[url] = data;
						const urlEndTime = performance.now();
						console.log(
							`[Build][LinkPreview] URL (${url}) fetched in ${Math.round(
								urlEndTime - urlStartTime,
							)}ms`,
						);
					}
				} catch (error) {
					if (error instanceof Error) {
						if (error.name === "TimeoutError" || error.name === "AbortError") {
							console.warn(`[Build][LinkPreview] Timeout fetching ${url}`);
						} else {
							console.error(
								`[Build][LinkPreview] Error fetching ${url}:`,
								error.message,
							);
						}
					}
					// Skip this URL and continue with others
				}
			});

			// Wait for current batch to complete
			await Promise.allSettled(fetchPromises);
			const batchEndTime = performance.now();
			console.log(
				`[Build][LinkPreview] Batch ${
					i / batchSize + 1
				} completed in ${Math.round(batchEndTime - batchStartTime)}ms`,
			);
		}
	}

	const endTime = performance.now();
	const successCount = Object.keys(preloadedOgData).length;
	console.log(
		`[Build][LinkPreview] Completed OpenGraph fetch in ${Math.round(
			endTime - startTime,
		)}ms. ` + `Successfully fetched ${successCount}/${urls.length} URLs`,
	);

	return <LinkPreviewList urls={urls} preloadedData={preloadedOgData} />;
}

export default async function VideoPage({ params }: VideoPageProps) {
	const pageStartTime = performance.now();
	const { video } = await params;
	console.log(`[Build][${video}] Starting build`);

	try {
		console.log(`[Build][${video}] Fetching video data...`);
		const videoData = await getVideoById(video);
		if (!videoData) {
			console.log(`[Build][${video}] Video not found`);
			notFound();
		}

		const dataFetchTime = performance.now();
		console.log(
			`[Build][${video}] Video data fetched in ${Math.round(
				dataFetchTime - pageStartTime,
			)}ms. YouTube ID: ${videoData.youtubeVideoId}`,
		);

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
		console.log(
			`[Build][${video}] Processing description and extracting URLs...`,
		);
		const descStartTime = performance.now();

		const urls = videoData.description
			? extractUrlsFromText(videoData.description).slice(0, 10)
			: [];

		console.log(
			`[Build][${video}] Found ${
				urls.length
			} URLs in description: ${JSON.stringify(urls)}`,
		);

		const descriptionWithLinks = videoData.description
			? convertUrlsToLinks(videoData.description)
			: "";

		const processingTime = performance.now();
		console.log(
			`[Build][${video}] URL extraction and processing completed in ${Math.round(
				processingTime - descStartTime,
			)}ms`,
		);

		// Render the page without waiting for OpenGraph data
		const result = (
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
										<Suspense
											fallback={
												<div className="space-y-4">
													{[...Array(Math.min(urls.length, 3))].map((_, i) => (
														<div
															key={`link-preview-skeleton-${urls[i] || i}`}
															className="h-32 bg-muted animate-pulse rounded-lg"
														/>
													))}
												</div>
											}
										>
											<LinkPreviewSection urls={urls} />
										</Suspense>
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

		const pageEndTime = performance.now();
		console.log(
			`[Build][${video}] Total page build time: ${Math.round(
				pageEndTime - pageStartTime,
			)}ms`,
		);

		return result;
	} catch (error) {
		const errorTime = performance.now();
		console.error(
			`[Build][${video}] Error building page (${Math.round(
				errorTime - pageStartTime,
			)}ms):`,
			error,
		);
		notFound();
	}
}
