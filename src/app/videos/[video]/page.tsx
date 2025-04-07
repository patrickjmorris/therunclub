import { Metadata } from "next";
import { getVideoById, getChannelVideos } from "@/lib/services/video-service";
import { notFound } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { Eye, ThumbsUp, MessageCircle, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { extractUrlsFromText } from "@/lib/extract-urls";
import Link from "next/link";
import { eq, desc, isNotNull } from "drizzle-orm";
import { videos, channels } from "@/db/schema";
import { db } from "@/db/client";
import { Suspense } from "react";
import { createWeeklyCache } from "@/lib/utils/cache";
import { and } from "drizzle-orm";
import { preloadLinks } from "@/components/common/link-preview/link-preview-preloader";
import { AthleteMentions } from "@/components/athletes/athlete-mentions";
import { AthleteReferences } from "@/components/athletes/athlete-references";
import { MentionLoading } from "@/components/common/mention-loading";

// Dynamically import components
const DynamicVideoPlayer = (await import("next/dynamic")).default(
	() =>
		import("@/components/videos/video-player").then((mod) => ({
			default: mod.VideoPlayer,
		})),
	{ ssr: false },
);

const DynamicTabsWithState = (await import("next/dynamic")).default(
	() =>
		import("@/components/common/tabs-with-state").then((mod) => ({
			default: mod.TabsWithState,
		})),
	{ ssr: false },
);

const DynamicLinkPreviewClientWrapper = (await import("next/dynamic")).default(
	() =>
		import("@/components/common/link-preview/link-preview-client-wrapper").then(
			(mod) => ({
				default: mod.LinkPreviewClientWrapper,
			}),
		),
	{ ssr: false },
);

const DynamicLinkPreviewPreloader = (await import("next/dynamic")).default(
	() =>
		import("@/components/common/link-preview/link-preview-preloader").then(
			(mod) => ({
				default: mod.LinkPreviewPreloader,
			}),
		),
	{ ssr: false },
);

const DynamicLinkPreviewErrorBoundary = (await import("next/dynamic")).default(
	() =>
		import("@/components/common/link-preview/link-preview-error-boundary").then(
			(mod) => ({
				default: mod.LinkPreviewErrorBoundary,
			}),
		),
	{ ssr: false },
);

const DynamicMoreContent = (await import("next/dynamic")).default(
	() =>
		import("@/components/common/content/more-content").then((mod) => ({
			default: mod.MoreContent,
		})),
	{ ssr: false },
);

// Increase revalidation time to 1 week (604800 seconds)
export const dynamic = "force-static";
export const revalidate = 604800;

// Convert URLs to links in text content
function convertUrlsToLinks(text: string): string {
	if (!text) return "";
	const urlRegex =
		/(\bhttps?:\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
	return text.replace(
		urlRegex,
		'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
	);
}

interface VideoPageProps {
	params: Promise<{
		video: string;
	}>;
}

// Create a cached function for fetching video data
const getVideoData = createWeeklyCache(
	async (videoId: string) => {
		try {
			const video = await getVideoById(videoId);
			if (!video) return null;

			// Get more videos from the same channel
			const moreVideos = await getChannelVideos(video.channelId, 4);
			const filteredMoreVideos = moreVideos
				.filter((v) => v.id !== videoId)
				.slice(0, 3);

			// Format numbers for better readability
			const views = new Intl.NumberFormat().format(
				Number(video.viewCount ?? 0),
			);
			const likes = new Intl.NumberFormat().format(
				Number(video.likeCount ?? 0),
			);
			const comments = new Intl.NumberFormat().format(
				Number(video.commentCount ?? 0),
			);

			// Extract URLs and convert them to links in the description
			const urls = video.description
				? extractUrlsFromText(video.description)
				: [];
			const descriptionWithLinks = video.description
				? convertUrlsToLinks(video.description)
				: "";

			return {
				video,
				moreVideos: filteredMoreVideos,
				views,
				likes,
				comments,
				urls,
				descriptionWithLinks,
			};
		} catch (error) {
			console.error("Error in getVideoData:", error);
			return null;
		}
	},
	["video-detail"],
	["videos"],
);

export async function generateMetadata({
	params,
}: VideoPageProps): Promise<Metadata> {
	const { video } = await params;
	const data = await getVideoData(video);

	if (!data) {
		return {
			title: "Video Not Found",
		};
	}

	const { video: videoData } = data;

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

export async function generateStaticParams() {
	console.log("[Build] Starting generateStaticParams for videos");

	try {
		// Get all channels
		const allChannels = await db
			.select({ id: channels.id })
			.from(channels)
			.limit(100); // Limit to top 100 channels

		console.log(`[Build] Found ${allChannels.length} channels`);

		const params = [];

		// For each channel, get the 10 most recent videos
		for (const channel of allChannels) {
			try {
				const recentVideos = await db
					.select({ id: videos.id })
					.from(videos)
					.where(and(isNotNull(videos.id), eq(videos.channelId, channel.id)))
					.orderBy(desc(videos.publishedAt))
					.limit(10);

				// Add each video to params
				params.push(
					...recentVideos.map((video) => ({
						video: video.id,
					})),
				);

				console.log(
					`[Build] Added ${recentVideos.length} videos from channel ${channel.id}`,
				);
			} catch (error) {
				console.error(`[Build] Error processing channel ${channel.id}:`, error);
			}
		}

		console.log(`[Build] Total videos to build: ${params.length}`);
		return params;
	} catch (error) {
		console.error("[Build] Error in generateStaticParams for videos:", error);
		return []; // Return empty array instead of failing the build
	}
}

export default async function VideoPage({ params }: VideoPageProps) {
	const { video } = await params;
	const data = await getVideoData(video);

	if (!data) {
		notFound();
	}

	const {
		video: videoData,
		moreVideos,
		views,
		likes,
		comments,
		urls,
		descriptionWithLinks,
	} = data;

	// Start preloading the link previews
	const preloadedData = preloadLinks(urls);

	return (
		<div className="container py-8">
			<DynamicVideoPlayer
				videoId={videoData.youtubeVideoId}
				title={videoData.title}
			/>
			<div className="mt-4">
				<h1 className="text-2xl font-bold">{videoData.title}</h1>

				{/* Channel and date info */}
				<div className="mt-2 flex items-center gap-2">
					<Link
						href={`/videos/channels/${videoData.channelId}`}
						className="hover:text-foreground transition-colors font-bold"
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

				{/* Athletes Mentioned */}
				<div className="mt-8">
					<Suspense fallback={<MentionLoading title="Athletes Mentioned" />}>
						<AthleteReferences
							contentId={videoData.id}
							contentType="video"
							title="Athletes Mentioned"
						/>
					</Suspense>
				</div>

				{/* Content */}
				<div className="mt-6 max-w-3xl">
					{urls.length > 0 ? (
						<>
							<DynamicLinkPreviewPreloader urls={urls} />
							<DynamicTabsWithState
								className="max-w-3xl"
								tabs={[
									{
										value: "description",
										label: "Description",
										content: (
											<div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap break-words [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:decoration-blue-600/30 dark:[&_a]:decoration-blue-400/30 [&_a:hover]:decoration-blue-600 dark:[&_a:hover]:decoration-blue-400 [&_a]:transition-colors">
												<div
													// biome-ignore lint/security/noDangerouslySetInnerHtml: Content is escaped and URLs are safely converted to links
													dangerouslySetInnerHTML={{
														__html: descriptionWithLinks,
													}}
												/>
											</div>
										),
									},
									{
										value: "links",
										label: `Links (${urls.length})`,
										content: (
											<div className="space-y-4">
												<Suspense
													fallback={
														<div className="animate-pulse">
															Loading link previews...
														</div>
													}
												>
													<DynamicLinkPreviewErrorBoundary
														fallback={
															<div className="text-sm text-muted-foreground">
																Unable to load link previews. You can still
																click the links in the description.
															</div>
														}
													>
														<DynamicLinkPreviewClientWrapper
															urls={urls}
															preloadedData={preloadedData}
														/>
													</DynamicLinkPreviewErrorBoundary>
												</Suspense>
											</div>
										),
									},
								]}
							/>
						</>
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

			{/* More Videos Section */}
			{moreVideos.length > 0 && (
				<DynamicMoreContent
					title={`More from ${videoData.channelTitle}`}
					items={moreVideos.map((v) => ({
						id: v.id,
						title: v.title,
						thumbnailUrl: v.thumbnailUrl ?? undefined,
						publishedAt: v.publishedAt ?? undefined,
						duration: v.duration ?? undefined,
						type: "video",
						channelTitle: v.channelTitle ?? undefined,
					}))}
				/>
			)}
		</div>
	);
}
