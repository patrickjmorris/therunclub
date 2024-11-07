const YOUTUBE_HOST = "https://youtube.googleapis.com";

interface ChannelStatistics {
	subscriberCount: string;
	videoCount: string;
	viewCount: string;
	hiddenSubscriberCount: boolean;
}

interface ChannelInfo {
	// Define the structure of channel info based on the YouTube API response
	kind: string;
	etag: string;
	pageInfo: {
		totalResults: number;
		resultsPerPage: number;
	};
	items: Array<{
		kind: string;
		etag: string;
		id: string;
		snippet: {
			title: string;
			description: string;
			customUrl: string;
			publishedAt: string;
			thumbnails: {
				[key: string]: {
					url: string;
					width: number;
					height: number;
				};
			};
			country?: string;
		};
		contentDetails: {
			relatedPlaylists: {
				uploads: string;
			};
		};
		statistics: ChannelStatistics;
	}>;
}

interface PlaylistItem {
	kind: string;
	etag: string;
	id: string;
	snippet: {
		publishedAt: string;
		channelId: string;
		title: string;
		description: string;
		thumbnails: {
			[key: string]: {
				url: string;
				width: number;
				height: number;
			};
		};
		channelTitle: string;
		playlistId: string;
		position: number;
		resourceId: {
			kind: string;
			videoId: string;
		};
	};
}

interface VideoStatistics {
	viewCount: string;
	likeCount: string;
	commentCount: string;
}

interface VideoInfo {
	// Define the structure of video info based on the YouTube API response
	kind: string;
	etag: string;
	items: Array<{
		kind: string;
		etag: string;
		id: string;
		snippet: {
			publishedAt: string;
			channelId: string;
			title: string;
			description: string;
			thumbnails: {
				[key: string]: {
					url: string;
					width: number;
					height: number;
				};
			};
			channelTitle: string;
			tags: string[];
			categoryId: string;
		};
		statistics: VideoStatistics;
	}>;
}

// Add error types
interface YouTubeAPIError {
	error: {
		code: number;
		message: string;
		errors: Array<{
			message: string;
			domain: string;
			reason: string;
		}>;
	};
}

// Add video category mapping
export const VIDEO_CATEGORIES = {
	RACE_RESULTS: "race-results",
	SHOE_REVIEWS: "shoe-reviews",
	TRAINING_TIPS: "training-tips",
	NUTRITION: "nutrition",
	INSPIRATION: "inspiration",
} as const;

// Add search functionality
export async function searchVideos(
	query: string,
	category?: keyof typeof VIDEO_CATEGORIES,
	maxResults = 10,
): Promise<VideoInfo | YouTubeAPIError> {
	try {
		const categoryQuery = category
			? `&videoCategoryId=${VIDEO_CATEGORIES[category]}`
			: "";
		const response = await fetch(
			`${YOUTUBE_HOST}/youtube/v3/search?part=snippet&q=${query}${categoryQuery}&type=video&maxResults=${maxResults}&key=${process.env.YOUTUBE_API_KEY}`,
		);

		if (!response.ok) {
			const error = await response.json();
			return error as YouTubeAPIError;
		}

		const data = await response.json();
		return data as VideoInfo;
	} catch (err) {
		console.error("Error searching videos:", err);
		throw new Error("Failed to search videos");
	}
}

// Add caching wrapper
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes
const cache = new Map<string, { data: unknown; timestamp: number }>();

function withCache<T>(key: string, fn: () => Promise<T>): Promise<T> {
	const cached = cache.get(key);
	if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
		return Promise.resolve(cached.data as T);
	}

	return fn().then((data) => {
		cache.set(key, { data, timestamp: Date.now() });
		return data;
	});
}

// Update getVideoInfo to use caching
export async function getVideoInfo(videoId: string): Promise<VideoInfo | null> {
	return withCache(`video:${videoId}`, async () => {
		try {
			const response = await fetch(
				`${YOUTUBE_HOST}/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`,
			);

			if (!response.ok) {
				throw new Error(`YouTube API error: ${response.statusText}`);
			}

			const data: VideoInfo = await response.json();

			return data;
		} catch (err) {
			console.error("Error fetching video info:", err);
			return null;
		}
	});
}

// Add batch video fetching
export async function getVideosInfo(videoIds: string[]): Promise<VideoInfo[]> {
	try {
		const response = await fetch(
			`${YOUTUBE_HOST}/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(
				",",
			)}&key=${process.env.YOUTUBE_API_KEY}`,
		);

		if (!response.ok) {
			throw new Error(`YouTube API error: ${response.statusText}`);
		}

		const data = await response.json();
		return data.items;
	} catch (err) {
		console.error("Error fetching videos info:", err);
		return [];
	}
}

// Add rate limiting helper
const RATE_LIMIT = 100; // Requests per day
let requestCount = 0;
const requestResetTime = Date.now() + 24 * 60 * 60 * 1000;

function checkRateLimit() {
	if (requestCount >= RATE_LIMIT) {
		throw new Error("YouTube API rate limit exceeded");
	}

	requestCount++;
}

export async function getChannelInfo(
	channelId: string,
): Promise<ChannelInfo | null> {
	try {
		const response = await fetch(
			`${YOUTUBE_HOST}/youtube/v3/channels?part=snippet,contentDetails,statistics&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`,
		);

		const data: ChannelInfo = await response.json();

		return data;
	} catch (err) {
		console.log(err);
	}

	return null;
}

export async function getAllPlaylistItems(
	playlistId: string,
): Promise<PlaylistItem[] | null> {
	try {
		const playlistItemsUrl = `${YOUTUBE_HOST}/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${process.env.YOUTUBE_API_KEY}`;
		let playlistItems: PlaylistItem[] = [];

		let response = await fetch(playlistItemsUrl);
		let data: { items: PlaylistItem[]; nextPageToken?: string } =
			await response.json();

		playlistItems = data.items;

		while (data.nextPageToken) {
			response = await fetch(
				`${playlistItemsUrl}&pageToken=${data.nextPageToken}`,
			);

			data = await response.json();

			playlistItems = playlistItems.concat(data.items);
		}

		return playlistItems;
	} catch (err) {
		console.log(err);
	}

	return null;
}

export async function getPlaylistItems(
	playlistId: string,
): Promise<PlaylistItem[] | null> {
	try {
		const response = await fetch(
			`${YOUTUBE_HOST}/youtube/v3/playlistItems?part=snippet&maxResults=5&playlistId=${playlistId}&key=${process.env.YOUTUBE_API_KEY}`,
		);

		const data: { items: PlaylistItem[] } = await response.json();

		const playlist5Items = data.items;

		return playlist5Items;
	} catch (err) {
		console.log(err);
	}

	return null;
}

export const CHANNELS: string[] = [
	"UC2-2J_y_jpOYz8Rld5C6C5w",
	"UCZPqG0yh_xPm2AyLjffbDvw",
	"UCJIo5flfEJKSQ79zINvqPQg",
	"UCjyDlyHPHLhcIT8ov53d5qg",
	"UCgAYWS3ldZMhsBpXi6kn2Yw",
	"UC6y_DbpezOinlzHv8O092zw",
	"UCpUtRsyAx5rluUDmF4k_gHw",
	"UC1Fp52XJH8UKaa_gHMZrckw",
	"UCNQaItQ0LLVu5987SD88s2w",
	"UCWPzT9H7dH5i7FaI9-BuUmA",
	"UCe43pe3w4L6w3tNMRkWiJBA",
	"UCX7MXflg3DxDJTZi5mJRiOw",
	"UCGMbTnk82pK0vmITB5LtiPw",
	"UCh8p7jHeMux6XnBRaqhlYWA",
	"UCcKqyeT52O1XUHaHeSRt7kw",
	"UC3vFznWAkGITMT2clmgwOaA",
	"UCJTTFnzwO5qUUCPkIX_nRow",
	"UCeSHo5kTvzoik4STh7MuMCA",
	"UCCU2xPv2G9Jw5Qg4jMSx1Wg",
	"UCOBM9FasII4dKbyE_HKkbjw",
	"UCo5TE6wpU50kREWVbRdKnOQ",
	"UCQk7fWv15ChjMJLCRVmtApw",
	"UCAbGmxSxIw-JS9RumJkKQhw",
	"UC_d8BpVEAevlcHBoyqj6N8Q",
	"UC0PgYMqwlmR_4S73M8tu0lA",
	"UC2xCiwFqaYTmweSJ7p2UzcA",
	"UC6ExRKJw1olM9Z_Vd0ceTbA",
	"UCa2vGJcdOPwY0vIJR346eIw",
	"UCbeZCF2JP03CT_24UtU0q0Q",
	"UCc6gzn4es_HE0RgcHEcf63Q",
	"UCcPagJur6wcbV5kej6mwG_A",
	"UCFe2g1SrVD7OEzlsta23X7g",
	"UCFjeE9rU50uZFJbfWxPKcGw",
	"UCFYpwqeNXx7M9xosFjdm5kQ",
	"UCh_w_vLvlZNBeTAP8qaWhoA",
	"UCharhoGUUajCcKgKD05ZFDg",
	"UCJ9i30yMclSeBacaB9Jd0eg",
	"UCjleCUWE3llQSGBrBNkcM-Q",
	"UCjlFx_DlmMcNSD5bE2WRY4w",
	"UCJumOlRn9C592ijW9sUC2Hg",
	"UCkV0HYbZk55q1kLNhQ8tMQg",
	"UCKznTh94zhbKkeRf1hxBrfA",
	"UCMM4CgGZeqFGXyfHjvPhklA",
	"UCmNQyHOOP_34Grcp8_KbLvQ",
	"UCn67RpOfpZk0a8ZPpBNgMsg",
	"UCnI3TuOg8D3SCRPW8ET4EAg",
	"UCNKMpnM_Yvf6E-Hhf9btYqA",
	"UCnpMw-hkLCWeYDnQZw5mluQ",
	"UCp21zu_8Hd0w9HULooemRCA",
	"UCpg3mLzl274F5LaOx99N0Zw",
	"UCpmI8opIXGIODYql3ClvxYQ",
	"UCshUvA06neNd-xPg7k5EXAQ",
	"UCTVjyeSlm3sR3N1fx-NI-Kw",
	"UCTxG34nhYtkLW8jh2Su9Y7w",
	"UCu8hTm_tO4Z9TITnbW6zfTA",
	"UCUwGYfvGvmqMnvQTOY8E_qg",
	"UCX7dV4OPDSutwMUauSD5AAA",
	"UCXVX_0ukCPMLPWk64KYnHFA",
	"UCScHdYFS_KBduqkRBjbQNuA",
	"UC4B2YgFex2nERrQDuuCR0Zw",
	"UCRnD_B4xWEBivdTS4IR3Owg",
	"UCx2Xqm8S3Ghqn5puhSKWH4Q",
	"UCSxqXJj9btSS3nrmBg8GXdQ",
	"UCjGZ6D8hJFvLur5K_p9vKAA",
	"UCX5I2Z6pgDyfaBwSaF9dRUg",
];
