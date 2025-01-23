import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
	getLastTenEpisodesByPodcastSlug,
	getPodcastBySlug,
} from "@/db/queries";
import { db } from "@/db/client";
import { podcasts } from "@/db/schema";
import { isNotNull } from "drizzle-orm";
import { EpisodeList } from "@/components/podcasts/episode-list";
import { fetchMore } from "./actions";
import { Suspense } from "react";
import { BasicEpisode } from "@/types/shared";

export const revalidate = 3600;

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
		.from(podcasts)
		.where(isNotNull(podcasts.podcastSlug));

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

	if (!podcast) {
		notFound();
	}

	const episodes = await getLastTenEpisodesByPodcastSlug(params.podcast, 10, 0);

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
			datePublished: episode.pubDate
				? new Date(episode.pubDate).toISOString()
				: "",
			url: `/podcasts/${podcast.podcastSlug}/${episode.episodeSlug}`,
		})),
	};

	return (
		<div className="container py-8">
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<div className="mt-8">
				<h2 className="text-xl font-semibold mb-4">Latest Episodes</h2>
				<Suspense fallback={<div>Loading episodes...</div>}>
					<EpisodeList
						initialEpisodes={episodes as BasicEpisode[]}
						fetchMore={fetchMore.bind(null, params.podcast)}
						hasMore={episodes.length === 10}
					/>
				</Suspense>
			</div>
		</div>
	);
}
