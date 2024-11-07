import { Suspense } from "react";
import { CHANNELS, getChannelInfo } from "@/lib/youtube";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default async function DefaultChannelsPage() {
	// Fetch channel data for all channels
	const channelsData = await Promise.all(
		CHANNELS.map(async (channelId) => {
			const channelInfo = await getChannelInfo(channelId);
			return channelInfo?.items[0];
		}),
	);

	// Filter out any null responses
	const channels = channelsData.filter(Boolean);

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
					{channels.map((channel) => (
						<Link
							key={channel?.id}
							href={`/videos/channels/${channel?.id}`}
							className="transition-opacity hover:opacity-80"
						>
							<Card>
								<CardContent className="p-4">
									<div className="flex items-center gap-4">
										<div className="relative h-16 w-16 rounded-full overflow-hidden">
											<Image
												src={channel?.snippet.thumbnails.default.url ?? ""}
												alt={channel?.snippet.title ?? ""}
												fill
												className="object-cover"
											/>
										</div>
										<div>
											<h2 className="font-semibold line-clamp-1">
												{channel?.snippet.title}
											</h2>
											<p className="text-sm text-muted-foreground line-clamp-2">
												{channel?.snippet.description}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</Suspense>
			</div>
		</div>
	);
}

function ChannelSkeleton() {
	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex items-center gap-4">
					<div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
					<div className="flex-1">
						<div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
						<div className="mt-2 h-4 w-full bg-muted animate-pulse rounded" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
