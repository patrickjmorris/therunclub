"use client";

import { useCallback } from "react";
import { SearchBar } from "./search-bar";
import { SearchResults } from "./search-results";
import { useSearch } from "@/lib/hooks/use-search";
import { useSearchParams } from "next/navigation";

export function GlobalSearch() {
	const searchParams = useSearchParams();
	const initialQuery = searchParams?.get("q") || "";

	const { query, results, isLoading, handleSearch } = useSearch({
		initialQuery,
		updateUrl: true,
		debounceMs: 300,
	});

	return (
		<div className="w-full max-w-2xl mx-auto space-y-4">
			<SearchBar
				placeholder="Search videos, podcasts, and more..."
				onSearch={handleSearch}
				defaultValue={query}
				className="w-full"
				disableUrlUpdate={true} // Disable URL updates in SearchBar since useSearch handles it
			/>
			<SearchResults results={results} isLoading={isLoading} />
		</div>
	);
}
