"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getOpenGraphData } from "@/lib/og";
import type { OpenGraphData } from "@/lib/og";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Link2 } from "lucide-react";

interface LinkPreviewProps {
	url: string;
	className?: string;
	ogData?: OpenGraphData;
}

export async function LinkPreview({
	url,
	className,
	ogData: preloadedData,
}: LinkPreviewProps) {
	const ogData = preloadedData || (await getOpenGraphData(url));

	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className={cn(
				"group flex gap-4 rounded-lg border border-neutral-200 bg-white p-4 no-underline transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700",
				className,
			)}
		>
			<div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md">
				{ogData.image ? (
					<Image
						src={ogData.image}
						alt={ogData.title}
						className="object-cover"
						fill
						sizes="96px"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800">
						<Link2 className="h-8 w-8 text-neutral-400 dark:text-neutral-600 -rotate-45" />
					</div>
				)}
			</div>
			<div className="flex min-w-0 flex-col justify-center gap-1">
				<p className="truncate font-medium text-neutral-900 group-hover:text-neutral-600 dark:text-neutral-100 dark:group-hover:text-neutral-400">
					{ogData.title}
				</p>
				{ogData.description && (
					<p className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
						{ogData.description}
					</p>
				)}
				<p className="truncate text-sm text-neutral-500 dark:text-neutral-500">
					{url}
				</p>
			</div>
		</a>
	);
}

interface LinkPreviewListProps {
	urls: string[];
	podcastsLink?: string;
	preloadedData?: Record<string, OpenGraphData>;
}

export function LinkPreviewList({
	urls,
	podcastsLink,
	preloadedData = {},
}: LinkPreviewListProps) {
	// Limit URLs to first 10
	const limitedUrls = urls.slice(0, 10);
	const [previews, setPreviews] =
		useState<Record<string, OpenGraphData>>(preloadedData);
	const [loading, setLoading] = useState(!Object.keys(preloadedData).length);
	const urlsRef = useRef(limitedUrls);
	urlsRef.current = limitedUrls;

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		async function fetchPreviews() {
			const currentUrls = urlsRef.current;
			// Only fetch data for URLs that don't have preloaded data
			const urlsToFetch = currentUrls.filter((url) => !preloadedData[url]);

			if (urlsToFetch.length === 0) {
				setLoading(false);
				return;
			}

			setLoading(true);

			for (const url of urlsToFetch) {
				try {
					const response = await fetch(
						`/api/og?url=${encodeURIComponent(url)}`,
					);
					const data = await response.json();
					setPreviews((prev) => ({ ...prev, [url]: data }));
				} catch (error) {
					console.error(`Error fetching preview for ${url}:`, error);
				}
			}

			setLoading(false);
		}

		fetchPreviews();
	}, []); // Empty dependency array since we're using ref

	if (loading) {
		return (
			<div className="space-y-4">
				{[...Array(Math.min(urls.length, 3))].map((_, i) => (
					<Card key={`skeleton-${urls[i] || i}`}>
						<CardContent className="p-4">
							<div className="flex gap-4">
								<Skeleton className="h-24 w-24 rounded-lg" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-4 w-1/2" />
									<Skeleton className="h-4 w-full" />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{limitedUrls.map((url) => {
				const preview = previews[url];
				if (!preview) return null;

				return (
					<Card key={url}>
						<CardContent className="p-4">
							<a
								href={url}
								target="_blank"
								rel="noopener noreferrer"
								className="flex gap-4 hover:opacity-80 transition-opacity"
							>
								{preview.image && (
									<div className="relative h-24 w-24 flex-shrink-0">
										<img
											src={preview.image}
											alt={preview.title || "Link preview"}
											className="h-full w-full object-cover rounded-lg"
										/>
									</div>
								)}
								<div className="flex-1 min-w-0">
									<h3 className="font-medium line-clamp-1">{preview.title}</h3>
									{preview.description && (
										<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
											{preview.description}
										</p>
									)}
									<p className="text-sm text-muted-foreground mt-1 truncate">
										{new URL(url).hostname}
									</p>
								</div>
							</a>
						</CardContent>
					</Card>
				);
			})}
			{urls.length > 10 && (
				<p className="text-sm text-muted-foreground">
					Showing first 10 links of {urls.length} total
				</p>
			)}
			{podcastsLink && (
				<p className="text-sm text-muted-foreground">
					<a
						href={podcastsLink}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-600 dark:text-blue-400 underline decoration-blue-600/30 dark:decoration-blue-400/30 hover:decoration-blue-600 dark:hover:decoration-blue-400 transition-colors"
					>
						View episode on podcast website
					</a>
				</p>
			)}
		</div>
	);
}
