"use client";

import { Button } from "@/components/ui/button";
import { useQueryState } from "nuqs";
import { VIDEO_CATEGORIES } from "@/lib/youtube";
import { SearchBar } from "@/components/search/search-bar";

export function VideoFilter() {
	const [query, setQuery] = useQueryState("q");
	const [category, setCategory] = useQueryState("category");

	return (
		<div className="space-y-4">
			<SearchBar
				placeholder="Search videos..."
				defaultValue={query ?? ""}
			/>
			<div className="flex flex-wrap gap-2">
				{Object.entries(VIDEO_CATEGORIES).map(([key, value]) => (
					<Button
						key={key}
						variant={category === value ? "default" : "outline"}
						size="sm"
						onClick={() => setCategory(value)}
					>
						{key.toLowerCase().replace("_", " ")}
					</Button>
				))}
			</div>
		</div>
	);
}
