"use client";

import { useCallback, useState } from "react";
import { SearchBar } from "./search-bar";
import { SearchResults } from "./search-results";
import type { SearchResult } from "@/lib/services/search-service";

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
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data.results ?? []);
    } catch (error) {
      console.error("Search failed:", error);
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
