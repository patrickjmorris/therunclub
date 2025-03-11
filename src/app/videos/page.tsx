import { Suspense } from "react";
import { VideoFilter } from "@/components/videos/video-filter";
import { VideoGrid } from "@/components/videos/video-grid";
import { Metadata } from "next";
import { LoadingGridSkeleton } from "@/components/videos/loading-ui";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
	getFeaturedChannels,
	getFilteredVideos,
	getLatestVideos,
	getTopVideoTags,
} from "@/lib/services/video-service";
import { parseAsString } from "nuqs/server";
import AddContentWrapper from "@/components/content/AddContentWrapper";
import { FeaturedChannelsRow } from "@/components/videos/FeaturedChannelsRow";

export const metadata: Metadata = {
	title: "Running Videos | The Run Club",
	description:
		"Watch the latest running videos from top creators in the running community",
	openGraph: {
		title: "Running Videos | The Run Club",
		description:
			"Watch the latest running videos from top creators in the running community",
		type: "website",
	},
	alternates: {
		canonical: "/videos",
	},
};

interface PageProps {
	searchParams: Promise<{ q?: string; category?: string }>;
}

export const revalidate = 3600;

export default async function VideosPage({ searchParams }: PageProps) {
	// Parse search params
	const { q, category } = await searchParams;
	const query = parseAsString.withDefault("").parseServerSide(q);
	const tag = parseAsString.withDefault("").parseServerSide(category);

	// console.log("Search params:", { query, tag });

	// Get featured channels and top tags
	const [featuredChannels, topTags] = await Promise.all([
		getFeaturedChannels(10),
		getTopVideoTags(10),
	]);

	// Get videos based on filters or get latest
	const videos =
		query || tag
			? await getFilteredVideos({
					searchQuery: query || undefined,
					tag: tag || undefined,
					limit: 30,
			  })
			: await getLatestVideos(30);

	// console.log("Videos count:", videos.length);
	// console.log("First video:", videos[0]);

	return (
		<div className="container py-8">
			{/* Search Section */}
			<div className="flex items-center justify-between mb-8">
				<AddContentWrapper defaultTab="channel" />
			</div>

			{/* Featured Channels Section */}
			<div className="mb-12">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-bold">Featured Channels</h2>
					<Button variant="ghost" asChild>
						<Link href="/videos/channels" className="group">
							View All Channels
							<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
						</Link>
					</Button>
				</div>
				<FeaturedChannelsRow channels={featuredChannels} />
			</div>

			{/* Videos Section */}
			<div>
				<h2 className="text-2xl font-bold mb-6">Latest Videos</h2>
				<VideoFilter tags={topTags} />
				<div className="mt-8">
					<Suspense key={`${query}-${tag}`} fallback={<LoadingGridSkeleton />}>
						<VideoGrid
							videos={videos.map((item) => {
								// Handle both filtered and latest videos formats
								const video = "video" in item ? item.video : item;
								const channel = "channel" in item ? item.channel : null;

								return {
									id: video.id,
									title: video.title,
									description: video.description,
									thumbnailUrl: video.thumbnailUrl,
									publishedAt: video.publishedAt,
									channelTitle: channel?.title ?? null,
									channelId: video.channelId,
									viewCount: video.viewCount,
									likeCount: video.likeCount,
									commentCount: video.commentCount,
									duration: video.duration,
									youtubeVideoId: video.youtubeVideoId,
									createdAt: video.createdAt,
									updatedAt: video.updatedAt,
									tags: video.tags,
								};
							})}
						/>
					</Suspense>
				</div>
			</div>
		</div>
	);
}
