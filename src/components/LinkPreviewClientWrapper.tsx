"use client";

import * as React from "react";
import { use } from "react";
import { LinkPreview } from "./LinkPreview";
import { Skeleton } from "./ui/skeleton";
import type { OpenGraphData } from "@/lib/og";

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
	preloadedData: Promise<{ previews: PreviewResult[] }>;
}

function PreviewContent({ data }: { data: { previews: PreviewResult[] } }) {
	const validPreviews = data.previews.filter(
		(
			result,
		): result is PreviewResult & {
			preview: NonNullable<PreviewResult["preview"]>;
		} => result.preview !== null && !result.error,
	);

	return (
		<>
			{validPreviews.map((result) => {
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
		</>
	);
}

export function LinkPreviewClientWrapper({
	urls,
	podcastsLink,
	preloadedData,
}: LinkPreviewClientWrapperProps) {
	const data = use(preloadedData);

	return (
		<div className="space-y-4">
			<React.Suspense
				fallback={
					<div className="space-y-4">
						{[...Array(Math.min(urls.length, 3))].map((_, i) => (
							<div
								key={`skeleton-${
									// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
									i
								}`}
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
				}
			>
				<PreviewContent data={data} />
			</React.Suspense>
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
