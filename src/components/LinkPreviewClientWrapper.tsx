"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { LinkPreviewList } from "./LinkPreview";
import { Skeleton } from "./ui/skeleton";

interface LinkPreviewClientWrapperProps {
	urls: string[];
	podcastsLink?: string;
}

export function LinkPreviewClientWrapper({
	urls,
	podcastsLink,
}: LinkPreviewClientWrapperProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		// Reset states when URLs change
		setIsLoading(true);
		setHasError(false);

		// Simulate a quick load to avoid layout shift
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 500);

		return () => clearTimeout(timer);
	}, []);

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

	if (hasError) {
		return (
			<div className="text-sm text-muted-foreground">
				Unable to load link previews. You can still click the links in the
				description.
			</div>
		);
	}

	return <LinkPreviewList urls={urls} podcastsLink={podcastsLink} />;
}
