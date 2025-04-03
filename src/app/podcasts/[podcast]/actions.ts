"use server";

import {
	getLastTenEpisodesByPodcastSlug,
	getEpisode,
} from "@/lib/services/podcast-service";
import type { BasicEpisode } from "@/types/shared";

export async function fetchMore(
	podcastSlug: string,
	page: number,
): Promise<BasicEpisode[]> {
	const limit = 10;
	const offset = (page - 1) * limit;
	const episodes = await getLastTenEpisodesByPodcastSlug(
		podcastSlug,
		limit,
		offset,
	);

	// Fetch full episode data for each episode
	const fullEpisodes = await Promise.all(
		episodes.map((episode) => getEpisode(episode.episodeSlug)),
	);

	// Filter out any null episodes and convert to BasicEpisode type
	return fullEpisodes
		.filter(
			(episode): episode is NonNullable<typeof episode> => episode !== null,
		)
		.map((episode) => ({
			id: episode.id,
			episodeSlug: episode.episodeSlug,
			title: episode.title,
			pubDate: episode.pubDate,
			image: episode.image,
			podcastSlug: episode.podcastSlug,
			podcastTitle: episode.podcastTitle,
			podcastImage: episode.podcastImage,
			itunesImage: episode.itunesImage,
			episodeImage: episode.episodeImage,
			duration: episode.duration,
			content: episode.content,
			podcastId: episode.podcastId,
			podcastAuthor: episode.podcastAuthor ?? "",
			enclosureUrl: episode.enclosureUrl ?? "",
			explicit: episode.explicit,
			link: episode.link,
		}));
}
