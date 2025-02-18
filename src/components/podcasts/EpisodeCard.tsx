import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormattedDate } from "@/components/FormattedDate";
import Link from "next/link";
import Image from "next/image";
import { ListenNowButton } from "@/components/ListenNowButton";
import { EpisodeWithPodcast } from "@/types/episodeWithPodcast";

interface EpisodeCardProps {
	episode: {
		episodeId: string;
		episodeTitle?: string | null;
		episodeSlug?: string | null;
		podcastId?: string | null;
		podcastTitle?: string | null;
		podcastSlug?: string | null;
		podcastImage?: string | null;
		itunesImage?: string | null;
		enclosureUrl?: string | null;
		pubDate?: Date | null;
	};
	className?: string;
}

export function EpisodeCard({ episode, className = "" }: EpisodeCardProps) {
	const episodeData: EpisodeWithPodcast = {
		id: episode.episodeId,
		title: episode.episodeTitle || episode.podcastTitle || "",
		pubDate: episode.pubDate ?? null,
		content: null,
		podcastId: episode.podcastId ?? null,
		podcastTitle: episode.podcastTitle || "",
		podcastAuthor: null,
		podcastImage: episode.podcastImage ?? null,
		enclosureUrl: episode.enclosureUrl ?? null,
		duration: null,
		explicit: null,
		image: episode.itunesImage ?? null,
		episodeSlug: episode.episodeSlug ?? null,
		podcastSlug: episode.podcastSlug ?? null,
		link: null,
	};

	return (
		<Card
			className={`group hover:shadow-lg transition-all h-full ${className}`}
		>
			<Link
				href={`/podcasts/${episode.podcastSlug}/${episode.episodeSlug}`}
				className="flex flex-col h-full"
			>
				<CardHeader className="space-y-4">
					<div className="aspect-square relative overflow-hidden rounded-lg">
						<Image
							alt={episode.podcastTitle ?? ""}
							className="object-cover transition-transform group-hover:scale-105"
							height={400}
							src={episode.podcastImage || episode.itunesImage || ""}
							width={400}
						/>
					</div>
					<div className="space-y-2">
						<CardTitle className="line-clamp-1">
							{episode.podcastTitle}
						</CardTitle>
						{episode.episodeTitle && (
							<p className="text-sm text-muted-foreground line-clamp-2">
								Latest: {episode.episodeTitle}
							</p>
						)}
					</div>
				</CardHeader>
				<CardContent className="flex-1 flex flex-col justify-end space-y-2">
					{episode.pubDate && (
						<FormattedDate
							date={episode.pubDate}
							className="text-sm text-muted-foreground"
						/>
					)}
					<ListenNowButton episode={episodeData} className="w-full mt-auto" />
				</CardContent>
			</Link>
		</Card>
	);
}
