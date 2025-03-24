import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { FormattedDate } from "@/components/FormattedDate";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import {
	getFeaturedPodcasts,
	getNewEpisodes,
	getAllPodcastAndLastEpisodes,
	getPodcastTags,
} from "@/lib/services/podcast-service";
import { LoadingGridSkeleton } from "@/components/videos/loading-ui";
import { Suspense } from "react";
import { parseAsString } from "nuqs/server";
import { PodcastFilter } from "@/components/podcasts/podcast-filter";
import AddContentWrapper from "@/components/content/AddContentWrapper";
import { CompactEpisodeCard } from "@/components/podcasts/CompactEpisodeCard";
import { FeaturedPodcastsRow } from "@/components/podcasts/FeaturedPodcastsRow";
import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import { PodcastGrid } from "@/components/podcasts/PodcastGrid";
import { PodcastGridSkeleton } from "@/components/podcasts/PodcastGridSkeleton";

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
	searchParams: Promise<{ q?: string; category?: string }>;
}
export const revalidate = 3600;

export default async function PodcastList({ searchParams }: PageProps) {
	// Parse search params
	const { q, category } = await searchParams;
	// We're only using category filter now, not search query
	const categoryFilter = parseAsString
		.withDefault("")
		.parseServerSide(category);

	// Get podcast tags for filter
	const podcastTags = await getPodcastTags(10);

	// Get featured podcasts (increased to 10)
	const featuredPodcasts = await getFeaturedPodcasts(10);

	// Get latest episodes - we're not using search anymore
	const latestEpisodes = await getNewEpisodes(20);

	// Get all podcasts with their latest episode
	const allPodcasts = await getAllPodcastAndLastEpisodes();

	// Filter podcasts by category if needed
	let filteredPodcasts = allPodcasts;

	// Apply category filter if provided
	if (categoryFilter) {
		filteredPodcasts = allPodcasts.filter((podcast) =>
			podcast.title.toLowerCase().includes(categoryFilter.toLowerCase()),
		);
	}

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

			{/* Latest Episodes Section */}
			<div className="mb-12">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-bold">Latest Episodes</h2>
					<Button variant="ghost" asChild>
						<Link href="/podcasts/episodes" className="group">
							View All Episodes
							<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
						</Link>
					</Button>
				</div>
				<Suspense fallback={<LoadingGridSkeleton />}>
					<HorizontalScroll>
						{latestEpisodes.map((podcast) => (
							<CompactEpisodeCard
								key={podcast.episodeId}
								episode={{
									episodeId: podcast.episodeId,
									episodeTitle: podcast.episodeTitle,
									episodeSlug: podcast.episodeSlug,
									podcastId: podcast.podcastId,
									podcastTitle: podcast.podcastTitle,
									podcastSlug: podcast.podcastSlug,
									podcastImage: podcast.podcastImage,
									episodeImage: podcast.episodeImage,
									enclosureUrl: podcast.enclosureUrl,
									pubDate: podcast.pubDate ? new Date(podcast.pubDate) : null,
								}}
							/>
						))}
					</HorizontalScroll>
				</Suspense>
			</div>

			{/* All Podcasts Section */}
			<div className="mb-12">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-bold">All Podcasts</h2>
				</div>

				{/* Podcast Filter with Loading State */}
				<div className="mb-6">
					<PodcastFilter tags={podcastTags} />
				</div>

				<Suspense fallback={<PodcastGridSkeleton count={15} />}>
					{!categoryFilter && <PodcastGrid podcasts={filteredPodcasts} />}
					{categoryFilter && (
						<>
							{filteredPodcasts.length > 0 ? (
								<PodcastGrid podcasts={filteredPodcasts} />
							) : (
								<div className="text-center py-12">
									<p className="text-muted-foreground">
										No podcasts found matching your criteria.
									</p>
								</div>
							)}
						</>
					)}
				</Suspense>
			</div>
		</div>
	);
}
