import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { FormattedDate } from "@/components/FormattedDate";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { searchEpisodesWithPodcasts } from "@/db/queries";
import {
	getFeaturedPodcasts,
	getNewEpisodes,
} from "@/lib/services/podcast-service";
import { LoadingGridSkeleton } from "@/components/videos/loading-ui";
import { Suspense } from "react";
import { parseAsString } from "nuqs/server";
import { PodcastFilter } from "@/components/podcasts/podcast-filter";
import AddContentWrapper from "@/components/content/AddContentWrapper";
import { ListenNowButton } from "@/components/ListenNowButton";
import { EpisodeCard } from "@/components/podcasts/EpisodeCard";
import { cn } from "@/lib/utils";
import { FeaturedPodcastsRow } from "@/components/podcasts/FeaturedPodcastsRow";

export const metadata: Metadata = {
	title: "Running Podcasts | The Run Club",
	description:
		"Discover the latest episodes from your favorite running podcasts",
	openGraph: {
		title: "Running Podcasts | The Run Club",
		description:
			"Discover the latest episodes from your favorite running podcasts",
		type: "website",
	},
	alternates: {
		canonical: "/podcasts",
	},
};

interface PageProps {
	searchParams: Promise<{ q?: string }>;
}
export const revalidate = 3600;

export default async function PodcastList({ searchParams }: PageProps) {
	// Parse search params
	const { q } = await searchParams;
	const query = parseAsString.withDefault("").parseServerSide(q);

	// Get featured podcasts (increased to 10)
	const featuredPodcasts = await getFeaturedPodcasts(10);

	const podcasts = query
		? await searchEpisodesWithPodcasts(query)
		: await getNewEpisodes(30);

	return (
		<div className="container py-8 md:py-12">
			{/* Search Section */}
			<div className="flex items-center justify-between mb-8">
				<AddContentWrapper defaultTab="podcast" />
			</div>

			{/* Featured Podcasts Section */}
			<div className="mb-12">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-bold">Featured Podcasts</h2>
				</div>
				<FeaturedPodcastsRow podcasts={featuredPodcasts} />
			</div>

			<h2 className="text-2xl font-bold">Latest Episodes</h2>
			<Suspense fallback={<LoadingGridSkeleton />}>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{podcasts.map((podcast) => (
						<EpisodeCard
							key={podcast.episodeId}
							episode={{
								episodeId: podcast.episodeId,
								episodeTitle: podcast.episodeTitle,
								episodeSlug: podcast.episodeSlug,
								podcastId: podcast.podcastId,
								podcastTitle: podcast.podcastTitle,
								podcastSlug: podcast.podcastSlug,
								podcastImage: podcast.podcastImage,
								itunesImage: podcast.itunesImage,
								enclosureUrl: podcast.enclosureUrl,
								pubDate: podcast.pubDate ? new Date(podcast.pubDate) : null,
							}}
						/>
					))}
				</div>
			</Suspense>
		</div>
	);
}
