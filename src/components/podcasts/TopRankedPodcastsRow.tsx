import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import { CompactPodcastCard } from "./CompactPodcastCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getTopRankedPodcasts } from "@/lib/services/podcast-service";
import { nanoid } from "nanoid";

export function TopRankedPodcastsSkeleton() {
	// Generate stable keys for skeleton items
	const skeletonKeys = Array.from({ length: 6 }, () => nanoid()); // Show 6 skeletons

	return (
		<section className="w-full py-8 md:py-12">
			<div className="container px-4 md:px-6">
				<div className="flex items-center justify-between mb-6">
					<Skeleton className="h-8 w-48" /> {/* Skeleton for title */}
				</div>
				<div className="flex overflow-hidden space-x-4 pb-4">
					{skeletonKeys.map((key) => (
						<div key={key} className="w-[180px] flex-shrink-0">
							<Skeleton className="aspect-square w-full rounded-md mb-2" />
							<Skeleton className="h-4 w-3/4" />
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export async function TopRankedPodcastsRow() {
	const topPodcasts = await getTopRankedPodcasts();

	if (!topPodcasts || topPodcasts.length === 0) {
		// Optionally render nothing or a message if no ranked podcasts are found
		return null;
	}

	return (
		<HorizontalScroll>
			{topPodcasts.map((podcast) => (
				<CompactPodcastCard
					key={podcast.taddyUuid || podcast.id} // Use Taddy UUID as key, fallback to internal ID
					podcast={{
						slug: podcast.slug,
						title: podcast.title,
						imageUrl: podcast.imageUrl,
					}}
				/>
			))}
		</HorizontalScroll>
	);
}
