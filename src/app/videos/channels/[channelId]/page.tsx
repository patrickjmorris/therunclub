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
import { LoadingGridSkeleton } from "@/components/videos/loading-ui";
import { InfiniteVideoGrid } from "@/components/videos/infinite-video-grid";
import { fetchMore } from "./actions";

interface ChannelPageProps {
	params: Promise<{
		channelId: string;
	}>;
}

// Generate static params for initial channels
export async function generateStaticParams() {
	const channels = await getAllChannels();
	return channels.map((channel) => ({
		channelId: channel.id,
	}));
}

// Generate dynamic metadata for SEO
export const revalidate = 3600;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ channelId: string }>;
}): Promise<Metadata> {
	const resolvedParams = await params;
	const channel = await getChannelById(resolvedParams.channelId);

	if (!channel) return {};

	const imageUrl = channel.thumbnailUrl || "";
	const description =
		channel.description?.substring(0, 155) ||
		`Watch videos from ${channel.title} on The Run Club`;

	return {
		title: channel.title,
		description: description,
		openGraph: {
			type: "website",
			title: channel.title,
			description: description,
			siteName: "The Run Club",
			images: [
				{
					url: imageUrl,
					width: 1200,
					height: 630,
					alt: channel.title,
				},
			],
			locale: "en_US",
		},
		twitter: {
			card: "summary_large_image",
			title: channel.title,
			description: description,
			images: [imageUrl],
		},
		alternates: {
			canonical: `/videos/channels/${resolvedParams.channelId}`,
		},
	};
}

export default async function ChannelPage({ params }: ChannelPageProps) {
	const { channelId } = await params;
	const channel = await getChannelById(channelId);

	if (!channel) {
		notFound();
	}

	function formatCompactNumber(num: number): string {
		if (num >= 1000000)
			return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
		if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
		return num.toString();
	}

	const views = formatCompactNumber(Number(channel.viewCount ?? 0));
	const subscribers = formatCompactNumber(Number(channel.subscriberCount ?? 0));
	const videoCount = formatCompactNumber(Number(channel.videoCount ?? 0));

	// Get initial videos
	const videos = await getChannelVideos(channel.id, 12, 0);

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

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "WebPage",
		name: channel.title,
		description: channel.description,
		image: channel.thumbnailUrl,
		url: `/videos/channels/${channel.id}`,
	};

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
				<Suspense fallback={<LoadingGridSkeleton />}>
					<InfiniteVideoGrid
						initialVideos={videos}
						fetchMore={fetchMore.bind(null, channel.id)}
						hasMore={videos.length === 12}
					/>
				</Suspense>
			</div>

			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
		</div>
	);
}
