"use client";

import { useState } from "react";
import { InfiniteScroll } from "@/components/common/infinite-scroll";
import type { BasicEpisode } from "@/types/shared";
import dynamic from "next/dynamic";

// Dynamically import EpisodeEntry to reduce initial bundle size
const DynamicEpisodeEntry = dynamic(
	() => import("./EpisodeEntry").then((mod) => ({ default: mod.default })),
	{
		loading: () => (
			<div className="animate-pulse">
				<div className="h-32 bg-muted rounded-lg my-4" />
			</div>
		),
		ssr: false,
	},
);

interface DynamicEpisodeListProps {
	initialEpisodes: BasicEpisode[];
	fetchMore: (page: number) => Promise<BasicEpisode[]>;
	hasMore: boolean;
}

export function DynamicEpisodeList({
	initialEpisodes,
	fetchMore,
	hasMore: initialHasMore,
}: DynamicEpisodeListProps) {
	const [episodes, setEpisodes] = useState<BasicEpisode[]>(initialEpisodes);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const [page, setPage] = useState(1);

	const loadMore = async () => {
		const nextPage = page + 1;
		const newEpisodes = await fetchMore(nextPage);

		setEpisodes((prev) => [...prev, ...newEpisodes]);
		setHasMore(newEpisodes.length === 10);
		setPage(nextPage);
	};

	return (
		<InfiniteScroll hasMore={hasMore} onLoadMore={loadMore}>
			<div className="divide-y divide-slate-100 dark:divide-slate-800 sm:mt-4 lg:mt-8 lg:border-t lg:border-slate-100 dark:lg:border-slate-800">
				{episodes.map((episode) => (
					<DynamicEpisodeEntry
						key={episode.episodeSlug}
						episode={episode}
						showContentBadge={false}
					/>
				))}
			</div>
		</InfiniteScroll>
	);
}
