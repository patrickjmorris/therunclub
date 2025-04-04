"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

interface InfiniteScrollProps {
	children: React.ReactNode;
	hasMore: boolean;
	onLoadMore: () => Promise<void>;
}

export function InfiniteScroll({
	children,
	hasMore,
	onLoadMore,
}: InfiniteScrollProps) {
	const [isLoading, setIsLoading] = useState(false);
	const { ref, inView } = useInView({
		threshold: 0,
		rootMargin: "100px",
	});

	useEffect(() => {
		const loadMore = async () => {
			if (inView && hasMore && !isLoading) {
				setIsLoading(true);
				try {
					await onLoadMore();
				} finally {
					setIsLoading(false);
				}
			}
		};

		loadMore();
	}, [inView, hasMore, isLoading, onLoadMore]);

	return (
		<>
			{children}
			{(hasMore || isLoading) && (
				<div ref={ref} className="h-10 flex items-center justify-center">
					{isLoading && (
						<div className="text-muted-foreground">Loading more...</div>
					)}
				</div>
			)}
		</>
	);
}
