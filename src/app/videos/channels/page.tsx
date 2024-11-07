import { Suspense } from "react";
import { CHANNELS, getChannelInfo } from "@/lib/youtube";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Metadata } from "next";
import { Globe, Play, Users, Video } from "lucide-react";

// Define metadata for SEO
export const metadata: Metadata = {
	title: "Running Channels | The Run Club",
	description: "Discover the best running channels and content creators",
	openGraph: {
		title: "Running Channels | The Run Club",
		description: "Discover the best running channels and content creators",
		type: "website",
	},
};

export default async function ChannelsPage() {
	// Fetch channel data for all channels
	const channelsData = await Promise.all(
		CHANNELS.map(async (channelId) => {
			const channelInfo = await getChannelInfo(channelId);
			return channelInfo;
		}),
	);

	// Filter out any null responses
	const channels = channelsData.filter(
		(channel) => channel && channel.items?.length > 0,
	);

	return (
		<div className="container py-8">
			<h1 className="text-2xl font-bold mb-6">Running Channels</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<Suspense
					fallback={Array.from({ length: 6 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: Need skeleton
						<ChannelSkeleton key={`skeleton-${i}`} />
					))}
				>
					{channels.map((channel) => {
						const channelData = channel?.items[0];
						const thumbnail = channelData?.snippet.thumbnails;
						const stats = channelData?.statistics;

						// Format numbers for better readability
						const views = new Intl.NumberFormat().format(
							Number(stats?.viewCount ?? 0),
						);
						const subscribers = new Intl.NumberFormat().format(
							Number(stats?.subscriberCount ?? 0),
						);
						const videos = new Intl.NumberFormat().format(
							Number(stats?.videoCount ?? 0),
						);

						// Use the highest quality thumbnail available
						const imageUrl =
							thumbnail?.high?.url ??
							thumbnail?.medium?.url ??
							thumbnail?.default?.url ??
							"";
						const imageSize =
							thumbnail?.high?.width ??
							thumbnail?.medium?.width ??
							thumbnail?.default?.width ??
							64;

						return (
							<Link
								key={channelData?.id}
								href={`/videos/channels/${channelData?.id}`}
								className="transition-opacity hover:opacity-80"
							>
								<Card>
									<CardContent className="p-4">
										<div className="flex flex-col gap-4">
											<div className="flex items-center gap-4">
												<div className="relative w-16 h-16">
													<div className="absolute inset-0">
														<Image
															src={imageUrl}
															alt={channelData?.snippet.title ?? ""}
															width={imageSize}
															height={imageSize}
															className="rounded-full object-cover w-full h-full"
														/>
													</div>
												</div>
												<div className="flex-1 min-w-0">
													<h2 className="font-semibold line-clamp-1">
														{channelData?.snippet.title ?? ""}
													</h2>
													<p className="text-sm text-muted-foreground line-clamp-2">
														{channelData?.snippet.description ?? ""}
													</p>
												</div>
											</div>

											{/* Channel Statistics */}
											<div className="grid grid-cols-2 gap-2 text-sm">
												<div className="flex items-center gap-1 text-muted-foreground">
													<Users className="h-4 w-4" />
													<span>{subscribers} subscribers</span>
												</div>
												<div className="flex items-center gap-1 text-muted-foreground">
													<Play className="h-4 w-4" />
													<span>{views} views</span>
												</div>
												<div className="flex items-center gap-1 text-muted-foreground">
													<Video className="h-4 w-4" />
													<span>{videos} videos</span>
												</div>
												{channelData?.snippet.country && (
													<div className="flex items-center gap-1 text-muted-foreground">
														<Globe className="h-4 w-4" />
														<span>{channelData?.snippet.country}</span>
													</div>
												)}
											</div>
										</div>
									</CardContent>
								</Card>
							</Link>
						);
					})}
				</Suspense>
			</div>
		</div>
	);
}

function ChannelSkeleton() {
	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-4">
						<div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
						<div className="flex-1">
							<div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
							<div className="mt-2 h-4 w-full bg-muted animate-pulse rounded" />
						</div>
					</div>
					<div className="grid grid-cols-2 gap-2">
						{Array.from({ length: 4 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: Need skeleton
							<div key={i} className="h-4 bg-muted animate-pulse rounded" />
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
