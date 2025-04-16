import { LoadingCardSkeleton } from "@/components/videos/loading-ui";
import { Skeleton } from "@/components/ui/skeleton";
import { nanoid } from "nanoid";
import { TopRankedPodcastsRow } from "@/components/podcasts/TopRankedPodcastsRow";
// Loading state component
export function TopRankedPodcastsSkeleton() {
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

export async function TopRankedPodcastsSection() {
	return (
		<section className="w-full py-12 md:py-24 bg-slate-50/50 dark:bg-slate-800/10">
			<div className="container px-4 md:px-6">
				<div className="flex items-center justify-between mb-8">
					<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl flex items-center">
						<span>Explore Top Ranked Podcasts</span>
					</h2>
				</div>
				<TopRankedPodcastsRow />
			</div>
		</section>
	);
}
