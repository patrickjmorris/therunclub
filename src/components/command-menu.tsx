"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type DialogProps } from "@radix-ui/react-dialog";
import {
	CircleIcon,
	FileIcon,
	LaptopIcon,
	MoonIcon,
	SunIcon,
	VideoIcon,
	SpeakerLoudIcon,
} from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { useState, useCallback, useEffect } from "react";

import { docsConfig } from "@/config/docs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { search } from "@/app/search/actions";
import type { SearchResult } from "@/lib/services/search-service";

export function CommandMenu({ ...props }: DialogProps) {
	const router = useRouter();
	const [open, setOpen] = React.useState(false);
	const { setTheme } = useTheme();
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
				if (
					(e.target instanceof HTMLElement && e.target.isContentEditable) ||
					e.target instanceof HTMLInputElement ||
					e.target instanceof HTMLTextAreaElement ||
					e.target instanceof HTMLSelectElement
				) {
					return;
				}

				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const handleSearch = useCallback(async (value: string) => {
		setSearchQuery(value);
		if (!value.trim()) {
			setSearchResults([]);
			return;
		}

		setIsSearching(true);
		try {
			const { results, error } = await search(value);
			if (error) {
				console.error("Search error:", error);
				return;
			}
			setSearchResults(results);
		} catch (error) {
			console.error("Failed to search:", error);
		} finally {
			setIsSearching(false);
		}
	}, []);

	const runCommand = React.useCallback((command: () => unknown) => {
		setOpen(false);
		command();
	}, []);

	const getIconForResult = (type: string) => {
		switch (type) {
			case "video":
				return <VideoIcon className="mr-2 h-4 w-4" />;
			case "podcast":
				return <SpeakerLoudIcon className="mr-2 h-4 w-4" />;
			case "episode":
				return <SpeakerLoudIcon className="mr-2 h-4 w-4" />;
			default:
				return <FileIcon className="mr-2 h-4 w-4" />;
		}
	};

	return (
		<>
			<Button
				variant="outline"
				className={cn(
					"relative h-8 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64",
				)}
				onClick={() => setOpen(true)}
				{...props}
			>
				<span className="hidden lg:inline-flex">Search the site...</span>
				<span className="inline-flex lg:hidden">Search...</span>
				<kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
					<span className="text-xs">⌘</span>K
				</kbd>
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<CommandInput
					placeholder="Search videos, podcasts, episodes..."
					value={searchQuery}
					onValueChange={handleSearch}
				/>
				<CommandList>
					{isSearching ? (
						<CommandEmpty>Loading...</CommandEmpty>
					) : searchQuery && !searchResults.length ? (
						<CommandEmpty>No results found.</CommandEmpty>
					) : (
						<>
							{searchResults.length > 0 && (
								<CommandGroup heading="Search Results">
									{searchResults.map((result) => (
										<CommandItem
											key={`${result.type}-${result.id}`}
											value={result.title}
											onSelect={() => {
												runCommand(() => router.push(result.url));
											}}
										>
											{getIconForResult(result.type)}
											<div className="flex flex-col">
												<span>{result.title}</span>
												{result.description && (
													<span className="text-xs text-muted-foreground line-clamp-1">
														{result.description}
													</span>
												)}
											</div>
										</CommandItem>
									))}
								</CommandGroup>
							)}

							{!searchQuery && (
								<>
									<CommandGroup heading="Links">
										{docsConfig.mainNav
											.filter((navitem) => !navitem.external)
											.map((navItem) => (
												<CommandItem
													key={navItem.href}
													value={navItem.title}
													onSelect={() => {
														runCommand(() =>
															router.push(navItem.href as string),
														);
													}}
												>
													<FileIcon className="mr-2 h-4 w-4" />
													{navItem.title}
												</CommandItem>
											))}
									</CommandGroup>

									<CommandSeparator />
									<CommandGroup heading="Theme">
										<CommandItem
											onSelect={() => runCommand(() => setTheme("light"))}
										>
											<SunIcon className="mr-2 h-4 w-4" />
											Light
										</CommandItem>
										<CommandItem
											onSelect={() => runCommand(() => setTheme("dark"))}
										>
											<MoonIcon className="mr-2 h-4 w-4" />
											Dark
										</CommandItem>
										<CommandItem
											onSelect={() => runCommand(() => setTheme("system"))}
										>
											<LaptopIcon className="mr-2 h-4 w-4" />
											System
										</CommandItem>
									</CommandGroup>
								</>
							)}
						</>
					)}
				</CommandList>
			</CommandDialog>
		</>
	);
}
