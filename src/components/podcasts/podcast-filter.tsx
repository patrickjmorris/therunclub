"use client";

import { SearchBar } from "@/components/search/search-bar";
import { useQueryState } from "nuqs";

export function PodcastFilter() {
  const [query, setQuery] = useQueryState("q");

  return (
    <div className="space-y-4">
      <SearchBar
        placeholder="Search podcasts and episodes..."
        defaultValue={query ?? ""}
      />
    </div>
  );
}
