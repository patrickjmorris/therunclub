import { VideoGrid } from "@/components/videos/video-grid";
import {
	getChannelById,
	getChannelVideos,
	getAllChannels,
} from "@/lib/services/video-service";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { Metadata } from "next";
import { Globe, Play, Users, Video as VideoIcon } from "lucide-react";

interface ChannelPageProps {
	params: Promise<{
		channelId: string;
	}>;
}

// Generate static params for initial channels
export async function generateStaticParams() {
	// Get first 5 channels from database ordered by subscriber count
	const channels = await getAllChannels();
	return channels.slice(0, 5).map((channel) => ({
		channelId: channel.id,
	}));
}

// Generate dynamic metadata for SEO
export async function generateMetadata({
	params,
}: { params: Promise<{ channelId: string }> }): Promise<Metadata> {
	const { channelId } = await params;
	const channel = await getChannelById(channelId);

	if (!channel) {
		return {
			title: "Channel Not Found",
		};
	}

	return {
		title: `${channel.title} | The Run Club`,
		description: channel.description ?? undefined,
		openGraph: {
			title: channel.title,
			description: channel.description ?? undefined,
			images: [
				{
					url: channel.thumbnailUrl ?? "",
					width: 800,
					height: 600,
					alt: channel.title,
				},
			],
		},
	};
}

export default async function ChannelPage({ params }: ChannelPageProps) {
	// Await and parse the channelId parameter
	const { channelId } = await params;

	// Fetch channel info
	const channel = await getChannelById(channelId);
	if (!channel) {
		notFound();
	}

	// Format numbers for better readability
	function formatCompactNumber(num: number): string {
		if (num >= 1000000)
			return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
		if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
		return num.toString();
	}

	const views = formatCompactNumber(Number(channel.viewCount ?? 0));
	const subscribers = formatCompactNumber(Number(channel.subscriberCount ?? 0));
	const videoCount = formatCompactNumber(Number(channel.videoCount ?? 0));

	// Fetch channel's videos
	const videos = await getChannelVideos(channel.id);

	if (!videos.length) {
		return (
			<div className="container py-8">
				<div className="flex items-center gap-6 mb-8">
					<div className="relative w-24 h-24">
						<div className="absolute inset-0">
							<Image
								src={channel.thumbnailUrl ?? ""}
								alt={channel.title}
								width={96}
								height={96}
								className="rounded-full object-cover w-full h-full"
							/>
						</div>
					</div>
					<div className="flex-1 min-w-0">
						<h1 className="text-2xl font-bold">{channel.title}</h1>
						<p className="text-muted-foreground mt-2">{channel.description}</p>
					</div>
				</div>
				<div className="text-center text-muted-foreground">No videos found</div>
			</div>
		);
	}

	return (
		<div className="container py-8">
			{/* Channel Header */}
			<div className="flex flex-col md:flex-row gap-6 mb-8">
				<div className="relative w-24 h-24 md:w-32 md:h-32">
					<div className="absolute inset-0">
						<Image
							src={channel.thumbnailUrl ?? ""}
							alt={channel.title}
							width={128}
							height={128}
							className="rounded-full object-cover w-full h-full"
						/>
					</div>
				</div>
				<div className="flex-1 min-w-0">
					<h1 className="text-2xl font-bold">{channel.title}</h1>
					<div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
						<div className="flex items-center gap-1 text-muted-foreground">
							<Users className="h-4 w-4" />
							<span>{subscribers} subscribers</span>
						</div>
						<div className="flex items-center gap-1 text-muted-foreground">
							<Play className="h-4 w-4" />
							<span>{views} views</span>
						</div>
						<div className="flex items-center gap-1 text-muted-foreground">
							<VideoIcon className="h-4 w-4" />
							<span>{videoCount} videos</span>
						</div>
						{channel.country && (
							<div className="flex items-center gap-1 text-muted-foreground">
								<Globe className="h-4 w-4" />
								<span>{channel.country}</span>
							</div>
						)}
					</div>
					<p className="text-muted-foreground mt-4">{channel.description}</p>
				</div>
			</div>

			{/* Videos Grid */}
			<div className="mt-8">
				<h2 className="text-xl font-semibold mb-4">Latest Videos</h2>
				<Suspense fallback={<VideoGridSkeleton />}>
					<VideoGrid videos={videos} />
				</Suspense>
			</div>
		</div>
	);
}

function VideoGridSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{Array.from({ length: 6 }).map((_, i) => (
				<div
					key={`skeleton-${
						// biome-ignore lint/suspicious/noArrayIndexKey: need for skeleton
						i
					}`}
					className="aspect-video bg-muted rounded-lg animate-pulse"
					aria-hidden="true"
				/>
			))}
		</div>
	);
}
