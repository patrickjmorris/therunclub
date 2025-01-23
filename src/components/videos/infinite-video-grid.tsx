"use client";

import { useState } from "react";
import { VideoGrid } from "./video-grid";
import { InfiniteScroll } from "@/components/infinite-scroll";
import type { BasicVideo } from "@/types/shared";

interface InfiniteVideoGridProps {
	initialVideos: BasicVideo[];
	fetchMore: (page: number) => Promise<BasicVideo[]>;
	hasMore: boolean;
}

export function InfiniteVideoGrid({
	initialVideos,
	fetchMore,
	hasMore: initialHasMore,
}: InfiniteVideoGridProps) {
	const [videos, setVideos] = useState<BasicVideo[]>(initialVideos);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const [page, setPage] = useState(1);

	const loadMore = async () => {
		const nextPage = page + 1;
		const newVideos = await fetchMore(nextPage);

		setVideos((prev) => [...prev, ...newVideos]);
		setHasMore(newVideos.length === 12);
		setPage(nextPage);
	};

	return (
		<InfiniteScroll hasMore={hasMore} onLoadMore={loadMore}>
			<VideoGrid videos={videos} />
		</InfiniteScroll>
	);
}
