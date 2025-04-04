"use client";

import { ContentFilter } from "@/components/common/shared/content-filter";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface VideoFilterProps {
	tags: Array<{ tag: string; count: number }>;
	onLoadingChange?: (isLoading: boolean) => void;
}

export function VideoFilter({ tags, onLoadingChange }: VideoFilterProps) {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	// Handle loading state changes
	const handleLoadingChange = (loading: boolean) => {
		setIsLoading(loading);
		onLoadingChange?.(loading);
	};

	// Reset loading state when component unmounts or when navigation completes
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
			placeholder="Search videos (min. 3 characters)..."
			emptyTagsMessage="No video tags available"
			contentType="video"
			showSearch={false}
		/>
	);
}
