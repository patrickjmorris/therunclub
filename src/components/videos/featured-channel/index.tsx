import { db } from "@/db/client";
import { channels, videos, podcasts, episodes } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { FeaturedChannelClient } from "./featured-channel-client";
import { updateChannelColor } from "@/lib/server/channel-colors";

const getChannelWithVideos = unstable_cache(
	async (channelId: string) => {
		// Try to find channel by either UUID or YouTube ID
		const channel = await db
			.select()
			.from(channels)
			.where(
				sql`${channels.id}::text = ${channelId} OR ${channels.youtubeChannelId} = ${channelId}`,
			)
			.limit(1)
			.then((rows) => rows[0]);

		if (!channel) {
			throw new Error(`Channel not found: ${channelId}`);
		}

		// Extract vibrant color if not already present
		if (channel.thumbnailUrl && !channel.vibrantColor) {
			const vibrantColor = await updateChannelColor(
				channel.id,
				channel.thumbnailUrl,
			);
			if (vibrantColor) {
				channel.vibrantColor = vibrantColor;
			}
		}

		const channelVideos = await db
			.select()
			.from(videos)
			.where(eq(videos.channelId, channel.id))
			.orderBy(desc(videos.publishedAt))
			.limit(3);

		return {
			...channel,
			videos: channelVideos,
		};
	},
	["channel-with-videos"],
	{
		tags: ["channel", "videos"],
		revalidate: 60, // Cache for 1 minute
	},
);

interface FeaturedChannelProps {
	channelId: string;
}

export async function FeaturedChannel({ channelId }: FeaturedChannelProps) {
	const channel = await getChannelWithVideos(channelId);

	const formattedItems = channel.videos.map((video) => ({
		id: video.id,
		title: video.title,
		thumbnailUrl: video.thumbnailUrl || "",
		publishedAt: video.publishedAt || new Date(),
		type: "video" as const,
	}));

	return (
		<FeaturedChannelClient
			title={channel.title}
			thumbnailUrl={channel.thumbnailUrl || ""}
			vibrantColor={channel.vibrantColor || undefined}
			items={formattedItems}
			type="channel"
			slug={channel.id}
		/>
	);
}

const getPodcastWithEpisodes = unstable_cache(
	async (podcastId: string) => {
		const podcast = await db
			.select()
			.from(podcasts)
			.where(eq(podcasts.id, podcastId))
			.limit(1)
			.then((rows) => rows[0]);

		if (!podcast) {
			throw new Error(`Podcast not found: ${podcastId}`);
		}

		// Remove real-time color extraction since it's handled by backend routes
		const podcastEpisodes = await db
			.select()
			.from(episodes)
			.where(eq(episodes.podcastId, podcast.id))
			.orderBy(desc(episodes.pubDate))
			.limit(3);

		return {
			...podcast,
			episodes: podcastEpisodes,
		};
	},
	["podcast-with-episodes"],
	{
		tags: ["podcast", "episodes"],
		revalidate: 60, // Cache for 1 minute
	},
);

interface FeaturedPodcastProps {
	podcastId: string;
}

export async function FeaturedPodcast({ podcastId }: FeaturedPodcastProps) {
	const podcast = await getPodcastWithEpisodes(podcastId);

	const formattedItems = podcast.episodes.map((episode) => ({
		id: episode.id,
		title: episode.title,
		thumbnailUrl:
			episode.episodeImage || podcast.podcastImage || podcast.itunesImage || "",
		publishedAt: episode.pubDate || new Date(),
		type: "episode" as const,
		podcastTitle: podcast.title,
		podcastSlug: podcast.podcastSlug || "",
		episodeSlug: episode.episodeSlug || "",
	}));

	return (
		<FeaturedChannelClient
			title={podcast.title}
			thumbnailUrl={podcast.podcastImage || podcast.itunesImage || ""}
			vibrantColor={podcast.vibrantColor || undefined}
			items={formattedItems}
			type="podcast"
			slug={podcast.podcastSlug || ""}
		/>
	);
}
