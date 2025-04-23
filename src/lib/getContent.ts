import { cache } from "react";
import { db } from "@/db/client";
import { athletes, episodes, podcasts, videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAthleteData } from "@/lib/services/athlete-service";
import { getEpisode, getPodcastBySlug } from "@/lib/services/podcast-service";
import { getVideoById } from "@/lib/services/video-service";

export type ContentType = "podcast" | "episode" | "video" | "athlete";

export interface OgContent {
	title: string;
	coverImage: string | null;
	contentType: ContentType;
}

// Define a cached function to fetch content data
// Using React's cache to memoize requests within the same request scope
export const getContent = cache(
	async (
		contentType: ContentType,
		identifier: string, // slug or id
		podcastSlug?: string, // Needed specifically for episodes
	): Promise<OgContent | null> => {
		try {
			switch (contentType) {
				case "podcast": {
					const podcast = await getPodcastBySlug(identifier);
					if (!podcast) return null;
					return {
						title: podcast.title ?? "Podcast",
						coverImage: podcast.image || podcast.itunesImage || null,
						contentType,
					};
				}
				case "episode": {
					// Episodes might need both episode slug and podcast slug for unique identification.
					// The getEpisode function might only take the episode slug, but we need to
					// ensure it belongs to the correct podcast if podcastSlug is provided.
					const episode = await getEpisode(identifier); // identifier is episodeSlug

					if (!episode) return null;

					// If podcastSlug is provided, verify the episode belongs to that podcast
					if (podcastSlug && episode.podcastSlug !== podcastSlug) {
						console.warn(
							`getContent: Episode ${identifier} found, but does not belong to podcast ${podcastSlug}`,
						);
						return null;
					}

					return {
						title: episode.title ?? "Episode",
						coverImage: episode.image || episode.podcastImage || null,
						contentType,
					};
				}
				case "video": {
					const video = await getVideoById(identifier); // identifier is videoId
					if (!video) return null;
					return {
						title: video.title ?? "Video",
						coverImage: video.thumbnailUrl || null,
						contentType,
					};
				}
				case "athlete": {
					const athlete = await getAthleteData(identifier); // identifier is athleteSlug
					if (!athlete) return null;
					return {
						title: athlete.name ?? "Athlete",
						coverImage: athlete.imageUrl || null,
						contentType,
					};
				}
				default: {
					// Handle unknown content type - assertion or error logging
					const exhaustiveCheck: never = contentType;
					console.error(
						`getContent: Unknown content type "${exhaustiveCheck}"`,
					);
					return null;
				}
			}
		} catch (error) {
			console.error(
				`getContent: Error fetching ${contentType} (${identifier}):`,
				error,
			);
			return null;
		}
	},
);
