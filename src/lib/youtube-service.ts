import { safeDateParse } from "./date-utils";

export interface YouTubeChannelResponse {
	items: Array<{
		id: string;
		snippet: {
			title: string;
			description: string;
			customUrl: string;
			publishedAt: string;
			thumbnails: {
				default?: { url: string };
				medium?: { url: string };
				high?: { url: string };
			};
			country?: string;
		};
		statistics: {
			viewCount: string;
			subscriberCount: string;
			videoCount: string;
		};
		contentDetails: {
			relatedPlaylists: {
				uploads: string;
			};
		};
	}>;
}

export interface YouTubeVideoResponse {
	items: Array<{
		id: string;
		snippet: {
			title: string;
			description: string;
			channelTitle: string;
			publishedAt: string;
			thumbnails: {
				default?: { url: string };
				medium?: { url: string };
				high?: { url: string };
			};
			tags?: string[];
		};
		contentDetails: {
			duration: string;
		};
		statistics: {
			viewCount: string;
			likeCount: string;
			commentCount: string;
		};
	}>;
	nextPageToken?: string;
}

interface PlaylistItemResponse {
	items: Array<{
		contentDetails: {
			videoId: string;
		};
	}>;
	pageInfo: {
		totalResults: number;
	};
	nextPageToken?: string;
}

export interface FetchVideosOptions {
	maxResults?: number;
	maxPages?: number;
	onProgress?: (progress: {
		videosProcessed: number;
		totalVideos: number;
		currentPage: number;
	}) => void;
}

/**
 * Fetches videos from a YouTube channel in batches
 */
export async function fetchChannelVideos(
	channelId: string,
	uploadsPlaylistId: string,
	options: FetchVideosOptions = {},
) {
	const { maxResults = 50, maxPages = 2, onProgress } = options;

	let pageToken: string | undefined;
	let totalVideosProcessed = 0;
	let currentPage = 0;
	const allVideoItems: YouTubeVideoResponse["items"] = [];

	try {
		do {
			// Get video IDs from the uploads playlist
			const playlistUrl = new URL(
				"https://www.googleapis.com/youtube/v3/playlistItems",
			);
			playlistUrl.searchParams.append("part", "contentDetails");
			playlistUrl.searchParams.append("maxResults", maxResults.toString());
			playlistUrl.searchParams.append("playlistId", uploadsPlaylistId);
			playlistUrl.searchParams.append("key", process.env.YOUTUBE_API_KEY || "");
			if (pageToken) {
				playlistUrl.searchParams.append("pageToken", pageToken);
			}

			const playlistResponse = await fetch(playlistUrl.toString());
			if (!playlistResponse.ok) {
				throw new Error("Failed to fetch playlist items");
			}

			const playlistData =
				(await playlistResponse.json()) as PlaylistItemResponse;
			const videoIds = playlistData.items
				.map((item) => item.contentDetails.videoId)
				.join(",");

			// Get detailed video information
			const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
			videosUrl.searchParams.append(
				"part",
				"snippet,contentDetails,statistics",
			);
			videosUrl.searchParams.append("id", videoIds);
			videosUrl.searchParams.append("key", process.env.YOUTUBE_API_KEY || "");

			const videosResponse = await fetch(videosUrl.toString());
			if (!videosResponse.ok) {
				throw new Error("Failed to fetch video details");
			}

			const videosData = (await videosResponse.json()) as YouTubeVideoResponse;
			allVideoItems.push(...(videosData.items || []));

			totalVideosProcessed += videosData.items?.length || 0;
			currentPage++;

			// Report progress if callback provided
			if (onProgress) {
				onProgress({
					videosProcessed: totalVideosProcessed,
					totalVideos: Number(playlistData.pageInfo.totalResults),
					currentPage,
				});
			}

			// Update page token for next iteration
			pageToken = playlistData.nextPageToken;

			// Add a small delay to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 100));
		} while (pageToken && currentPage < maxPages);

		return allVideoItems;
	} catch (error) {
		console.error("Error fetching videos:", error);
		return allVideoItems; // Return any videos we managed to fetch
	}
}

/**
 * Fetches initial batch of videos for a channel
 */
export async function fetchInitialVideos(
	channelId: string,
	uploadsPlaylistId: string,
) {
	return fetchChannelVideos(channelId, uploadsPlaylistId, {
		maxResults: 50,
		maxPages: 1,
	});
}

/**
 * Fetches channel data from YouTube API
 */
export async function fetchChannelData(channelId: string) {
	const response = await fetch(
		`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`,
	);

	if (!response.ok) {
		throw new Error(`YouTube API error: ${response.statusText}`);
	}

	const data = (await response.json()) as YouTubeChannelResponse;

	if (!data.items || data.items.length === 0) {
		throw new Error("Channel not found");
	}

	return data.items[0];
}
