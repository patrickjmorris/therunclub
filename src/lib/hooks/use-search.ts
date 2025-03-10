"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDebounce } from "./use-debounce";
import { search } from "@/app/search/actions";
import type { SearchResult } from "@/lib/services/search-service";
import { toast } from "sonner";

interface UseSearchOptions {
	debounceMs?: number;
	initialQuery?: string;
	onError?: (error: Error) => void;
	updateUrl?: boolean;
}

export function useSearch({
	debounceMs = 300,
	initialQuery = "",
	onError,
	updateUrl = false,
}: UseSearchOptions = {}) {
	const [query, setQuery] = useState(initialQuery);
	const [results, setResults] = useState<SearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const debouncedQuery = useDebounce(query, debounceMs);

	// Keep track of the latest search to avoid race conditions
	const latestSearchRef = useRef<string>("");

	const performSearch = useCallback(
		async (searchQuery: string) => {
			if (!searchQuery.trim()) {
				setResults([]);
				return;
			}

			// Store this search query as the latest one
			latestSearchRef.current = searchQuery;

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

				setResults(response.results ?? []);
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
		[onError],
	);

	// Trigger search when debounced query changes
	useEffect(() => {
		performSearch(debouncedQuery);
	}, [debouncedQuery, performSearch]);

	// Update URL if needed
	useEffect(() => {
		if (updateUrl && typeof window !== "undefined") {
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
	}, [debouncedQuery, updateUrl]);

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
