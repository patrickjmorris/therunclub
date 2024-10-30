import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
	getLastTenEpisodesByPodcastSlug,
	getPodcastBySlug,
} from "@/db/queries";
import { db } from "@/db";
import { podcasts } from "@/db/schema";
import { Container } from "@/components/Container";
import EpisodeEntry from "@/components/podcasts/EpisodeEntry";

export const revalidate = 86400;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ podcast: string }>;
}): Promise<Metadata> {
	const resolvedParams = await params;
	const podcast = await getPodcastBySlug(resolvedParams.podcast);

	if (!podcast) return {};

	const imageUrl = podcast.image || "";
	const description =
		podcast.description?.substring(0, 155) ||
		`Listen to ${podcast.title} on The Run Club`;

	return {
		title: podcast.title,
		description: description,
		openGraph: {
			type: "website",
			title: podcast.title,
			description: description,
			siteName: "The Run Club",
			images: [
				{
					url: imageUrl,
					width: 1200,
					height: 630,
					alt: podcast.title,
				},
			],
			locale: "en_US",
		},
		twitter: {
			card: "summary_large_image",
			title: podcast.title,
			description: description,
			images: [imageUrl],
		},
		alternates: {
			canonical: `/podcasts/${resolvedParams.podcast}`,
		},
	};
}

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
	const podcast = await getPodcastBySlug(params.podcast);

	if (!podcast || !podcast.podcastSlug) {
		notFound();
	}

	const episodes = await getLastTenEpisodesByPodcastSlug(podcast.podcastSlug);

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "PodcastSeries",
		name: podcast.title,
		description: podcast.description,
		author: {
			"@type": "Person",
			name: podcast.author,
		},
		image: podcast.image,
		url: `/podcasts/${podcast.podcastSlug}`,
		episodes: episodes.map((episode) => ({
			"@type": "PodcastEpisode",
			name: episode.title,
			datePublished: new Date(episode.pubDate).toISOString(),
			url: `/podcasts/${podcast.podcastSlug}/${episode.episodeSlug}`,
		})),
	};

	return (
		<div className="pt-16 pb-12 sm:pb-4 lg:pt-12 bg-stone-50">
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
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
