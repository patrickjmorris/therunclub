"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { FormattedDate } from "../FormattedDate";
import { formatDuration } from "@/lib/formatDuration";
import { sanitizeHtml } from "@/lib/sanitize";
import type { BasicEpisode } from "@/types/shared";
import { EpisodePlayControls } from "./episode-play-controls";

interface EpisodeEntryProps {
	episode: BasicEpisode;
}

export default function EpisodeEntry({ episode }: EpisodeEntryProps) {
	if (!episode) return null;
	const date = episode.pubDate ? new Date(episode.pubDate) : null;
	const duration = episode.duration ? formatDuration(episode.duration) : null;

	return (
		<Card className="hover:bg-muted/50 transition-colors my-4">
			<CardContent className="p-6">
				<div className="grid grid-cols-[auto_1fr] lg:grid-cols-[180px_1fr] gap-4 lg:gap-6">
					<div className="row-span-1 lg:row-span-3">
						<Image
							src={episode.image || episode.podcastImage || ""}
							alt={episode.title}
							width={180}
							height={180}
							className="rounded-lg object-cover w-32 h-32 lg:w-[180px] lg:h-[180px]"
						/>
					</div>
					<div className="flex flex-col">
						<h2 className="text-lg font-bold line-clamp-2">
							<Link
								href={`/podcasts/${episode.podcastSlug}/${episode.episodeSlug}`}
								className="hover:underline"
							>
								{episode.title}
							</Link>
						</h2>
						{date && (
							<FormattedDate
								date={date}
								className="text-sm text-muted-foreground mt-1"
							/>
						)}
					</div>
					<div className="prose dark:prose-invert col-span-2 lg:col-span-1 lg:col-start-2 h-18 line-clamp-3">
						<div
							// biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized
							dangerouslySetInnerHTML={{
								__html: sanitizeHtml(episode.content ?? ""),
							}}
						/>
					</div>
					<div className="flex items-center gap-4 mt-4 col-span-2 lg:col-span-1 lg:col-start-2">
						<EpisodePlayControls episode={episode} />
						<Button variant="ghost" size="sm" asChild>
							<Link
								href={`/podcasts/${episode.podcastSlug}/${episode.episodeSlug}`}
							>
								Show notes
							</Link>
						</Button>
						{duration && (
							<span className="text-sm text-muted-foreground">{duration}</span>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
