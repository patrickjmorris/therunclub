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
		<div className={cn("relative [&_lite-youtube]:!max-w-none", className)}>
			<AspectRatio ratio={16 / 9}>
				<div className="absolute inset-0 h-full w-full">
					<YouTubeEmbed
						videoid={videoId}
						params="rel=0"
						playlabel={title || "Play YouTube video"}
						style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; max-width: none;"
					/>
				</div>
			</AspectRatio>
		</div>
	);
}
