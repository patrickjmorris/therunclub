"use client";

import { Button } from "@/components/ui/button";
import { useQueryState, parseAsString } from "nuqs";
import { SearchBar } from "@/components/search/search-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface VideoFilterProps {
	tags: Array<{ tag: string; count: number }>;
	onLoadingChange?: (isLoading: boolean) => void;
}

export function VideoFilter({ tags, onLoadingChange }: VideoFilterProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
	const [category, setCategory] = useQueryState(
		"category",
		parseAsString.withDefault(""),
	);
	const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

	const handleSearch = useCallback(
		async (searchQuery: string) => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}

			if (searchQuery === query) return;

			setIsLoading(true);
			onLoadingChange?.(true);

			searchTimeoutRef.current = setTimeout(async () => {
				if (searchQuery.length === 0 || searchQuery.length >= 3) {
					await setQuery(searchQuery || null);
					router.refresh();
				}
			}, 300);
		},
		[query, setQuery, router, onLoadingChange],
	);

	const handleCategoryClick = useCallback(
		async (value: string) => {
			setIsLoading(true);
			onLoadingChange?.(true);

			if (value === category) {
				await setCategory(null);
			} else if (category === null || value !== category) {
				await setCategory(value);
			}
			router.refresh();
		},
		[category, setCategory, router, onLoadingChange],
	);

	useEffect(() => {
		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, []);

	// Reset loading state when navigation is complete
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		return () => {
			setIsLoading(false);
			onLoadingChange?.(false);
		};
	}, [query, category, onLoadingChange]);

	return (
		<div className="space-y-4">
			<SearchBar
				placeholder="Search videos (min. 3 characters)..."
				defaultValue={query ?? ""}
				onSearch={handleSearch}
			/>
			<div className="flex flex-wrap gap-2">
				{tags.map(({ tag, count }) => (
					<Button
						key={tag}
						variant={category === tag ? "default" : "outline"}
						size="sm"
						onClick={() => handleCategoryClick(tag)}
						aria-pressed={category === tag}
						disabled={isLoading}
					>
						{tag.replace(/-/g, " ")} ({count})
					</Button>
				))}
			</div>
		</div>
	);
}
