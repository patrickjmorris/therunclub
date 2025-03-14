"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HorizontalScrollProps {
	children: React.ReactNode;
	className?: string;
	itemsClassName?: string;
	showArrows?: boolean;
}

export function HorizontalScroll({
	children,
	className,
	itemsClassName,
	showArrows = true,
}: HorizontalScrollProps) {
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
		window.addEventListener("resize", handleScroll);

		return () => {
			container.removeEventListener("scroll", handleScroll);
			window.removeEventListener("resize", handleScroll);
		};
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
		<div className={cn("relative scroll-container", className)}>
			{/* Navigation Buttons */}
			{showArrows && showLeftArrow && (
				<Button
					variant="ghost"
					size="icon"
					className="absolute -left-4 top-1/2 -translate-y-1/2 h-20 w-10 z-10 hidden md:flex items-center justify-center bg-background/80 opacity-0 scroll-container-hover:opacity-100 transition-opacity shadow-md"
					onClick={() => scroll("left")}
				>
					<ChevronLeft className="h-8 w-8" />
				</Button>
			)}
			{showArrows && showRightArrow && (
				<Button
					variant="ghost"
					size="icon"
					className="absolute -right-4 top-1/2 -translate-y-1/2 h-20 w-10 z-10 hidden md:flex items-center justify-center bg-background/80 opacity-0 scroll-container-hover:opacity-100 transition-opacity shadow-md"
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
				<div
					className={cn(
						"flex gap-4 pb-4 snap-x snap-mandatory",
						itemsClassName,
					)}
				>
					{children}
				</div>
			</div>
		</div>
	);
}
