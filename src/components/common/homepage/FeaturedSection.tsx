import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import {
	FeaturedChannel as FeaturedChannelComponent,
	FeaturedPodcast as FeaturedPodcastComponent,
} from "@/components/videos/featured-channel/index";
import LoadingFeaturedChannel from "@/components/videos/loading-ui";
import { getFeaturedChannels } from "@/lib/services/video-service";
import { getFeaturedPodcasts } from "@/lib/services/podcast-service";
import { createDailyCache } from "@/lib/utils/cache";
import { Skeleton } from "@/components/ui/skeleton";
import { nanoid } from "nanoid";

// Loading state component for featured section
export function FeaturedChannelsSkeleton() {
	// Generate stable keys for skeleton items
	const skeletonKeys = Array.from({ length: 3 }, () => nanoid());

	return (
		<section className="w-full py-12 md:py-24 bg-white dark:bg-background">
			<div className="container px-4 md:px-6">
				<div className="flex items-center justify-between mb-8">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-10 w-32" />
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{skeletonKeys.map((key) => (
						<div
							key={key}
							className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden"
						>
							<div className="h-40 bg-muted animate-pulse" />
							<div className="p-6 space-y-4">
								<Skeleton className="h-6 w-1/2" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
								<div className="flex gap-2 mt-4">
									<Skeleton className="h-10 w-10 rounded-full" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-32" />
										<Skeleton className="h-3 w-24" />
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export function FeaturedPodcastsSkeleton() {
	// Generate stable keys for skeleton items
	const skeletonKeys = Array.from({ length: 3 }, () => nanoid());

	return (
		<section className="w-full py-12 md:py-24 bg-slate-50/50 dark:bg-slate-800/10">
			<div className="container px-4 md:px-6">
				<div className="flex items-center justify-between mb-8">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-10 w-32" />
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{skeletonKeys.map((key) => (
						<div
							key={key}
							className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden"
						>
							<div className="h-40 bg-muted animate-pulse" />
							<div className="p-6 space-y-4">
								<Skeleton className="h-6 w-1/2" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
								<div className="flex gap-2 mt-4">
									<Skeleton className="h-10 w-10 rounded-full" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-32" />
										<Skeleton className="h-3 w-24" />
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

// Define types for the API response
interface FeaturedChannelItem {
	id: string;
	title: string;
	thumbnailUrl: string | null;
	vibrantColor: string | null;
	subscriberCount: string | null;
	viewCount: string | null;
}

interface FeaturedPodcastItem {
	id: string;
	title: string;
	image: string | null;
	podcastSlug: string | null;
	vibrantColor?: string | null;
}

// Cache featured data
const getFeaturedData = createDailyCache(
	async () => {
		const [featuredChannels, featuredPodcasts] = await Promise.all([
			getFeaturedChannels(3),
			getFeaturedPodcasts(3),
		]);

		return { featuredChannels, featuredPodcasts };
	},
	["home-featured-content"],
	["channels", "podcasts", "home"],
);

export async function FeaturedChannelsSection() {
	const { featuredChannels } = await getFeaturedData();

	return (
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
						featuredChannels.map((channel: FeaturedChannelItem) => (
							<Suspense key={channel.id} fallback={<LoadingFeaturedChannel />}>
								<FeaturedChannelComponent channelId={channel.id} />
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
	);
}

export async function FeaturedPodcastsSection() {
	const { featuredPodcasts } = await getFeaturedData();

	return (
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
						featuredPodcasts.map((podcast: FeaturedPodcastItem) => (
							<Suspense key={podcast.id} fallback={<LoadingFeaturedChannel />}>
								<FeaturedPodcastComponent podcastId={podcast.id} />
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
	);
}
