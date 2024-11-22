import crypto from "crypto";

interface PodcastIndexConfig {
	key: string;
	secret: string;
	baseUrl?: string;
}

export interface PodcastSearchResult {
	id: number;
	title: string;
	url: string;
	description?: string;
	author?: string;
	image?: string;
	categories?: object;
}

interface PodcastIndexFeed {
	id: number;
	title: string;
	url: string;
	description?: string;
	author?: string;
	image?: string;
	categories?: object;
}

export interface PodcastHealthCheck {
	episodeCount: number;
	isDead: number;
	hasParseErrors: number;
}

interface PodcastIndexResponse {
	feeds: PodcastIndexFeed[];
}

interface PodcastByFeedResponse {
	status: boolean;
	feed: {
		id: number;
		url: string;
		title: string;
		description?: string;
		author?: string;
		episodeCount: number;
		dead: number;
		parseErrors: number;
	};
}

export function createPodcastIndexClient(config: PodcastIndexConfig) {
	const baseUrl = config.baseUrl || "https://api.podcastindex.org/api/1.0";

	function generateHeaders() {
		const timestamp = Math.floor(Date.now() / 1000);
		const authString = `${config.key}${config.secret}${timestamp}`;
		const hash = crypto.createHash("sha1").update(authString).digest("hex");
		// console.log("hash", hash);
		// console.log("timestamp", timestamp);
		// console.log("authString", authString);
		// console.log("config.key", config.key);
		// console.log("config.secret", config.secret);

		return {
			"User-Agent": "TheRunClub/1.0",
			"X-Auth-Date": timestamp.toString(),
			"X-Auth-Key": config.key,
			Authorization: hash,
		};
	}

	async function searchPodcasts(query: string): Promise<PodcastSearchResult[]> {
		const headers = generateHeaders();
		const response = await fetch(
			`${baseUrl}/search/byterm?q=${encodeURIComponent(query)}&max=150`,
			{ headers },
		);

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(
				`Podcast Index API error: ${response.status} - ${errorBody}`,
			);
		}

		const data = (await response.json()) as PodcastIndexResponse;
		return data.feeds.map((feed) => ({
			id: feed.id,
			title: feed.title,
			url: feed.url,
			description: feed.description,
			author: feed.author,
			image: feed.image,
			categories: feed.categories,
		}));
	}

	async function getPodcastByFeedUrl(
		feedUrl: string,
	): Promise<PodcastHealthCheck | null> {
		const headers = generateHeaders();
		const response = await fetch(
			`${baseUrl}/podcasts/byfeedurl?url=${encodeURIComponent(feedUrl)}`,
			{ headers },
		);

		if (!response.ok) {
			console.error(`Failed to check podcast health for ${feedUrl}`);
			return null;
		}

		const data = (await response.json()) as PodcastByFeedResponse;
		const feed = data.feed;

		if (feed.parseErrors === 0 && feed.dead === 0 && feed.episodeCount > 2) {
			return {
				episodeCount: feed.episodeCount,
				isDead: feed.dead,
				hasParseErrors: feed.parseErrors,
			};
		}

		console.log(`Podcast ${feedUrl} failed quality checks:`, {
			parseErrors: feed.parseErrors,
			dead: feed.dead,
			episodeCount: feed.episodeCount,
		});
		return null;
	}

	return {
		searchPodcasts,
		getPodcastByFeedUrl,
	};
}
