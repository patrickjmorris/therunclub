"use client";

import { ContentFilter } from "@/components/common/shared/content-filter";
import { useState, useEffect } from "react";

interface PodcastFilterProps {
	tags?: Array<{ tag: string; count: number }>;
	onLoadingChange?: (isLoading: boolean) => void;
}

export function PodcastFilter({
	tags = [],
	onLoadingChange,
}: PodcastFilterProps) {
	const [isLoading, setIsLoading] = useState(false);

	// Handle loading state changes
	const handleLoadingChange = (loading: boolean) => {
		setIsLoading(loading);
		onLoadingChange?.(loading);
	};

	// Reset loading state when component unmounts
	useEffect(() => {
		return () => {
			setIsLoading(false);
			onLoadingChange?.(false);
		};
	}, [onLoadingChange]);

	return (
		<ContentFilter
			tags={tags}
			onLoadingChange={handleLoadingChange}
			placeholder="Search podcasts & episodes (min. 3 characters)..."
			emptyTagsMessage="No podcast tags available"
			contentType="podcast"
			showSearch={false}
		/>
	);
}
