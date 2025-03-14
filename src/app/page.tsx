import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Headphones, Clock, ArrowRight, Tag } from "lucide-react";
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
import { CompactEpisodeCard } from "@/components/podcasts/CompactEpisodeCard";
import { CompactVideoCard } from "@/components/videos/CompactVideoCard";
import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import {
	getTopTags,
	getVideosByTag,
	getEpisodesByTag,
} from "@/lib/services/tag-service";

export const revalidate = 3600;

export default async function HomePage() {
	const [podcasts, videos, runClubs, featuredPodcasts, featuredChannels] =
		await Promise.all([
			getNewEpisodes(16),
			getHomeLatestVideos(16),
			getPopularRunClubs(),
			getFeaturedPodcasts(3),
			getFeaturedChannels(),
		]);

	// Get top tags and content for those tags
	const [topVideoTag] = await getTopTags("video", 14, 1);
	const [topEpisodeTag] = await getTopTags("episode", 14, 1);

	// Get content for top tags if they exist
	const taggedVideos = topVideoTag
		? await getVideosByTag(topVideoTag.tag, 16)
		: [];
	const taggedEpisodes = topEpisodeTag
		? await getEpisodesByTag(topEpisodeTag.tag, 16)
		: [];

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
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
							Latest Videos
						</h2>
						<Button variant="ghost" asChild>
							<Link href={"/videos"} className="group">
								View All Videos
								<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
							</Link>
						</Button>
					</div>
					<HorizontalScroll>
						{videos.map((video) => (
							<CompactVideoCard
								key={video.id}
								video={{
									id: video.id,
									title: video.title,
									thumbnailUrl: video.thumbnailUrl,
									publishedAt: video.publishedAt,
									channelTitle: video.channelTitle,
								}}
							/>
						))}
					</HorizontalScroll>
				</div>
			</section>

			{/* Podcasts Row */}
			<section className="w-full py-12 md:py-24 bg-slate-50/50 dark:bg-slate-800/10">
				<div className="container px-4 md:px-6">
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
							Latest Episodes
						</h2>
						<Button variant="ghost" asChild>
							<Link href={"/podcasts"} className="group">
								View All Episodes
								<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
							</Link>
						</Button>
					</div>

					<HorizontalScroll>
						{podcasts.map((podcast) => (
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
									itunesImage: podcast.episodeImage,
									enclosureUrl: podcast.enclosureUrl,
									pubDate: podcast.pubDate ? new Date(podcast.pubDate) : null,
								}}
							/>
						))}
					</HorizontalScroll>
				</div>
			</section>

			{/* Top Tagged Videos Section */}
			{topVideoTag && taggedVideos.length > 0 && (
				<section className="w-full py-12 md:py-24 bg-slate-50 dark:bg-slate-800/20">
					<div className="container px-4 md:px-6">
						<div className="flex items-center justify-between mb-8">
							<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl flex items-center">
								<Tag className="mr-3 h-8 w-8" />
								<span>Top Videos: {topVideoTag.tag}</span>
							</h2>
							<Button variant="ghost" asChild>
								<Link
									href={`/tags/video/${encodeURIComponent(topVideoTag.tag)}`}
									className="group"
								>
									View All
									<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
								</Link>
							</Button>
						</div>
						<HorizontalScroll>
							{taggedVideos.map((video) => (
								<CompactVideoCard
									key={video.id}
									video={{
										id: video.id,
										title: video.title,
										thumbnailUrl: video.thumbnailUrl,
										publishedAt: video.publishedAt,
										channelTitle: video.channelTitle,
									}}
								/>
							))}
						</HorizontalScroll>
					</div>
				</section>
			)}

			{/* Top Tagged Episodes Section */}
			{topEpisodeTag && taggedEpisodes.length > 0 && (
				<section className="w-full py-12 md:py-24 bg-white dark:bg-background">
					<div className="container px-4 md:px-6">
						<div className="flex items-center justify-between mb-8">
							<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl flex items-center">
								<Tag className="mr-3 h-8 w-8" />
								<span>Top Episodes: {topEpisodeTag.tag}</span>
							</h2>
							<Button variant="ghost" asChild>
								<Link
									href={`/tags/episode/${encodeURIComponent(
										topEpisodeTag.tag,
									)}`}
									className="group"
								>
									View All
									<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
								</Link>
							</Button>
						</div>
						<HorizontalScroll>
							{taggedEpisodes.map((episode) => (
								<CompactEpisodeCard
									key={episode.id}
									episode={{
										episodeId: episode.id,
										episodeTitle: episode.title,
										episodeSlug: episode.episodeSlug,
										podcastId: episode.podcastId,
										podcastTitle: episode.podcastTitle,
										podcastSlug: episode.podcastSlug,
										podcastImage: episode.podcastImage,
										itunesImage: episode.image,
										enclosureUrl: episode.enclosureUrl,
										pubDate: episode.pubDate ? new Date(episode.pubDate) : null,
									}}
								/>
							))}
						</HorizontalScroll>
					</div>
				</section>
			)}

			{/* Featured Channels Section */}
			<section className="w-full py-12 md:py-24 bg-white dark:bg-background">
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
			<section className="w-full py-12 md:py-24 bg-slate-50/50 dark:bg-slate-800/10">
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
