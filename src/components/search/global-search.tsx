"use client";

import { useCallback, useState } from "react";
import { SearchBar } from "./search-bar";
import { SearchResults } from "./search-results";
import type { SearchResult } from "@/lib/services/search-service";
import { search } from "@/app/search/actions";
import type { SearchError } from "@/app/search/actions";
import { toast } from "sonner";

export function GlobalSearch() {
	const [results, setResults] = useState<SearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const handleSearch = useCallback(async (query: string) => {
		if (!query.trim()) {
			setResults([]);
			return;
		}

		setIsLoading(true);
		try {
			const response = await search(query);

			if (response.error) {
				toast.error(response.error.message);
				setResults([]);
				return;
			}

			setResults(response.results ?? []);
		} catch (error) {
			console.error("Search failed:", error);
			toast.error("An unexpected error occurred. Please try again.");
			setResults([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	return (
		<div className="w-full max-w-2xl mx-auto space-y-4">
			<SearchBar
				placeholder="Search videos, podcasts, and more..."
				onSearch={handleSearch}
				className="w-full"
			/>
			<SearchResults results={results} isLoading={isLoading} />
		</div>
	);
}
