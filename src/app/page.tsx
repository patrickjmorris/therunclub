import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Headphones, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { GlobalSearch } from "@/components/search/global-search";
import {
	getFeaturedChannels,
	getHomeLatestVideos,
} from "@/lib/services/video-service";
import {
	FeaturedChannel,
	FeaturedPodcast,
} from "@/components/featured-channel/index";
import { Suspense } from "react";
import LoadingFeaturedChannel from "@/components/videos/loading-ui";
import {
	getFeaturedPodcasts,
	getNewEpisodes,
} from "@/lib/services/podcast-service";
import { getPopularRunClubs } from "@/lib/services/club-service";
import { ListenNowButton } from "@/components/ListenNowButton";
import { EpisodeCard } from "@/components/podcasts/EpisodeCard";

export const revalidate = 3600;

export default async function HomePage() {
	const [podcasts, videos, runClubs, featuredPodcasts, featuredChannels] =
		await Promise.all([
			getNewEpisodes(),
			getHomeLatestVideos(),
			getPopularRunClubs(),
			getFeaturedPodcasts(3),
			getFeaturedChannels(),
		]);

	return (
		<div className="flex flex-col min-h-screen">
			{/* Hero Section */}
			<PageHeader />

			{/* Global Search Section */}
			<section className="w-full py-12 bg-background">
				<div className="container px-4 md:px-6">
					<GlobalSearch />
				</div>
			</section>

			{/* Videos Section */}
			<section className="w-full py-12 md:py-24">
				<div className="container px-4 md:px-6">
					<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">
						Latest Videos
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{videos.map((video) => (
							<Link
								key={video.id}
								href={`/videos/${video.id}`}
								className="block transition-transform hover:scale-[1.02]"
							>
								<Card>
									<CardHeader>
										<CardTitle className="line-clamp-2">
											{video.title}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="relative aspect-video mb-4">
											<Image
												src={video.thumbnailUrl ?? ""}
												alt={video.title}
												fill
												className="object-cover rounded-md"
											/>
										</div>
										<p className="text-sm text-muted-foreground mb-2">
											{video.channelTitle}
										</p>
										<div className="flex items-center gap-4 text-sm text-muted-foreground">
											<span className="flex items-center">
												<Clock className="w-4 h-4 mr-1" />
												{formatDistanceToNow(
													new Date(video.publishedAt ?? ""),
													{
														addSuffix: true,
													},
												)}
											</span>
											<span>
												{video.publishedAt
													? new Date(video.publishedAt).toLocaleDateString()
													: ""}
											</span>
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</div>
			</section>

			{/* Podcasts Row */}
			<section className="w-full py-12 md:py-24">
				<div className="container px-4 md:px-6">
					<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">
						Latest Episodes
					</h2>
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
									itunesImage: podcast.episodeImage,
									enclosureUrl: podcast.enclosureUrl,
									pubDate: podcast.pubDate ? new Date(podcast.pubDate) : null,
								}}
							/>
						))}
					</div>
				</div>
			</section>

			{/* Featured Channels Section */}
			<section className="w-full py-12 md:py-24 bg-slate-50">
				<div className="container px-4 md:px-6">
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
							Featured Channels
						</h2>
						<Button variant="ghost" asChild>
							<Link href="/videos/channels" className="group">
								View All Channels
								<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
							</Link>
						</Button>
					</div>
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{featuredChannels && featuredChannels.length > 0 ? (
							featuredChannels.map((channel) => (
								<Suspense
									key={channel.id}
									fallback={<LoadingFeaturedChannel />}
								>
									<FeaturedChannel channelId={channel.id} />
								</Suspense>
							))
						) : (
							<p className="text-muted-foreground">
								No featured channels available.
							</p>
						)}
					</div>
				</div>
			</section>

			{/* Featured Podcasts Section */}
			<section className="w-full py-12 md:py-24">
				<div className="container px-4 md:px-6">
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
							Featured Podcasts
						</h2>
						<Button variant="ghost" asChild>
							<Link href="/podcasts" className="group">
								View All Podcasts
								<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
							</Link>
						</Button>
					</div>
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{featuredPodcasts && featuredPodcasts.length > 0 ? (
							featuredPodcasts.map((podcast) => (
								<Suspense
									key={podcast.id}
									fallback={<LoadingFeaturedChannel />}
								>
									<FeaturedPodcast podcastId={podcast.id} />
								</Suspense>
							))
						) : (
							<p className="text-muted-foreground">
								No featured podcasts available.
							</p>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}
