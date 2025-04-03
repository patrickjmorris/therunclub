import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { Headphones } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface CompactEpisodeCardProps {
	episode: {
		episodeId: string;
		episodeTitle?: string | null;
		episodeSlug?: string | null;
		podcastId?: string | null;
		podcastTitle?: string | null;
		podcastSlug?: string | null;
		podcastImage: string | null;
		episodeImage?: string | null;
		itunesImage?: string | null;
		enclosureUrl?: string | null;
		pubDate?: Date | null;
	};
	className?: string;
}

export function CompactEpisodeCard({
	episode,
	className = "",
}: CompactEpisodeCardProps) {
	return (
		<div className={cn("w-[180px] flex-shrink-0 snap-center", className)}>
			<Card className="h-full transition-shadow hover:shadow-md">
				<Link
					href={`/podcasts/${episode.podcastSlug}/${episode.episodeSlug}`}
					className="flex flex-col h-full"
				>
					<CardContent className="p-3 flex flex-col h-full">
						<div className="relative aspect-square w-full overflow-hidden rounded-md mb-2">
							<Image
								alt={episode.podcastTitle ?? ""}
								priority={true}
								className="object-cover transition-transform hover:scale-105"
								width={180}
								height={180}
								src={
									episode.episodeImage ||
									episode.podcastImage ||
									episode.itunesImage ||
									""
								}
							/>
						</div>
						<div className="space-y-1 flex-1">
							<h3 className="font-medium text-sm line-clamp-1">
								{episode.podcastTitle}
							</h3>
							{episode.episodeTitle && (
								<p className="text-xs text-muted-foreground line-clamp-2">
									{episode.episodeTitle}
								</p>
							)}
						</div>
						<div className="flex items-center justify-between mt-2">
							{episode.pubDate && (
								<p className="text-xs text-muted-foreground">
									{formatDistanceToNow(episode.pubDate, { addSuffix: true })}
								</p>
							)}
							<div className="text-primary">
								<Headphones className="h-4 w-4" />
							</div>
						</div>
					</CardContent>
				</Link>
			</Card>
		</div>
	);
}
