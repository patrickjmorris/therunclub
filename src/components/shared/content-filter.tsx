"use client";

import { Button } from "@/components/ui/button";
import { useQueryState, parseAsString } from "nuqs";
import { SearchBar } from "@/components/search/search-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDebounce } from "@/lib/hooks/use-debounce";

interface ContentFilterProps {
	tags: Array<{ tag: string; count: number }>;
	onLoadingChange?: (isLoading: boolean) => void;
	placeholder?: string;
	emptyTagsMessage?: string;
	contentType?: "podcast" | "video";
	showSearch?: boolean;
}

export function ContentFilter({
	tags = [],
	onLoadingChange,
	placeholder = "Search content (min. 3 characters)...",
	emptyTagsMessage = "No tags available",
	contentType,
	showSearch,
}: ContentFilterProps) {
	const router = useRouter();
	const pathname = usePathname();
	const [isLoading, setIsLoading] = useState(false);
	const [category, setCategory] = useQueryState(
		"category",
		parseAsString.withDefault(""),
	);
	const [searchQuery, setSearchQuery] = useQueryState(
		"q",
		parseAsString.withDefault(""),
	);
	const [localQuery, setLocalQuery] = useState(searchQuery || "");
	const debouncedQuery = useDebounce(localQuery, 500);
	const resetLoadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	// Determine content type based on pathname if not explicitly provided
	const determinedContentType =
		contentType ||
		(pathname?.includes("/podcast")
			? "podcast"
			: pathname?.includes("/video")
			  ? "video"
			  : undefined);

	// Determine if search should be shown
	const shouldShowSearch =
		showSearch !== undefined ? showSearch : determinedContentType !== "podcast"; // Default: show search for everything except podcasts

	// Helper function to reset loading state with a small delay
	const resetLoadingWithDelay = useCallback(
		(delay = 300) => {
			if (resetLoadingTimeoutRef.current) {
				clearTimeout(resetLoadingTimeoutRef.current);
			}

			resetLoadingTimeoutRef.current = setTimeout(() => {
				setIsLoading(false);
				onLoadingChange?.(false);
			}, delay);
		},
		[onLoadingChange],
	);

	// Update the query parameter when the debounced query changes
	useEffect(() => {
		const updateQuery = async () => {
			// Only update if the query is empty or at least 3 characters
			if (
				debouncedQuery !== searchQuery &&
				(debouncedQuery.length === 0 || debouncedQuery.length >= 3)
			) {
				setIsLoading(true);
				onLoadingChange?.(true);
				await setSearchQuery(debouncedQuery || null);
				router.refresh();
				resetLoadingWithDelay();
			}
		};

		updateQuery();
	}, [
		debouncedQuery,
		searchQuery,
		setSearchQuery,
		router,
		onLoadingChange,
		resetLoadingWithDelay,
	]);

	const handleSearch = useCallback((newQuery: string) => {
		setLocalQuery(newQuery);
	}, []);

	const handleCategoryClick = useCallback(
		async (value: string) => {
			// For category clicks, we can set loading immediately
			setIsLoading(true);
			onLoadingChange?.(true);

			if (value === category) {
				await setCategory(null);
			} else if (category === null || value !== category) {
				await setCategory(value);
			}
			router.refresh();

			// Reset loading state after a short delay to allow the UI to update
			resetLoadingWithDelay();
		},
		[category, setCategory, router, onLoadingChange, resetLoadingWithDelay],
	);

	// Clean up timeouts when component unmounts
	useEffect(() => {
		return () => {
			if (resetLoadingTimeoutRef.current) {
				clearTimeout(resetLoadingTimeoutRef.current);
			}

			// Reset loading state on unmount
			setIsLoading(false);
			onLoadingChange?.(false);
		};
	}, [onLoadingChange]);

	// Generate appropriate placeholder based on content type
	const getPlaceholder = () => {
		if (placeholder !== "Search content (min. 3 characters)...") {
			return placeholder;
		}

		switch (determinedContentType) {
			case "podcast":
				return "Search podcasts & episodes (min. 3 characters)...";
			case "video":
				return "Search videos (min. 3 characters)...";
			default:
				return "Search content (min. 3 characters)...";
		}
	};

	return (
		<div className="space-y-4">
			{shouldShowSearch && (
				<div className="flex items-center gap-2">
					<div className="flex-1">
						<SearchBar
							placeholder={getPlaceholder()}
							defaultValue={searchQuery ?? ""}
							onSearch={handleSearch}
							disableUrlUpdate={true} // We'll handle URL updates ourselves
						/>
					</div>
				</div>
			)}
			{tags.length > 0 ? (
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
			) : (
				<p className="text-sm text-muted-foreground">{emptyTagsMessage}</p>
			)}
		</div>
	);
}
