import { notFound } from "next/navigation";
import {
	getLastTenEpisodes,
	getLastTenEpisodesByPodcastSlug,
	getPodcastBySlug,
} from "@/db/queries";
import { db } from "@/db";
import { podcasts } from "@/db/schema";
import { Container } from "@/components/Container";
import EpisodeEntry from "@/components/podcasts/EpisodeEntry";

export const revalidate = 86400;

export async function generateStaticParams() {
	const allPodcasts = await db
		.select({ slug: podcasts.podcastSlug })
		.from(podcasts);

	return allPodcasts.map((podcast) => ({
		podcast: podcast.slug,
	}));
}

export default async function PodcastPage(props: {
	params: Promise<{ podcast: string }>;
}) {
	const params = await props.params;
	// console.log("params", params);
	const podcast = await getPodcastBySlug(params.podcast);
	// console.log("podcast", podcast);
	if (!podcast) {
		notFound();
	}

	if (!podcast.podcastSlug) {
		notFound();
	}

	const episodes = await getLastTenEpisodesByPodcastSlug(podcast.podcastSlug);
	// console.log("episodes", episodes);
	return (
		<div className="pt-16 pb-12 sm:pb-4 lg:pt-12 bg-stone-50">
			<Container>
				<h1 className="text-2xl font-bold leading-7 text-slate-900">
					{podcast.title}
				</h1>
			</Container>
			<div className="divide-y divide-slate-100 sm:mt-4 lg:mt-8 lg:border-t lg:border-slate-100">
				{episodes.map((episode) => (
					<EpisodeEntry
						key={episode.episodeSlug}
						episodeSlug={episode.episodeSlug}
					/>
				))}
			</div>
		</div>
	);
}
