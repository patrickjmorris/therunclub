import { notFound } from "next/navigation";
import { formatDuration } from "@/lib/formatDuration";

import { Container } from "@/components/Container";
import { EpisodePlayButton } from "@/components/EpisodePlayButton";
import { FormattedDate } from "@/components/FormattedDate";
import { PauseIcon } from "@/components/PauseIcon";
import { PlayIcon } from "@/components/PlayIcon";
import { getEpisode, getLastTenEpisodesByPodcast } from "@/db/queries";

export const dynamicParams = true;

export async function generateStaticParams() {
	try {
		const allEpisodes = await getLastTenEpisodesByPodcast();

		return allEpisodes.map((episode) => ({
			podcast: episode.podcastSlug || "",
			episode: episode.episodeSlug || "",
		}));
	} catch (error) {
		console.error("Error in generateStaticParams:", error);
		return [];
	}
}

export default async function Episode(props: {
	params: Promise<{ podcast: string; episode: string }>;
}) {
	const params = await props.params;
	console.log("Fetching episode with params:", params);

	try {
		const episode = await getEpisode(params.episode);
		if (!episode) {
			console.log("Episode not found for params:", params);
			notFound();
		}

		// console.log("Episode data:", episode);

		const date = new Date(episode.pubDate);
		const imageUrl = episode.image || episode.podcastImage;
		const duration = episode.duration ? formatDuration(episode.duration) : null;

		return (
			<article className="py-16">
				<Container>
					<header className="flex flex-col">
						<div className="flex flex-col lg:flex-row gap-6">
							<div className="lg:w-1/2">
								{imageUrl && (
									<img
										className="w-full sm:rounded-xl lg:rounded-2xl"
										src={imageUrl}
										alt={episode.title}
										width={500}
										height={500}
										sizes="(min-width: 1024px) 20rem, (min-width: 640px) 16rem, 12rem"
									/>
								)}
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
									{duration && (
										<div className="text-sm text-slate-500">{duration}</div>
									)}
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
					{episode.content && (
						<div
							className="prose prose-slate whitespace-pre-wrap mt-14 [&>h2:nth-of-type(3n)]:before:bg-violet-200 [&>h2:nth-of-type(3n+2)]:before:bg-indigo-200 [&>h2]:mt-12 [&>h2]:flex [&>h2]:items-center [&>h2]:font-mono [&>h2]:text-sm [&>h2]:font-medium [&>h2]:leading-7 [&>h2]:text-slate-900 [&>h2]:before:mr-3 [&>h2]:before:h-3 [&>h2]:before:w-1.5 [&>h2]:before:rounded-r-full [&>h2]:before:bg-cyan-200 [&>ul]:mt-6 [&>ul]:list-['\2013\20'] [&>ul]:pl-5"
							// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
							dangerouslySetInnerHTML={{ __html: episode.content }}
						/>
					)}
				</Container>
			</article>
		);
	} catch (error) {
		console.error("Error in Episode component:", error);
		notFound();
	}
}
