"use client";

import { Button } from "@/components/ui/button";
import { useQueryState, parseAsString } from "nuqs";
import { VIDEO_CATEGORIES } from "@/lib/youtube";
import { SearchBar } from "@/components/search/search-bar";
import { useCallback, useEffect, useRef } from "react";

export function VideoFilter() {
	const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
	const [category, setCategory] = useQueryState(
		"category",
		parseAsString.withDefault(""),
	);
	const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

	const handleSearch = useCallback(
		async (searchQuery: string) => {
			// Clear any existing timeout
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}

			// Don't search if query is the same
			if (searchQuery === query) return;

			// Set a new timeout for debouncing
			searchTimeoutRef.current = setTimeout(async () => {
				// Only update if the query is at least 3 characters or empty
				if (searchQuery.length === 0 || searchQuery.length >= 3) {
					await setQuery(searchQuery || null);
				}
			}, 300); // 300ms debounce delay
		},
		[query, setQuery],
	);

	const handleCategoryClick = useCallback(
		async (value: string) => {
			if (value === category) {
				await setCategory(null);
			} else if (category === null || value !== category) {
				await setCategory(value);
			}
		},
		[category, setCategory],
	);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, []);

	return (
		<div className="space-y-4">
			<SearchBar
				placeholder="Search videos (min. 3 characters)..."
				defaultValue={query ?? ""}
				onSearch={handleSearch}
			/>
			<div className="flex flex-wrap gap-2">
				{Object.entries(VIDEO_CATEGORIES).map(([key, value]) => (
					<Button
						key={key}
						variant={category === value ? "default" : "outline"}
						size="sm"
						onClick={() => handleCategoryClick(value)}
						aria-pressed={category === value}
					>
						{key.toLowerCase().replace("_", " ")}
					</Button>
				))}
			</div>
		</div>
	);
}
