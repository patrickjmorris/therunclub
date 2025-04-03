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
 * Extract YouTube channel ID from various URL formats
 * Handles:
 * - Standard channel URLs: https://www.youtube.com/channel/UCXoMpqnWSU76E7D6XOgjTlw
 * - Custom URLs: https://www.youtube.com/c/ChannelName
 * - User URLs: https://www.youtube.com/user/UserName
 * - Handle URLs: https://www.youtube.com/@username
 *
 * @returns Channel ID if found, or the handle (with @) for custom handle URLs
 */
export function extractYouTubeChannelId(url: string): string | null {
	console.log("Extracting channel ID from:", url);
	console.log("URL type:", typeof url);
	console.log("URL length:", url.length);

	if (!url) {
		console.log("Empty URL provided");
		return null;
	}

	// Try to match standard channel ID format
	const channelRegex = /(?:youtube\.com\/(?:channel\/))([^\/\?\&]+)/i;
	const channelMatch = url.match(channelRegex);
	if (channelMatch?.[1]) {
		console.log("Matched standard channel format:", channelMatch[1]);
		return channelMatch[1];
	}

	// Match custom URL with /c/ format
	const customUrlRegex = /(?:youtube\.com\/c\/)([^\/\?\&]+)/i;
	const customMatch = url.match(customUrlRegex);
	if (customMatch?.[1]) {
		console.log("Matched custom URL format:", `c/${customMatch[1]}`);
		return `c/${customMatch[1]}`;
	}

	// Match user URL format
	const userRegex = /(?:youtube\.com\/user\/)([^\/\?\&]+)/i;
	const userMatch = url.match(userRegex);
	if (userMatch?.[1]) {
		console.log("Matched user URL format:", `user/${userMatch[1]}`);
		return `user/${userMatch[1]}`;
	}

	// Match handle format (@username) with more permissive pattern
	const handleRegex = /(?:youtube\.com\/@)([^\/\?\&]+)/i;

	// Test and log the match
	console.log("Testing handle regex on:", url);
	console.log("Handle regex pattern:", handleRegex.toString());

	const handleMatchTest = handleRegex.test(url);
	console.log("Handle regex test:", handleMatchTest);

	const handleMatch = url.match(handleRegex);
	console.log("Handle match result:", handleMatch);

	if (handleMatch?.[1]) {
		console.log("Matched handle URL format:", `@${handleMatch[1]}`);
		return `@${handleMatch[1]}`;
	}

	// Try a simpler approach for handle URLs
	if (url.includes("youtube.com/@")) {
		const parts = url.split("@");
		if (parts.length > 1) {
			const handle = parts[1].split(/[\/\?\&]/)[0]; // Split at first separator
			console.log("Extracted handle using string split:", `@${handle}`);
			return `@${handle}`;
		}
	}

	// If the input is already just a handle with @ prefix
	if (/^@[\w\-\.]+$/.test(url)) {
		console.log("Input is already a handle:", url);
		return url;
	}

	// If the input is already just a channel ID (e.g., UCXoMpqnWSU76E7D6XOgjTlw)
	if (/^UC[\w-]{21,22}$/.test(url)) {
		console.log("Input is already a channel ID:", url);
		return url;
	}

	console.log("No match found for URL:", url);
	return null;
}

/**
 * Fetches a YouTube channel by handle, custom URL, or channel ID
 * This is a more flexible version that can handle @username references
 */
export async function fetchChannelByIdentifier(identifier: string) {
	console.log("Fetching channel data for identifier:", identifier);

	// Check if we have a handle (starts with @)
	const isHandle = identifier.startsWith("@");
	const isCustomUrl = identifier.startsWith("c/");
	const isUserUrl = identifier.startsWith("user/");

	console.log("Identifier type:", { isHandle, isCustomUrl, isUserUrl });

	let apiUrl: URL;

	if (isHandle || isCustomUrl || isUserUrl) {
		// For handles and custom URLs, we need to use forHandle or forUsername parameter
		apiUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
		apiUrl.searchParams.append("part", "snippet,statistics,contentDetails");

		if (isHandle) {
			const handleValue = identifier.substring(1); // Remove the @ symbol
			console.log("Using forHandle parameter with value:", handleValue);
			apiUrl.searchParams.append("forHandle", handleValue);
		} else if (isCustomUrl) {
			const username = identifier.substring(2); // Remove the c/ prefix
			console.log("Using forUsername parameter with value:", username);
			apiUrl.searchParams.append("forUsername", username);
		} else if (isUserUrl) {
			const username = identifier.substring(5); // Remove the user/ prefix
			console.log("Using forUsername parameter with value:", username);
			apiUrl.searchParams.append("forUsername", username);
		}
	} else {
		// For regular channel IDs
		apiUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
		apiUrl.searchParams.append("part", "snippet,statistics,contentDetails");
		console.log("Using id parameter with value:", identifier);
		apiUrl.searchParams.append("id", identifier);
	}

	apiUrl.searchParams.append("key", process.env.YOUTUBE_API_KEY || "");

	console.log(
		"API URL (without key):",
		apiUrl.toString().replace(/key=[^&]+/, "key=REDACTED"),
	);

	try {
		const response = await fetch(apiUrl.toString());

		console.log("API response status:", response.status);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("YouTube API error response:", errorText);
			throw new Error(`YouTube API error: ${response.statusText}`);
		}

		const data = (await response.json()) as YouTubeChannelResponse;

		console.log("API response items count:", data.items?.length || 0);

		if (!data.items || data.items.length === 0) {
			console.log("No channel found for identifier:", identifier);
			throw new Error("Channel not found");
		}

		console.log("Channel found:", {
			id: data.items[0].id,
			title: data.items[0].snippet.title,
		});

		return data.items[0];
	} catch (error) {
		console.error("Error fetching channel:", error);
		return null;
	}
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
