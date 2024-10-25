import Image from "next/image";
import { Container } from "../Container";
import { slugify } from "@/lib/utils";
import Link from "next/link";
import { FormattedDate } from "../FormattedDate";
import { EpisodePlayButton } from "../EpisodePlayButton";
import { Play, Pause } from "lucide-react";
import { Button } from "../ui/button";
import { formatDuration } from "@/lib/formatDuration";
import { getPodcastMetadata, getEpisode } from "@/db/queries";
import { EpisodeWithPodcast } from "@/types/episodeWithPodcast";

export default async function EpisodeEntry({
	episodeId,
}: {
	episodeId: string;
}) {
	const episode = await getEpisode(episodeId);

	if (!episode) {
		return null;
	}

	const date = new Date(episode.pubDate);
	const duration = episode.duration ? formatDuration(episode.duration) : null;

	return (
		<article
			aria-labelledby={`episode-${episode.id}-title`}
			className="py-10 sm:py-12"
		>
			<Container>
				<div className="grid grid-cols-[auto_1fr] lg:grid-cols-[180px_1fr] gap-4 lg:gap-6">
					<div className="row-span-1 lg:row-span-3">
						<Image
							src={episode.image || episode.podcastImage || ""}
							alt={episode.title}
							width={180}
							height={180}
							className="rounded object-cover w-32 h-32 lg:w-[180px] lg:h-[180px]"
						/>
					</div>
					<div className="flex flex-col">
						<h2
							id={`episode-${episode.id}-title`}
							className="text-lg font-bold text-slate-900 line-clamp-4 text-ellipsis"
						>
							<Link href={`/podcasts/${episode.podcastId}/${episode.id}`}>
								{episode.title}
							</Link>
						</h2>
						<FormattedDate
							date={date}
							className="font-mono text-sm leading-7 text-slate-500"
						/>
					</div>
					<div
						className="text-base leading-7 text-slate-700 line-clamp-4 prose prose-slate col-span-2 lg:col-span-1 lg:col-start-2"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: We want to use the HTML content to apply styling
						dangerouslySetInnerHTML={{
							__html: episode.content ?? "",
						}}
					/>
					<div className="flex items-center gap-4 mt-4 col-span-2 lg:col-span-1 lg:col-start-2">
						<EpisodePlayButton
							episode={episode}
							className="flex items-center text-sm font-bold leading-6 text-slate-500 gap-x-3 hover:text-slate-700 active:text-slate-900"
							playing={
								<>
									<Pause className="h-4 w-4 fill-current" />
									<span aria-hidden="true">Listen</span>
								</>
							}
							paused={
								<>
									<Play className="h-4 w-4 fill-current" />
									<span aria-hidden="true">Listen</span>
								</>
							}
						/>
						<span
							aria-hidden="true"
							className="text-sm font-bold text-slate-400"
						>
							/
						</span>
						<Button variant="link">
							<Link
								href={`/podcasts/${episode.podcastId}/${episode.id}`}
								className="flex items-center text-sm font-bold leading-6 text-slate-500 hover:text-slate-700 active:text-slate-900"
								aria-label={`Show notes for episode ${episode.title}`}
							>
								Show notes
							</Link>
						</Button>
						<span
							aria-hidden="true"
							className="text-sm font-bold text-slate-400"
						>
							/
						</span>
						<span className="text-sm font-bold text-slate-500">{duration}</span>
					</div>
				</div>
			</Container>
		</article>
	);
}
