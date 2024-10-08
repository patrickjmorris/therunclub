import { cache } from "react";
import { notFound } from "next/navigation";
import { formatDuration } from "@/lib/formatDuration";

import { Container } from "@/components/Container";
import { EpisodePlayButton } from "@/components/EpisodePlayButton";
import { FormattedDate } from "@/components/FormattedDate";
import { PauseIcon } from "@/components/PauseIcon";
import { PlayIcon } from "@/components/PlayIcon";
import {
	FEEDS,
	getEpisodeTitles,
	getEpisode,
	getPodcastMetadata,
} from "@/lib/episodes";
import { slugify } from "@/lib/utils";

export const dynamicParams = true;

// Generate segments for [podcast] using the `params` passed from
// the parent segment's `generateStaticParams` function
export async function generateStaticParams({
	params: { podcast },
}: {
	params: { podcast: string };
}) {
	// get all episodes for the podcast using getEpisodeTitles
	// We need to pass the podcast url to getEpisodeTitles so that it can get the metadata for the podcast
	// This is because getEpisodeTitles uses the podcast url to get the metadata for the podcast
	const feed = FEEDS.find((feed) => feed.slug === podcast);
	if (!feed) {
		return [];
	}
	const episodes = await getEpisodeTitles(feed.url);
	return episodes.map((episode) => ({
		episode: slugify(episode),
	}));
}

function formatTime(seconds: [number, number, number], totalSeconds = seconds) {
	const totalWithoutLeadingZeroes = totalSeconds.slice(
		totalSeconds.findIndex((x) => x !== 0),
	);
	return seconds
		.slice(seconds.length - totalWithoutLeadingZeroes.length)
		.map((x) => x.toString().padStart(2, "0"))
		.join(":");
}

export default async function Episode({
	params,
}: {
	params: { podcast: string; episode: string };
}) {
	// console.log('Episode Params', params)
	const feed = FEEDS.find((feed) => feed.slug === params.podcast);
	if (!feed) {
		// Handle the case where feed is undefined
		// Not sure if this is the best way to handle this
		notFound();
	}
	const episode = await getEpisode(feed.url, params.episode);
	if (!episode) {
		// Handle the case where episode is undefined
		// Not sure if this is the best way to handle this
		notFound();
	}
	const date = new Date(episode.pubDate);

	// Get the podcast metadata to use as fallback for the image
	const podcastMetadata = await getPodcastMetadata(feed.url);

	// Use the episode's iTunes image if available, otherwise use the podcast image
	const imageUrl = episode.itunes.image || podcastMetadata.image;

	const duration = formatDuration(episode.itunes.duration);

	return (
		<article className="py-16">
			<Container>
				<header className="flex flex-col">
					<div className="flex flex-col lg:flex-row gap-6">
						<div className="lg:w-1/2">
							<img
								className="w-full sm:rounded-xl lg:rounded-2xl"
								src={imageUrl}
								alt={episode.title}
								width={500}
								height={500}
								sizes="(min-width: 1024px) 20rem, (min-width: 640px) 16rem, 12rem"
							/>
						</div>
						<div className="lg:w-1/2">
							<h1 className="mt-2 text-4xl font-bold text-slate-900">
								{episode.title}
							</h1>
							<FormattedDate
								date={date}
								className="order-first font-mono text-sm leading-7 text-slate-500"
							/>
							<div className="flex flex-col gap-2 mt-2">
								<div className="text-sm text-slate-500">{duration}</div>
							</div>
						</div>
					</div>
					<EpisodePlayButton
						episode={episode}
						className="relative flex items-center justify-center flex-shrink-0 mt-4 rounded-full group h-18 w-18 bg-slate-700 hover:bg-slate-900 focus:outline-none focus:ring focus:ring-slate-700 focus:ring-offset-4"
						playing={
							<PauseIcon className="h-9 w-9 fill-white group-active:fill-white/80" />
						}
						paused={
							<PlayIcon className="h-9 w-9 fill-white group-active:fill-white/80" />
						}
					/>
				</header>
				<hr className="my-12 border-gray-200" />
				<div
					className="prose prose-slate whitespace-pre-wrap mt-14 [&>h2:nth-of-type(3n)]:before:bg-violet-200 [&>h2:nth-of-type(3n+2)]:before:bg-indigo-200 [&>h2]:mt-12 [&>h2]:flex [&>h2]:items-center [&>h2]:font-mono [&>h2]:text-sm [&>h2]:font-medium [&>h2]:leading-7 [&>h2]:text-slate-900 [&>h2]:before:mr-3 [&>h2]:before:h-3 [&>h2]:before:w-1.5 [&>h2]:before:rounded-r-full [&>h2]:before:bg-cyan-200 [&>ul]:mt-6 [&>ul]:list-['\2013\20'] [&>ul]:pl-5"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: We want to use the HTML content to apply styling
					dangerouslySetInnerHTML={{ __html: episode.description }}
				/>
			</Container>
		</article>
	);
}
