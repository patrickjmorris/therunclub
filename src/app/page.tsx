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
import { unstable_cache } from "next/cache";
import { cache } from "react";
import {
	LoadingCardSkeleton,
	LoadingGridSkeleton,
} from "@/components/videos/loading-ui";
import { PodcastGridSkeleton } from "@/components/podcasts/PodcastGridSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Route segment config
export const dynamic = "force-dynamic";
export const revalidate = 1800; // 30 minutes

// Add dynamic metadata
export const metadata = {
	title: "The Run Club - Running Podcasts, Videos & More",
	description:
		"Discover the best running podcasts, videos, and content from top athletes and coaches.",
};

// Cache the data fetching functions with React cache for deduplication
const getHomeData = cache(
	unstable_cache(
		async () => {
			const [podcasts, videos, runClubs, featuredPodcasts, featuredChannels] =
				await Promise.all([
					getNewEpisodes(16),
					getHomeLatestVideos(16),
					getPopularRunClubs(),
					getFeaturedPodcasts(3),
					getFeaturedChannels(),
				]);

			return { podcasts, videos, runClubs, featuredPodcasts, featuredChannels };
		},
		["home-data"],
		{ tags: ["home"], revalidate: 1800 },
	),
);

const getTaggedContent = cache(
	unstable_cache(
		async () => {
			const [topVideoTag] = await getTopTags("video", 14, 1);
			const [topEpisodeTag] = await getTopTags("episode", 14, 1);

			const taggedVideos = topVideoTag
				? await getVideosByTag(topVideoTag.tag, 16)
				: [];
			const taggedEpisodes = topEpisodeTag
				? await getEpisodesByTag(topEpisodeTag.tag, 16)
				: [];

			return { topVideoTag, topEpisodeTag, taggedVideos, taggedEpisodes };
		},
		["tagged-content"],
		{ tags: ["home"], revalidate: 1800 },
	),
);

// Preload functions for eager data fetching
const preloadHomeData = () => {
	void getHomeData();
};

const preloadTaggedContent = () => {
	void getTaggedContent();
};

// Loading components for each section
function VideosSectionSkeleton() {
	return (
		<section className="w-full py-12 md:py-24">
			<div className="container px-4 md:px-6">
				<div className="flex items-center justify-between mb-8">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-10 w-32" />
				</div>
				<HorizontalScroll>
					{Array.from({ length: 6 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: Loading skeleton
						<LoadingCardSkeleton key={i} />
					))}
				</HorizontalScroll>
			</div>
		</section>
	);
}

function PodcastsSectionSkeleton() {
	return (
		<section className="w-full py-12 md:py-24 bg-slate-50/50 dark:bg-slate-800/10">
			<div className="container px-4 md:px-6">
				<div className="flex items-center justify-between mb-8">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-10 w-32" />
				</div>
				<PodcastGridSkeleton count={6} />
			</div>
		</section>
	);
}

function TaggedContentSkeleton() {
	return (
		<>
			<section className="w-full py-12 md:py-24 bg-slate-50 dark:bg-slate-800/20">
				<div className="container px-4 md:px-6">
					<div className="flex items-center justify-between mb-8">
						<div className="flex items-center">
							<Tag className="mr-3 h-8 w-8" />
							<Skeleton className="h-8 w-48" />
						</div>
						<Skeleton className="h-10 w-24" />
					</div>
					<HorizontalScroll>
						{Array.from({ length: 6 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: Loading skeleton
							<LoadingCardSkeleton key={i} />
						))}
					</HorizontalScroll>
				</div>
			</section>
		</>
	);
}

export default async function HomePage() {
	// Eagerly initiate data fetching
	preloadHomeData();
	preloadTaggedContent();

	// Fetch featured data
	const { featuredChannels, featuredPodcasts } = await getHomeData();

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
			<Suspense fallback={<VideosSectionSkeleton />}>
				<VideoSection />
			</Suspense>

			{/* Podcasts Section */}
			<Suspense fallback={<PodcastsSectionSkeleton />}>
				<PodcastSection />
			</Suspense>

			{/* Tagged Content Sections */}
			<Suspense fallback={<TaggedContentSkeleton />}>
				<TaggedContentSection />
			</Suspense>

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

// Separate components for streaming
async function VideoSection() {
	const { videos } = await getHomeData();
	return (
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
	);
}

async function PodcastSection() {
	const { podcasts } = await getHomeData();
	return (
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
	);
}

async function TaggedContentSection() {
	const { topVideoTag, topEpisodeTag, taggedVideos, taggedEpisodes } =
		await getTaggedContent();

	return (
		<>
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
		</>
	);
}
