import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
	getLastTenEpisodesByPodcastSlug,
	getPodcastBySlug,
} from "@/lib/services/podcast-service";
import { db } from "@/db/client";
import { podcasts } from "@/db/schema";
import { and, isNotNull, like } from "drizzle-orm";

import { fetchMore } from "./actions";
import { Suspense } from "react";
import { BasicEpisode } from "@/types/shared";
import { createStandardCache } from "@/lib/utils/cache";
import dynamicImport from "next/dynamic";
import { nanoid } from "nanoid";
import { metaDescription, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/common/json-ld";
import { absoluteUrl } from "@/config/site";
import { breadcrumbList, plainText } from "@/lib/seo";

// Dynamically import the episode list component
const DynamicEpisodeList = dynamicImport(
	() =>
		import("@/components/podcasts/DynamicEpisodeList").then((mod) => ({
			default: mod.DynamicEpisodeList,
		})),
	{
		loading: () => (
			<div className="space-y-4">
				{Array.from({ length: 3 }).map(() => (
					<div key={nanoid()} className="animate-pulse">
						<div className="h-32 bg-muted rounded-lg" />
					</div>
				))}
			</div>
		),
		ssr: true,
	},
);

// Route segment config
export const dynamic = "force-static";
export const revalidate = 86400; // 1 day

// Create a cached function for fetching podcast page data
const getPodcastDetailData = createStandardCache(
	async (podcastSlug: string) => {
		const podcast = await getPodcastBySlug(podcastSlug);
		if (!podcast) return null;

		const episodes = await getLastTenEpisodesByPodcastSlug(podcastSlug, 10, 0);

		return { podcast, episodes };
	},
	["podcast-detail"],
	["podcasts"],
);

export async function generateMetadata({
	params,
}: {
	params: Promise<{ podcast: string }>;
}): Promise<Metadata> {
	const resolvedParams = await params;
	const data = await getPodcastDetailData(resolvedParams.podcast);

	if (!data || !data.podcast) return {};

	const podcast = data.podcast;
	const imageUrl = podcast.image || podcast.itunesImage;
	return pageMetadata({
		title: podcast.title,
		description: metaDescription(
			podcast.description,
			`Listen to ${podcast.title} on The Run Club`,
		),
		path: `/podcasts/${podcast.podcastSlug}`,
		images: imageUrl ? [{ url: imageUrl, alt: podcast.title }] : undefined,
	});
}

export async function generateStaticParams() {
	console.log("[Build] Starting generateStaticParams for podcasts");

	try {
		// Only generate static parameters for English language podcasts
		const englishPodcasts = await db
			.select({ slug: podcasts.podcastSlug })
			.from(podcasts)
			.where(
				and(isNotNull(podcasts.podcastSlug), like(podcasts.language, "%en%")),
			);

		console.log(`[Build] Found ${englishPodcasts.length} English podcasts`);

		return englishPodcasts.map((podcast) => ({
			podcast: podcast.slug,
		}));
	} catch (error) {
		console.error("[Build] Error in generateStaticParams for podcasts:", error);
		return []; // Return empty array instead of failing the build
	}
}

export default async function PodcastPage(props: {
	params: Promise<{ podcast: string }>;
}) {
	const params = await props.params;
	const data = await getPodcastDetailData(params.podcast);

	if (!data || !data.podcast) {
		notFound();
	}

	const { podcast, episodes } = data;

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "PodcastSeries",
		name: podcast.title,
		description: podcast.description
			? plainText(podcast.description)
			: undefined,
		author: {
			"@type": "Person",
			name: podcast.author,
		},
		image: podcast.image || podcast.itunesImage,
		url: absoluteUrl(`/podcasts/${podcast.podcastSlug}`),
		episodes: episodes.map((episode) => ({
			"@type": "PodcastEpisode",
			name: episode.title,
			datePublished: episode.pubDate
				? new Date(episode.pubDate).toISOString()
				: undefined,
			url: absoluteUrl(
				`/podcasts/${podcast.podcastSlug}/${episode.episodeSlug}`,
			),
		})),
	};

	return (
		<div className="container py-8">
			<JsonLd
				data={[
					jsonLd,
					breadcrumbList([
						{ name: "Podcasts", path: "/podcasts" },
						{ name: podcast.title, path: `/podcasts/${podcast.podcastSlug}` },
					]),
				]}
			/>
			<div className="mt-8">
				<h2 className="text-xl font-semibold mb-4">Latest Episodes</h2>
				<Suspense fallback={<div>Loading episodes...</div>}>
					<DynamicEpisodeList
						initialEpisodes={episodes as BasicEpisode[]}
						fetchMore={fetchMore.bind(null, params.podcast)}
						hasMore={episodes.length === 10}
					/>
				</Suspense>
			</div>
		</div>
	);
}
