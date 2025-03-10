"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useDebounce } from "./use-debounce";
import { search } from "@/app/search/actions";
import type { SearchResult } from "@/lib/services/search-service";
import { toast } from "sonner";

interface UseSearchOptions {
	debounceMs?: number;
	initialQuery?: string;
	onError?: (error: Error) => void;
	updateUrl?: boolean;
	minQueryLength?: number;
}

// Simple client-side cache for search results
const searchCache = new Map<
	string,
	{ results: SearchResult[]; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Clear expired cache entries
function cleanupCache() {
	const now = Date.now();
	for (const [key, value] of searchCache.entries()) {
		if (now - value.timestamp > CACHE_TTL) {
			searchCache.delete(key);
		}
	}
}

export function useSearch({
	debounceMs = 300,
	initialQuery = "",
	onError,
	updateUrl = false,
	minQueryLength = 2,
}: UseSearchOptions = {}) {
	const [query, setQuery] = useState(initialQuery);
	const [results, setResults] = useState<SearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const debouncedQuery = useDebounce(query, debounceMs);

	// Keep track of the latest search to avoid race conditions
	const latestSearchRef = useRef<string>("");

	// Clean up cache periodically
	useEffect(() => {
		const interval = setInterval(cleanupCache, CACHE_TTL);
		return () => clearInterval(interval);
	}, []);

	const performSearch = useCallback(
		async (searchQuery: string) => {
			// Don't search if query is too short
			if (!searchQuery.trim() || searchQuery.trim().length < minQueryLength) {
				setResults([]);
				return;
			}

			// Store this search query as the latest one
			latestSearchRef.current = searchQuery;

			// Check cache first
			const cacheKey = searchQuery.trim().toLowerCase();
			const cachedResult = searchCache.get(cacheKey);

			if (cachedResult) {
				setResults(cachedResult.results);
				return;
			}

			setIsLoading(true);
			try {
				const response = await search(searchQuery);

				// Only update results if this is still the latest search
				if (latestSearchRef.current !== searchQuery) {
					return;
				}

				if (response.error) {
					toast.error(response.error.message);
					setResults([]);
					onError?.(new Error(response.error.message));
					return;
				}

				const searchResults = response.results ?? [];
				setResults(searchResults);

				// Cache the results
				searchCache.set(cacheKey, {
					results: searchResults,
					timestamp: Date.now(),
				});
			} catch (error) {
				// Only update state if this is still the latest search
				if (latestSearchRef.current !== searchQuery) {
					return;
				}

				console.error("Search failed:", error);
				toast.error("An unexpected error occurred. Please try again.");
				setResults([]);
				onError?.(
					error instanceof Error ? error : new Error("Unknown search error"),
				);
			} finally {
				// Only update loading state if this is still the latest search
				if (latestSearchRef.current === searchQuery) {
					setIsLoading(false);
				}
			}
		},
		[onError, minQueryLength],
	);

	// Trigger search when debounced query changes
	useEffect(() => {
		performSearch(debouncedQuery);
	}, [debouncedQuery, performSearch]);

	// Update URL if needed
	useEffect(() => {
		if (
			updateUrl &&
			typeof window !== "undefined" &&
			debouncedQuery.trim().length >= minQueryLength
		) {
			const searchParams = new URLSearchParams(window.location.search);

			if (debouncedQuery) {
				searchParams.set("q", debouncedQuery);
			} else {
				searchParams.delete("q");
			}

			const newPath = searchParams.toString()
				? `${window.location.pathname}?${searchParams.toString()}`
				: window.location.pathname;

			// Only update if the path has changed
			if (newPath !== window.location.pathname + window.location.search) {
				window.history.pushState({}, "", newPath);
			}
		}
	}, [debouncedQuery, updateUrl, minQueryLength]);

	const handleSearch = useCallback((newQuery: string) => {
		setQuery(newQuery);
	}, []);

	const clearSearch = useCallback(() => {
		setQuery("");
		setResults([]);
	}, []);

	return {
		query,
		results,
		isLoading,
		handleSearch,
		clearSearch,
		setQuery,
	};
}
