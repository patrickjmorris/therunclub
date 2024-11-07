import { Suspense } from "react";
import { VideoFilter } from "@/components/videos/video-filter";
import { VideoGrid } from "@/components/videos/video-grid";
import { CHANNELS, getChannelInfo, getAllPlaylistItems } from "@/lib/youtube";
import { Metadata } from "next";
import { VideoGridSkeleton } from "@/components/videos/loading-ui";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

export default async function VideosPage() {
	// Get first 5 channels for featured section
	const featuredChannels = CHANNELS.slice(0, 4);
	const channelsData = await Promise.all(
		featuredChannels.map(async (channelId) => {
			const channelInfo = await getChannelInfo(channelId);
			return channelInfo;
		}),
	);

	// Filter out any null responses
	const channels = channelsData.filter(
		(channel) => channel && channel.items?.length > 0,
	);

	// Get videos from first 5 channels
	const initialChannels = CHANNELS.slice(0, 5);
	const videosData = await Promise.all(
		initialChannels.map(async (channelId) => {
			const channelInfo = await getChannelInfo(channelId);
			if (!channelInfo?.items[0]?.contentDetails?.relatedPlaylists?.uploads) {
				return null;
			}

			const playlistId =
				channelInfo.items[0].contentDetails.relatedPlaylists.uploads;
			const playlistItems = await getAllPlaylistItems(playlistId);

			// Take only the first 10 items from each channel
			return playlistItems?.slice(0, 10) ?? null;
		}),
	);

	// Filter out null responses and flatten the data
	const videos = videosData
		.filter((items): items is NonNullable<typeof items> => items !== null)
		.flatMap((items) =>
			items.map((item) => ({
				id: item.snippet.resourceId.videoId,
				title: item.snippet.title,
				channelTitle: item.snippet.channelTitle,
				thumbnailUrl:
					item.snippet.thumbnails.maxres?.url ||
					item.snippet.thumbnails.standard?.url,
				publishedAt: item.snippet.publishedAt,
			})),
		);

	return (
		<div className="container py-8">
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
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{channels.map((channel) => {
						const thumbnail = channel?.items[0].snippet.thumbnails;
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
								key={channel?.items[0].id}
								href={`/videos/channels/${channel?.items[0].id}`}
								className="transition-opacity hover:opacity-80"
							>
								<Card>
									<CardContent className="p-4">
										<div className="flex flex-col items-center text-center gap-4">
											<div className="relative w-20 h-20">
												<div className="absolute inset-0">
													<Image
														src={imageUrl}
														alt={channel?.items[0].snippet.title ?? ""}
														width={imageSize}
														height={imageSize}
														className="rounded-full object-cover w-full h-full"
													/>
												</div>
											</div>
											<div>
												<h3 className="font-semibold line-clamp-1">
													{channel?.items[0].snippet.title}
												</h3>
											</div>
										</div>
									</CardContent>
								</Card>
							</Link>
						);
					})}
				</div>
			</div>

			{/* Videos Section */}
			<div>
				<h2 className="text-2xl font-bold mb-6">Latest Videos</h2>
				<VideoFilter />
				<div className="mt-8">
					<Suspense fallback={<VideoGridSkeleton />}>
						<VideoGrid videos={videos} />
					</Suspense>
				</div>
			</div>
		</div>
	);
}
