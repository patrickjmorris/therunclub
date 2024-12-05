"use client";

import { useCallback, useState } from "react";
import { SearchBar } from "./search-bar";
import { SearchResults } from "./search-results";
import type { SearchResult } from "@/lib/services/search-service";
import { search } from "@/app/actions";
import type { SearchError } from "@/app/actions";
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
		<div className="w-full max-w-3xl mx-auto space-y-6">
			<div className="text-center space-y-4">
				<h2 className="text-2xl font-bold tracking-tight">
					Find Your Next Running Adventure
				</h2>
				<p className="text-muted-foreground">
					Search across videos, podcasts, and training content
				</p>
			</div>
			<div className="relative">
				<div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl blur-xl" />
				<SearchBar
					placeholder="Try 'marathon training' or 'running form'..."
					onSearch={handleSearch}
					className="w-full relative bg-background/95 shadow-xl hover:shadow-2xl transition-shadow"
				/>
			</div>
			<SearchResults results={results} isLoading={isLoading} />
		</div>
	);
}
