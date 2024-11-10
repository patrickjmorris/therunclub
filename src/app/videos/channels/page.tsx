import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Metadata } from "next";
import { Globe, Play, Users, Video } from "lucide-react";
import { getAllChannels } from "@/lib/services/video-service";

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

function formatCompactNumber(num: number): string {
	if (num >= 1000000)
		return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
	if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
	return num.toString();
}

export default async function ChannelsPage() {
	// Fetch channels from database
	const channels = await getAllChannels();

	return (
		<div className="container py-8">
			<h1 className="text-2xl font-bold mb-6">Running Channels</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<Suspense
					fallback={Array.from({ length: 6 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: needed for skeleton
						<ChannelSkeleton key={`skeleton-${i}`} />
					))}
				>
					{channels.map((channel) => {
						// Format numbers for better readability
						const views = formatCompactNumber(Number(channel.viewCount ?? 0));
						const subscribers = formatCompactNumber(
							Number(channel.subscriberCount ?? 0),
						);
						const videos = formatCompactNumber(Number(channel.videoCount ?? 0));

						return (
							<Link
								key={channel.id}
								href={`/videos/channels/${channel.youtubeChannelId}`}
								className="transition-opacity hover:opacity-80"
							>
								<Card>
									<CardContent className="p-4">
										<div className="flex flex-col gap-4">
											<div className="flex items-center gap-4">
												<div className="relative w-16 h-16">
													<div className="absolute inset-0">
														<Image
															src={channel.thumbnailUrl ?? ""}
															alt={channel.title}
															width={64}
															height={64}
															className="rounded-full object-cover w-full h-full"
														/>
													</div>
												</div>
												<div className="flex-1 min-w-0">
													<h2 className="font-semibold line-clamp-1">
														{channel.title}
													</h2>
													<p className="text-sm text-muted-foreground line-clamp-2">
														{channel.description}
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
												{channel.country && (
													<div className="flex items-center gap-1 text-muted-foreground">
														<Globe className="h-4 w-4" />
														<span>{channel.country}</span>
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
							// biome-ignore lint/suspicious/noArrayIndexKey: needed for skeleton
							<div key={i} className="h-4 bg-muted animate-pulse rounded" />
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
