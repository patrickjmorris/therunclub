import { MetadataRoute } from "next";
import { CHANNELS, getChannelInfo, getAllPlaylistItems } from "@/lib/youtube";
import { db } from "@/db/client";
import { podcasts } from "@/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	// Get existing podcasts for sitemap
	const podcastsData = await db.select().from(podcasts);
	const podcastUrls = podcastsData.map((podcast) => ({
		url: `${baseUrl}/podcasts/${podcast.podcastSlug}`,
		lastModified: podcast.lastBuildDate ?? new Date(),
	}));

	// Get initial channels and their videos
	const initialChannels = CHANNELS.slice(0, 5);
	const channelsData = await Promise.all(
		initialChannels.map(async (channelId) => {
			const channelInfo = await getChannelInfo(channelId);
			if (!channelInfo?.items[0]?.contentDetails?.relatedPlaylists?.uploads) {
				return null;
			}

			const playlistId =
				channelInfo.items[0].contentDetails.relatedPlaylists.uploads;
			const playlistItems = await getAllPlaylistItems(playlistId);
			return playlistItems?.slice(0, 10) ?? null;
		}),
	);

	const videoUrls = channelsData
		.filter((items): items is NonNullable<typeof items> => items !== null)
		.flatMap((items) =>
			items.map((item) => ({
				url: `${baseUrl}/videos/${item.snippet.resourceId.videoId}`,
				lastModified: new Date(item.snippet.publishedAt),
			})),
		);

	// Combine all URLs
	return [
		{
			url: baseUrl,
			lastModified: new Date(),
		},
		{
			url: `${baseUrl}/podcasts`,
			lastModified: new Date(),
		},
		{
			url: `${baseUrl}/videos`,
			lastModified: new Date(),
		},
		{
			url: `${baseUrl}/videos/channels`,
			lastModified: new Date(),
		},
		...podcastUrls,
		...videoUrls,
	];
}
