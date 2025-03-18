"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Video {
	id: string;
	title: string;
	thumbnailUrl: string;
	publishedAt: Date;
	duration: string;
	viewCount?: string;
}

interface FeaturedChannelProps {
	id: string;
	title: string;
	description?: string;
	thumbnailUrl: string;
	customUrl?: string;
	subscriberCount?: string;
	country?: string;
	videos: Video[];
}

export function FeaturedChannel({
	title,
	thumbnailUrl,
	subscriberCount,
	country,
	videos,
}: FeaturedChannelProps) {
	return (
		<Card className="overflow-hidden">
			{/* Hero Section */}
			<div className="relative h-[300px] w-full">
				<Image
					src={thumbnailUrl}
					alt={title}
					fill
					className="object-cover"
					priority
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
				/>
				<div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60">
					<div className="absolute top-4 left-4 flex items-center gap-3">
						<div>
							<h2 className="text-white font-semibold">{title}</h2>
							{subscriberCount && (
								<p className="text-white/80 text-sm">
									{subscriberCount} subscribers
								</p>
							)}
						</div>
					</div>

					<div className="absolute bottom-8 left-0 w-full text-center">
						<h1 className="text-white text-4xl font-bold tracking-wider">
							{title.toUpperCase()}
						</h1>
						{country && (
							<p className="text-white/90 mt-2 tracking-wide">{country}</p>
						)}
					</div>
				</div>
			</div>

			{/* Videos Grid */}
			<div className="p-4 bg-white/90 backdrop-blur-sm">
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
					{videos.map((video) => (
						<div key={video.id}>
							<div className="aspect-video relative rounded-md overflow-hidden">
								<Image
									src={video.thumbnailUrl}
									alt={video.title}
									width={320}
									height={200}
									className="object-cover transition-transform duration-300"
								/>
								{video.duration && (
									<div className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-black/80 text-white text-xs">
										{video.duration}
									</div>
								)}
							</div>
							<div className="mt-2 flex justify-between items-start">
								<div className="flex-1">
									<h3 className="text-sm font-medium line-clamp-2">
										{video.title}
									</h3>
									<p className="text-sm text-muted-foreground">
										{video.publishedAt &&
											formatDistanceToNow(video.publishedAt, {
												addSuffix: true,
											})}
										{video.viewCount && ` • ${video.viewCount} views`}
									</p>
								</div>
								<Button
									variant="ghost"
									size="icon"
									className="text-white hover:bg-white/20"
								>
									<ThumbsUp className="h-4 w-4" />
								</Button>
							</div>
						</div>
					))}
				</div>
			</div>
		</Card>
	);
}
