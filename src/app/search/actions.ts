"use server";

import { globalSearch, SearchResult } from "@/lib/services/search-service";
import {
  createPodcastIndexClient,
  type PodcastSearchResult,
} from "@/lib/podcast-index";

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

export async function search(query: string): Promise<SearchResponse> {
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

    const results = await globalSearch(sanitizedQuery);
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
}

export type PodcastSearchResponse = {
  results: PodcastSearchResult[];
  error?: SearchError;
};

export async function searchPodcasts(
  query: string
): Promise<PodcastSearchResponse> {
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
}
