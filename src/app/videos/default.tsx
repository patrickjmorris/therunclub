import { Suspense } from "react";
import { VideoFilter } from "@/components/videos/video-filter";
import { VideoGrid } from "@/components/videos/video-grid";
import { CHANNELS, getChannelInfo, getAllPlaylistItems } from "@/lib/youtube";
import { VideoGridSkeleton } from "@/components/videos/loading-ui";

export default async function DefaultVideosPage() {
	// Get first 5 channels for initial load
	const initialChannels = CHANNELS.slice(0, 5);

	// Fetch channel info and their playlists in parallel
	const channelsData = await Promise.all(
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
	const videos = channelsData
		.filter((items): items is NonNullable<typeof items> => items !== null)
		.flatMap((items) =>
			items.map((item) => ({
				id: item.snippet.resourceId.videoId,
				title: item.snippet.title,
				channelTitle: item.snippet.channelTitle,
				thumbnailUrl: item.snippet.thumbnails.medium?.url || "",
				publishedAt: item.snippet.publishedAt,
			})),
		);

	return (
		<div className="container py-8">
			<h1 className="text-2xl font-bold mb-6">Running Videos</h1>
			<VideoFilter />
			<div className="mt-8">
				<Suspense fallback={<VideoGridSkeleton />}>
					<VideoGrid videos={videos} />
				</Suspense>
			</div>
		</div>
	);
}
