

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
