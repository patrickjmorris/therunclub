"use client";

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Headphones } from "lucide-react";

interface PodcastWithLatestEpisode {
	title: string;
	podcastId: string;
	image: string | null;
	episodeTitle: string | null;
	episodeId: string | null;
	episodePubDate: Date | null;
	episodeSlug: string | null;
	podcastSlug: string | null;
	itunesImage: string | null;
}

interface PodcastGridProps {
	podcasts: PodcastWithLatestEpisode[];
	className?: string;
}

export function PodcastGrid({ podcasts, className }: PodcastGridProps) {
	return (
		<div
			className={cn(
				"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
				className,
			)}
		>
			{podcasts.map((podcast, index) => (
				<Card
					key={`${podcast.podcastId}-${index}`}
					className="h-full transition-shadow hover:shadow-md"
				>
					<Link
						href={`/podcasts/${podcast.podcastSlug}`}
						className="flex flex-col h-full"
					>
						<CardContent className="p-3 flex flex-col h-full">
							<div className="relative aspect-square w-full overflow-hidden rounded-md mb-2">
								<Image
									alt={podcast.title}
									className="object-cover transition-transform hover:scale-105"
									fill
									src={
										podcast.itunesImage ||
										podcast.image ||
										"/images/placeholder.png"
									}
								/>
							</div>
							<div className="space-y-1 flex-1">
								<h3 className="font-medium text-sm line-clamp-1">
									{podcast.title}
								</h3>
								{podcast.episodeTitle && (
									<p className="text-xs text-muted-foreground line-clamp-2">
										Latest: {podcast.episodeTitle}
									</p>
								)}
							</div>
							<div className="flex items-center justify-between mt-2">
								{podcast.episodePubDate && (
									<p className="text-xs text-muted-foreground">
										{formatDistanceToNow(podcast.episodePubDate, {
											addSuffix: true,
										})}
									</p>
								)}
								<div className="text-primary">
									<Headphones className="h-4 w-4" />
								</div>
							</div>
						</CardContent>
					</Link>
				</Card>
			))}
		</div>
	);
}
