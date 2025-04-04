"use client";

import { useState } from "react";
import EpisodeEntry from "./EpisodeEntry";
import { InfiniteScroll } from "@/components/common/infinite-scroll";
import type { BasicEpisode } from "@/types/shared";

interface EpisodeListProps {
	initialEpisodes: BasicEpisode[];
	fetchMore: (page: number) => Promise<BasicEpisode[]>;
	hasMore: boolean;
}

export function EpisodeList({
	initialEpisodes,
	fetchMore,
	hasMore: initialHasMore,
}: EpisodeListProps) {
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
					<EpisodeEntry key={episode.episodeSlug} episode={episode} />
				))}
			</div>
		</InfiniteScroll>
	);
}
