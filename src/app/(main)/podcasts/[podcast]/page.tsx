import { notFound } from "next/navigation";
import {
	getPodcastById,
	getLastTenEpisodes,
	getPodcastMetadata,
} from "@/db/queries";
import { db } from "@/db";
import { podcasts } from "@/db/schema";
import { Container } from "@/components/Container";
import EpisodeEntry from "@/components/podcasts/EpisodeEntry";

export const revalidate = 60 * 60 * 24;

export async function generateStaticParams() {
	const allPodcasts = await db.select({ id: podcasts.id }).from(podcasts);

	return allPodcasts.map((podcast) => ({
		podcast: podcast.id,
	}));
}

export default async function PodcastPage({
	params,
}: { params: { podcast: string } }) {
	const podcast = await getPodcastById(params.podcast);
	console.log(podcast);
	if (!podcast) {
		notFound();
	}

	const episodes = await getLastTenEpisodes(podcast.id);
	console.log(episodes);
	return (
		<div className="pt-16 pb-12 sm:pb-4 lg:pt-12 bg-stone-50">
			<Container>
				<h1 className="text-2xl font-bold leading-7 text-slate-900">
					{podcast.title}
				</h1>
			</Container>
			<div className="divide-y divide-slate-100 sm:mt-4 lg:mt-8 lg:border-t lg:border-slate-100">
				{episodes.map((episode) => (
					<EpisodeEntry key={episode.id} episodeId={episode.id} />
				))}
			</div>
		</div>
	);
}
