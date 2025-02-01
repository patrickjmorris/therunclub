import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Headphones } from "lucide-react";
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

	// Get featured podcasts
	const featuredPodcasts = await getFeaturedPodcasts(4);

	const podcasts = query
		? await searchEpisodesWithPodcasts(query)
		: await getNewEpisodes(25);

	return (
		<div className="container py-8 md:py-12">
			{/* Search Section */}
			<div className="flex items-center justify-between mb-8">
				<PodcastFilter />
				<AddContentWrapper defaultTab="podcast" />
			</div>
			{/* Featured Channels Section */}
			<div className="mb-12">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-bold">Featured Channels</h2>
					<Button variant="ghost" asChild>
						<Link href="/podcasts" className="group">
							View All Podcasts
							<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
						</Link>
					</Button>
				</div>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{featuredPodcasts.map((podcast) => (
						<Link
							key={`featured-${podcast.id}`}
							href={`/podcasts/${podcast.podcastSlug}`}
							className="transition-opacity hover:opacity-80"
						>
							<Card className="hover:shadow-md transition-all border-border/40 hover:border-border/80 bg-card/50 hover:bg-card">
								<CardContent className="p-4">
									<div className="flex flex-col items-center text-center gap-4">
										<div className="relative w-20 h-20">
											<div className="absolute inset-0">
												<Image
													src={podcast.image || "/images/placeholder.png"}
													alt={podcast.title}
													width={80}
													height={80}
													className="rounded-lg object-cover w-full h-full shadow-sm"
												/>
											</div>
										</div>
										<div>
											<h3 className="font-semibold line-clamp-1">
												{podcast.title}
											</h3>
										</div>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			</div>
			<Suspense fallback={<LoadingGridSkeleton />}>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{podcasts.map((podcast) => (
						<Card
							key={podcast.episodeId}
							className="group hover:shadow-lg transition-all"
						>
							<Link
								href={`/podcasts/${podcast.podcastSlug}/${podcast.episodeSlug}`}
							>
								<CardHeader className="space-y-4">
									<div className="aspect-square relative overflow-hidden rounded-lg">
										<Image
											alt={podcast.podcastTitle ?? ""}
											className="object-cover transition-transform group-hover:scale-105"
											height={400}
											src={podcast.podcastImage || podcast.itunesImage || ""}
											width={400}
										/>
									</div>
									<div className="space-y-2">
										<CardTitle className="line-clamp-1">
											{podcast.podcastTitle}
										</CardTitle>
										{podcast.episodeTitle && (
											<p className="text-sm text-muted-foreground line-clamp-2">
												Latest: {podcast.episodeTitle}
											</p>
										)}
									</div>
								</CardHeader>
								<CardContent className="space-y-2">
									{podcast.pubDate && (
										<FormattedDate
											date={new Date(podcast.pubDate)}
											className="text-sm text-muted-foreground"
										/>
									)}
									<Button variant="secondary" className="w-full">
										<Headphones className="mr-2 h-4 w-4" />
										Listen Now
									</Button>
								</CardContent>
							</Link>
						</Card>
					))}
				</div>
			</Suspense>
		</div>
	);
}
