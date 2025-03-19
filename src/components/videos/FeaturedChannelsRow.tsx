"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

interface FeaturedChannel {
	id: string;
	title: string;
	thumbnailUrl: string | null;
}

interface FeaturedChannelsRowProps {
	channels: FeaturedChannel[];
}

export function FeaturedChannelsRow({ channels }: FeaturedChannelsRowProps) {
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
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Featured Channels</h2>
				<div className="flex gap-2">
					{showLeftArrow && (
						<Button
							variant="outline"
							size="icon"
							onClick={() => scroll("left")}
							className="rounded-full"
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>
					)}
					{showRightArrow && (
						<Button
							variant="outline"
							size="icon"
							onClick={() => scroll("right")}
							className="rounded-full"
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>

			<div
				ref={scrollContainerRef}
				className="overflow-x-auto scrollbar-hide -mx-4 md:mx-0 px-4 md:px-0"
			>
				<div className="grid md:grid-flow-col grid-rows-[repeat(2,_minmax(0,_1fr))] md:grid-rows-1 auto-cols-[160px] md:auto-cols-[150px] grid-cols-5 md:grid-cols-none gap-3 pb-4 min-w-[800px] md:min-w-0">
					{channels.map((channel) => (
						<Link
							key={`featured-${channel.id}`}
							href={`/videos/channels/${channel.id}`}
							className="transition-opacity hover:opacity-80"
						>
							<Card className="hover:shadow-md transition-all border-border/40 hover:border-border/80 bg-card/50 hover:bg-card">
								<CardContent className="p-2">
									<div className="flex flex-col items-start gap-2">
										<div className="relative aspect-square w-full">
											<ImageWithFallback
												src={channel.thumbnailUrl || "/images/placeholder.png"}
												alt={channel.title}
												width={150}
												height={150}
												type="video"
												className="rounded-lg shadow-sm"
											/>
										</div>
										<div className="w-full">
											<h3 className="font-semibold text-sm md:text-xs line-clamp-2 text-left">
												{channel.title}
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
