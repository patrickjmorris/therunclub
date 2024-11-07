import { VideoGrid } from "@/components/videos/video-grid";
import { getChannelInfo, getAllPlaylistItems, CHANNELS } from "@/lib/youtube";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { Metadata } from "next";
import { parseAsString } from "nuqs/server";

interface ChannelPageProps {
	params: Promise<{
		channelId: string;
	}>;
}

// Generate static params for initial channels
export async function generateStaticParams() {
	// Get first 5 channels for initial static generation
	const initialChannels = CHANNELS.slice(0, 5);
	return initialChannels.map((channelId) => ({
		channelId,
	}));
}

// Generate dynamic metadata for SEO
export async function generateMetadata({
	params,
}: { params: Promise<{ channelId: string }> }): Promise<Metadata> {
	const { channelId } = await params;
	const channelInfo = await getChannelInfo(channelId);

	if (!channelInfo?.items.length) {
		return {
			title: "Channel Not Found",
		};
	}

	const channel = channelInfo.items[0];
	return {
		title: `${channel.snippet.title} | The Run Club`,
		description: channel.snippet.description,
		openGraph: {
			title: channel.snippet.title,
			description: channel.snippet.description,
			images: [
				{
					url: channel.snippet.thumbnails.high?.url || "",
					width: 800,
					height: 600,
					alt: channel.snippet.title,
				},
			],
		},
	};
}

export default async function ChannelPage({ params }: ChannelPageProps) {
	// Await and parse the channelId parameter
	const { channelId } = await params;

	// Fetch channel info
	const channelInfo = await getChannelInfo(channelId);
	if (!channelInfo?.items.length) {
		notFound();
	}

	const channel = channelInfo.items[0];
	const playlistId = channel.contentDetails.relatedPlaylists.uploads;

	// Fetch channel's videos
	const playlistItems = await getAllPlaylistItems(playlistId);

	if (!playlistItems) {
		return <div>No videos found</div>;
	}

	// Format video data for the grid
	const videos = playlistItems.slice(0, 10).map((item) => ({
		id: item.snippet.resourceId.videoId,
		title: item.snippet.title,
		channelTitle: item.snippet.channelTitle,
		thumbnailUrl:
			item.snippet.thumbnails.maxres?.url ||
			item.snippet.thumbnails.standard?.url,
		publishedAt: item.snippet.publishedAt,
	}));

	const thumbnail = channel.snippet.thumbnails;
	// Use the highest quality thumbnail available
	const imageUrl =
		thumbnail.high?.url ??
		thumbnail.medium?.url ??
		thumbnail.default?.url ??
		"";
	const imageSize =
		thumbnail.high?.width ??
		thumbnail.medium?.width ??
		thumbnail.default?.width ??
		64;

	return (
		<div className="container py-8">
			{/* Channel Header */}
			<div className="flex items-center gap-6 mb-8">
				<div className="relative w-24 h-24">
					<div className="absolute inset-0">
						<Image
							src={imageUrl}
							alt={channel.snippet.title}
							width={imageSize}
							height={imageSize}
							className="rounded-full object-cover w-full h-full"
						/>
					</div>
				</div>
				<div className="flex-1 min-w-0">
					<h1 className="text-2xl font-bold">{channel.snippet.title}</h1>
					<p className="text-muted-foreground mt-2">
						{channel.snippet.description}
					</p>
				</div>
			</div>

			{/* Videos Grid */}
			<Suspense fallback={<VideoGridSkeleton />}>
				<VideoGrid videos={videos} />
			</Suspense>
		</div>
	);
}

function VideoGridSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{Array.from({ length: 6 }).map((_, i) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: Need skeleton
					key={`skeleton-${i}`}
					className="aspect-video bg-muted rounded-lg animate-pulse"
					aria-hidden="true"
				/>
			))}
		</div>
	);
}
