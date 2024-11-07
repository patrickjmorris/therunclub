"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useQueryState } from "nuqs";
import { VIDEO_CATEGORIES } from "@/lib/youtube";

export function VideoFilter() {
	const [query, setQuery] = useQueryState("q");
	const [category, setCategory] = useQueryState("category");

	return (
		<div className="space-y-4">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search videos..."
					className="pl-10"
					onChange={(e) => setQuery(e.target.value)}
					value={query ?? ""}
				/>
			</div>
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
