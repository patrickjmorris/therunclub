"use client";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ContentItem {
	id: string;
	title: string;
	thumbnailUrl: string;
	publishedAt: Date;
	type: "video" | "episode";
	podcastTitle?: string;
	podcastSlug?: string;
}

interface FeaturedContentProps {
	title: string;
	thumbnailUrl: string;
	vibrantColor?: string;
	items: ContentItem[];
	type: "channel" | "podcast";
	slug?: string;
}

export function FeaturedChannelClient({
	title,
	thumbnailUrl,
	vibrantColor = "#1e3a8a",
	items,
	type,
	slug,
}: FeaturedContentProps) {
	const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
	const [showLeftArrow, setShowLeftArrow] = useState(false);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const handleScroll = () => {
			setShowLeftArrow(container.scrollLeft > 0);
		};

		container.addEventListener("scroll", handleScroll);
		return () => container.removeEventListener("scroll", handleScroll);
	}, []);

	const scroll = (direction: "left" | "right") => {
		if (!scrollContainerRef.current) return;
		const container = scrollContainerRef.current;
		const scrollAmount = container.clientWidth / 2;
		const newScrollPosition =
			direction === "left"
				? container.scrollLeft - scrollAmount
				: container.scrollLeft + scrollAmount;

		container.scrollTo({
			left: newScrollPosition,
			behavior: "smooth",
		});
	};

	const arrowButtonClasses =
		"absolute top-1/2 -translate-y-1/2 h-24 w-12 z-10 hidden md:flex items-center justify-center bg-background/80 transition-opacity";

	const getItemUrl = (item: ContentItem) => {
		if (item.type === "video") return `/videos/${item.id}`;
		return `/podcasts/${item.podcastSlug}/episodes/${item.id}`;
	};

	return (
		<Card className="overflow-hidden">
			{/* Hero Section */}
			<Link
				href={
					type === "channel" ? `videos/channels/${slug}` : `/podcasts/${slug}`
				}
			>
				<div
					className="relative h-[200px] w-full"
					style={{
						background: `linear-gradient(to bottom, ${vibrantColor}60, ${vibrantColor}95)`,
					}}
				>
					<Image
						src={thumbnailUrl}
						alt={title}
						fill
						className="object-cover mix-blend-overlay"
						priority
					/>
					<div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60">
						<div className="absolute bottom-4 left-4">
							<h1 className="text-white text-2xl font-bold">{title}</h1>
						</div>
					</div>
				</div>
			</Link>

			{/* Content Row */}
			<div className="relative group">
				<div
					className="absolute inset-0"
					style={{
						background: `linear-gradient(to bottom, ${vibrantColor}30, transparent)`,
					}}
				/>

				{/* Scrollable Container */}
				<div className="relative p-4">
					{/* Navigation Buttons (desktop only) */}
					{showLeftArrow && (
						<Button
							variant="ghost"
							size="icon"
							className={cn(
								arrowButtonClasses,
								"-left-3 opacity-0 group-hover:opacity-100",
							)}
							onClick={(e) => {
								e.preventDefault();
								scroll("left");
							}}
						>
							<ChevronLeft className="h-8 w-8" />
						</Button>
					)}
					<Button
						variant="ghost"
						size="icon"
						className={cn(
							arrowButtonClasses,
							"-right-3 opacity-0 group-hover:opacity-100",
						)}
						onClick={(e) => {
							e.preventDefault();
							scroll("right");
						}}
					>
						<ChevronRight className="h-8 w-8" />
					</Button>

					<div
						ref={scrollContainerRef}
						className="flex overflow-x-auto space-x-4 pb-4 snap-x snap-mandatory scrollbar-hide"
					>
						{items.map((item) => (
							<Link
								key={item.id}
								href={getItemUrl(item)}
								className="group/item flex-none w-[240px] md:w-[320px] snap-start"
								onMouseEnter={() => setHoveredItemId(item.id)}
								onMouseLeave={() => setHoveredItemId(null)}
							>
								<div className="aspect-video relative rounded-md overflow-hidden">
									<Image
										src={item.thumbnailUrl}
										alt={item.title}
										fill
										className={cn(
											"object-cover transition-transform duration-300",
											hoveredItemId === item.id && "scale-105",
										)}
									/>
									{hoveredItemId === item.id && (
										<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
											<Play className="h-12 w-12 text-white" />
										</div>
									)}
								</div>
								<div className="mt-2">
									{item.type === "episode" && item.podcastTitle && (
										<p className="text-sm text-muted-foreground mb-1">
											{item.podcastTitle}
										</p>
									)}
									<h3 className="text-sm font-medium line-clamp-2">
										{item.title}
									</h3>
									<p className="text-sm text-muted-foreground">
										{formatDistanceToNow(item.publishedAt, {
											addSuffix: true,
										})}
									</p>
								</div>
							</Link>
						))}
					</div>
				</div>
			</div>
		</Card>
	);
}
