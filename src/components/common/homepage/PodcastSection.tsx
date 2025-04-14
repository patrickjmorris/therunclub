import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import { CompactEpisodeCard } from "@/components/podcasts/CompactEpisodeCard";
import { LoadingCardSkeleton } from "@/components/videos/loading-ui";
import { getNewEpisodes } from "@/lib/services/podcast-service";
import { createStandardCache } from "@/lib/utils/cache";
import { Skeleton } from "@/components/ui/skeleton";
import { nanoid } from "nanoid";

// Loading state component
export function PodcastSectionSkeleton() {
	// Generate stable keys for skeleton items
	const skeletonKeys = Array.from({ length: 4 }, () => nanoid());

	return (
		<section className="w-full py-12 md:py-24 bg-slate-50/50 dark:bg-slate-800/10">
			<div className="container px-4 md:px-6">
				<div className="flex items-center justify-between mb-8">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-10 w-32" />
				</div>
				<div className="flex overflow-hidden space-x-4 pb-4">
					{skeletonKeys.map((key) => (
						<div key={key} className="w-[280px] flex-shrink-0">
							<LoadingCardSkeleton />
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

// Cache podcast data
const getPodcastsData = createStandardCache(
	async () => {
		const podcasts = await getNewEpisodes(16);
		return podcasts;
	},
	["home-latest-podcasts"],
	["podcasts", "home"],
);

export async function PodcastSection() {
	const podcasts = await getPodcastsData();

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
								episodeImage: podcast.episodeImage,
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
