"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";

interface FeaturedPodcast {
	id: string;
	title: string;
	image: string | null;
	podcastSlug: string | null;
}

interface FeaturedPodcastsRowProps {
	podcasts: FeaturedPodcast[];
}

export function FeaturedPodcastsRow({ podcasts }: FeaturedPodcastsRowProps) {
	const [showLeftArrow, setShowLeftArrow] = useState(false);
	const [showRightArrow, setShowRightArrow] = useState(true);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const handleScroll = () => {
			setShowLeftArrow(container.scrollLeft > 0);
			setShowRightArrow(
				container.scrollLeft <
					container.scrollWidth - container.clientWidth - 10,
			);
		};

		// Initial check
		handleScroll();

		container.addEventListener("scroll", handleScroll);
		return () => container.removeEventListener("scroll", handleScroll);
	}, []);

	const scroll = (direction: "left" | "right") => {
		if (!scrollContainerRef.current) return;
		const container = scrollContainerRef.current;
		const scrollAmount = container.clientWidth * 0.75;
		const newScrollPosition =
			direction === "left"
				? container.scrollLeft - scrollAmount
				: container.scrollLeft + scrollAmount;

		container.scrollTo({
			left: newScrollPosition,
			behavior: "smooth",
		});
	};

	return (
		<div className="relative group">
			{/* Navigation Buttons */}
			{showLeftArrow && (
				<Button
					variant="ghost"
					size="icon"
					className="absolute -left-4 top-1/2 -translate-y-1/2 h-20 w-10 z-10 hidden md:flex items-center justify-center bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
					onClick={() => scroll("left")}
				>
					<ChevronLeft className="h-8 w-8" />
				</Button>
			)}
			{showRightArrow && (
				<Button
					variant="ghost"
					size="icon"
					className="absolute -right-4 top-1/2 -translate-y-1/2 h-20 w-10 z-10 hidden md:flex items-center justify-center bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
					onClick={() => scroll("right")}
				>
					<ChevronRight className="h-8 w-8" />
				</Button>
			)}

			{/* Scrollable Container */}
			<div
				ref={scrollContainerRef}
				className="overflow-x-auto scrollbar-hide -mx-4 md:mx-0 px-4 md:px-0"
			>
				<div className="grid md:grid-flow-col grid-rows-[repeat(2,_minmax(0,_1fr))] md:grid-rows-1 auto-cols-[160px] md:auto-cols-[150px] grid-cols-5 md:grid-cols-none gap-3 pb-4 min-w-[800px] md:min-w-0">
					{podcasts.map((podcast) => (
						<Link
							key={`featured-${podcast.id}`}
							href={`/podcasts/${podcast.podcastSlug}`}
							className="transition-opacity hover:opacity-80"
						>
							<Card className="hover:shadow-md transition-all border-border/40 hover:border-border/80 bg-card/50 hover:bg-card">
								<CardContent className="p-2">
									<div className="flex flex-col items-start gap-2">
										<div className="relative aspect-square w-full">
											<Image
												src={podcast.image || "/images/placeholder.png"}
												alt={podcast.title}
												width={150}
												height={150}
												className="rounded-lg object-cover shadow-sm"
											/>
										</div>
										<div className="w-full">
											<h3 className="font-semibold text-sm md:text-xs line-clamp-2 text-left">
												{podcast.title}
											</h3>
										</div>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
