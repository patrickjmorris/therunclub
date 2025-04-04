import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormattedDate } from "@/components/common/formatted-date";
import Link from "next/link";
import Image from "next/image";
import { ListenNowButton } from "@/components/podcasts/listen-now-button";
import { EpisodeWithPodcast } from "@/types/episodeWithPodcast";

interface EpisodeCardProps {
	episode: {
		episodeId: string;
		episodeTitle?: string | null;
		episodeSlug?: string | null;
		podcastId?: string | null;
		podcastTitle?: string | null;
		podcastSlug?: string | null;
		episodeImage?: string | null;
		podcastImage?: string | null;
		itunesImage?: string | null;
		enclosureUrl?: string | null;
		pubDate?: Date | null;
		duration?: number | null;
		content?: string | null;
		podcastAuthor?: string | null;
		explicit?: boolean | null;
		link?: string | null;
	};
	className?: string;
}

export function EpisodeCard({ episode, className = "" }: EpisodeCardProps) {
	const episodeData: EpisodeWithPodcast = {
		id: episode.episodeId,
		title: episode.episodeTitle || episode.podcastTitle || "",
		pubDate: episode.pubDate ?? null,
		episodeImage: episode.episodeImage ?? null,
		podcastId: episode.podcastId ?? null,
		podcastTitle: episode.podcastTitle || "",
		podcastImage: episode.podcastImage ?? null,
		duration: episode.duration?.toString() ?? null,
		content: episode.content ?? null,
		podcastAuthor: episode.podcastAuthor ?? null,
		explicit: episode.explicit ? "yes" : "no",
		enclosureUrl: episode.enclosureUrl ?? null,
		episodeSlug: episode.episodeSlug ?? null,
		podcastSlug: episode.podcastSlug ?? null,
		link: episode.link ?? null,
	};

	return (
		<Card
			className={`group hover:shadow-md transition-all h-full border dark:border-slate-800 ${className}`}
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
							src={episode.episodeImage || episode.podcastImage || ""}
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
