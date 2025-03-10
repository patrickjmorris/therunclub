"use server";

import { globalSearch, SearchResult } from "@/lib/services/search-service";
import {
	createPodcastIndexClient,
	type PodcastSearchResult,
} from "@/lib/podcast-index";
import { unstable_cache } from "next/cache";

const podcastIndex = createPodcastIndexClient({
	key: process.env.PODCAST_INDEX_API_KEY || "",
	secret: process.env.PODCAST_INDEX_API_SECRET || "",
});

export type SearchError = {
	message: string;
	code: string;
};

export type SearchResponse = {
	results: SearchResult[];
	error?: SearchError;
};

function sanitizeQuery(query: string): string {
	// Remove special characters that might cause SQL injection or search errors
	return query.replace(/[^\w\s]/g, " ").trim();
}

// Server-side cache with longer TTL (10 minutes)
export const search = unstable_cache(
	async (query: string): Promise<SearchResponse> => {
		if (!query?.trim()) {
			return { results: [] };
		}

		try {
			// Sanitize the query before passing to search
			const sanitizedQuery = sanitizeQuery(query);
			if (!sanitizedQuery) {
				return {
					results: [],
					error: {
						message: "Please enter a valid search term",
						code: "INVALID_QUERY",
					},
				};
			}

			// Use the optimized globalSearch function with a limit of 10 results
			const results = await globalSearch(sanitizedQuery, 10);
			return { results };
		} catch (error) {
			console.error("Search error:", error);
			return {
				results: [],
				error: {
					message: "An error occurred while searching",
					code: "SEARCH_ERROR",
				},
			};
		}
	},
	["search-action"], // Cache key
	{ revalidate: 600 }, // 10 minutes TTL
);

export type PodcastSearchResponse = {
	results: PodcastSearchResult[];
	error?: SearchError;
};

// Server-side cache for podcast search
export const searchPodcasts = unstable_cache(
	async (query: string): Promise<PodcastSearchResponse> => {
		if (!query?.trim()) {
			return { results: [] };
		}

		try {
			const sanitizedQuery = sanitizeQuery(query);
			if (!sanitizedQuery) {
				return {
					results: [],
					error: {
						message: "Please enter a valid search term",
						code: "INVALID_QUERY",
					},
				};
			}

			const results = await podcastIndex.searchPodcasts(sanitizedQuery);
			return { results };
		} catch (error) {
			console.error("Podcast search error:", error);
			return {
				results: [],
				error: {
					message: "An error occurred while searching podcasts",
					code: "PODCAST_SEARCH_ERROR",
				},
			};
		}
	},
	["podcast-search-action"], // Cache key
	{ revalidate: 600 }, // 10 minutes TTL
);
