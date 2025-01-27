"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { LinkPreview } from "./LinkPreview";
import { Skeleton } from "./ui/skeleton";
import type { OpenGraphData } from "@/lib/og";
import { fetchLinkPreviews } from "@/app/api/link-preview/actions";

interface PreviewResult {
	url: string;
	preview: {
		title?: string;
		description?: string;
		image?: string;
		url?: string;
	} | null;
	error: string | null;
}

interface LinkPreviewClientWrapperProps {
	urls: string[];
	podcastsLink?: string;
}

export function LinkPreviewClientWrapper({
	urls,
	podcastsLink,
}: LinkPreviewClientWrapperProps) {
	const [previews, setPreviews] = useState<PreviewResult[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;

		if (urls.length > 0) {
			setIsLoading(true);
			setError(null);

			// Use the server action without async/await
			fetchLinkPreviews(urls)
				.then((result) => {
					if (mounted) {
						setPreviews(result.previews);
						setIsLoading(false);
					}
				})
				.catch((err) => {
					if (mounted) {
						console.error("Error fetching link previews:", err);
						setError("Unable to load link previews");
						setIsLoading(false);
					}
				});
		} else {
			setIsLoading(false);
		}

		return () => {
			mounted = false;
		};
	}, [urls]);

	if (isLoading) {
		return (
			<div className="space-y-4">
				{[...Array(Math.min(urls.length, 3))].map((_, i) => (
					<div
						key={`skeleton-${urls[i]}-${i}`}
						className="flex items-start space-x-4"
					>
						<Skeleton className="h-24 w-24 rounded-lg" />
						<div className="space-y-2 flex-1">
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-sm text-muted-foreground">
				{error}. You can still click the links in the description.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{previews
				.filter(
					(
						result,
					): result is PreviewResult & {
						preview: NonNullable<PreviewResult["preview"]>;
					} => result.preview !== null && !result.error,
				)
				.map((result) => {
					const ogData: OpenGraphData = {
						title: result.preview.title || result.url,
						description: result.preview.description || "",
						image: result.preview.image || "",
						url: result.preview.url || result.url,
					};

					return (
						<LinkPreview key={result.url} url={result.url} ogData={ogData} />
					);
				})}
			{podcastsLink && (
				<div className="text-sm text-muted-foreground">
					<a
						href={podcastsLink}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-600 dark:text-blue-400 underline decoration-blue-600/30 dark:decoration-blue-400/30 hover:decoration-blue-600 dark:hover:decoration-blue-400 transition-colors"
					>
						View on podcast platform
					</a>
				</div>
			)}
		</div>
	);
}
