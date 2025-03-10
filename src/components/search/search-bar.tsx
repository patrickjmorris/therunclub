"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, X } from "lucide-react";

interface SearchBarProps {
	placeholder?: string;
	className?: string;
	onSearch?: (query: string) => void;
	defaultValue?: string;
	disableUrlUpdate?: boolean;
}

export function SearchBar({
	placeholder = "Search...",
	className = "",
	onSearch,
	defaultValue = "",
	disableUrlUpdate = false,
}: SearchBarProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [query, setQuery] = useState(
		defaultValue || searchParams?.get("q") || "",
	);
	const debouncedQuery = useDebounce(query, 300);

	const handleSearch = useCallback(
		(query: string) => {
			// Only update URL if not disabled
			if (!disableUrlUpdate) {
				const searchParams = new URLSearchParams(window.location.search);

				if (query) {
					searchParams.set("q", query);
				} else {
					searchParams.delete("q");
				}

				const newPath = searchParams.toString()
					? `${window.location.pathname}?${searchParams.toString()}`
					: window.location.pathname;

				// Only update if the path has changed
				if (newPath !== window.location.pathname + window.location.search) {
					router.push(newPath);
				}
			}

			onSearch?.(query);
		},
		[onSearch, router, disableUrlUpdate],
	);

	const handleClear = useCallback(() => {
		setQuery("");
		handleSearch("");
	}, [handleSearch]);

	// Only trigger search when debouncedQuery changes
	useEffect(() => {
		handleSearch(debouncedQuery);
	}, [debouncedQuery, handleSearch]);

	return (
		<div className={`relative ${className}`}>
			<SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="text"
				placeholder={placeholder}
				className="pl-10 pr-10"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
			/>
			{query && (
				<button
					type="button"
					onClick={handleClear}
					className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
				>
					<X className="h-4 w-4" />
				</button>
			)}
		</div>
	);
}
