"use client";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { YouTubeEmbed } from "@next/third-parties/google";

interface VideoPlayerProps {
	videoId: string;
	className?: string;
	title?: string;
}

export function VideoPlayer({ videoId, className, title }: VideoPlayerProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return (
			<div className={cn("relative", className)}>
				<AspectRatio ratio={16 / 9}>
					<Skeleton className="absolute inset-0 z-10 bg-muted" />
				</AspectRatio>
			</div>
		);
	}

	return (
		<div className={cn("relative", className)}>
			<AspectRatio ratio={16 / 9}>
				{isLoading && <Skeleton className="absolute inset-0 z-10 bg-muted" />}
				<iframe
					src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
					title={title || "YouTube video player"}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
					className="absolute inset-0 h-full w-full"
					onLoad={() => setIsLoading(false)}
					loading="lazy"
				/>
				{/* <YouTubeEmbed
					// className="absolute inset-0 h-full w-full"
					// onLoad={() => setIsLoading(false)}
					videoid={videoId}
					style="position: absolute; inset: 0px; z-index: 10; height: 100%; width: 100%;"
				/> */}
			</AspectRatio>
		</div>
	);
}
