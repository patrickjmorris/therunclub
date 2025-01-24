"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getOpenGraphData } from "@/lib/og";
import type { OpenGraphData } from "@/lib/og";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Suspense } from "react";
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

function LinkPreviewSkeleton() {
	return (
		<div className="flex gap-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
			<div className="h-24 w-24 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800" />
			<div className="flex min-w-0 flex-col justify-center gap-2">
				<div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
				<div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
				<div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
			</div>
		</div>
	);
}

interface LinkPreviewListProps {
	urls: string[];
	podcastsLink?: string;
}

export function LinkPreviewList({ urls, podcastsLink }: LinkPreviewListProps) {
	const [previews, setPreviews] = useState<Record<string, OpenGraphData>>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchPreviews() {
			setLoading(true);
			const newPreviews: Record<string, OpenGraphData> = {};

			for (const url of urls) {
				try {
					const response = await fetch(
						`/api/og?url=${encodeURIComponent(url)}`,
					);
					const data = await response.json();
					newPreviews[url] = data;
				} catch (error) {
					console.error(`Error fetching preview for ${url}:`, error);
				}
			}

			setPreviews(newPreviews);
			setLoading(false);
		}

		if (urls.length > 0) {
			fetchPreviews();
		} else {
			setLoading(false);
		}
	}, [urls]);

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
			{urls.map((url) => {
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
