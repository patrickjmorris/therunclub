import { Skeleton } from "@/components/ui/skeleton";
import {
	LoadingCardSkeleton,
	LoadingGridSkeleton,
} from "@/components/videos/loading-ui";
import { PodcastGridSkeleton } from "@/components/podcasts/PodcastGridSkeleton";

export default function Loading() {
	return (
		<div className="flex flex-col min-h-screen">
			{/* Hero Section Skeleton */}
			<div className="bg-background pt-6 md:pt-12 lg:pt-16">
				<div className="container px-4 md:px-6">
					<div className="flex flex-col items-center text-center space-y-4">
						<Skeleton className="h-12 w-3/4 md:w-1/2 max-w-xl mb-4" />
						<Skeleton className="h-4 w-3/4 md:w-1/2 max-w-xl" />
						<Skeleton className="h-4 w-1/2 md:w-1/3 max-w-md" />
						<div className="flex gap-4 mt-6">
							<Skeleton className="h-10 w-24" />
							<Skeleton className="h-10 w-24" />
						</div>
					</div>
				</div>
			</div>

			{/* Global Search Skeleton */}
			<div className="w-full py-12 bg-background">
				<div className="container px-4 md:px-6">
					<Skeleton className="h-12 w-full max-w-3xl mx-auto" />
				</div>
			</div>

			{/* Videos Section Skeleton */}
			<section className="w-full py-12 md:py-24">
				<div className="container px-4 md:px-6">
					<div className="flex items-center justify-between mb-8">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-10 w-32" />
					</div>
					<div className="flex overflow-hidden space-x-4 pb-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: Just a loading skeleton
								key={`video-skeleton-${i}`}
								className="w-[280px] flex-shrink-0"
							>
								<LoadingCardSkeleton />
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Podcasts Section Skeleton */}
			<section className="w-full py-12 md:py-24 bg-slate-50/50 dark:bg-slate-800/10">
				<div className="container px-4 md:px-6">
					<div className="flex items-center justify-between mb-8">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-10 w-32" />
					</div>
					<div className="flex overflow-hidden space-x-4 pb-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								key={`podcast-skeleton-${
									// biome-ignore lint/suspicious/noArrayIndexKey: Just a loading skeleton
									i
								}`}
								className="w-[280px] flex-shrink-0"
							>
								<LoadingCardSkeleton />
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Featured Channels Section Skeleton */}
			<section className="w-full py-12 md:py-24 bg-white dark:bg-background">
				<div className="container px-4 md:px-6">
					<div className="flex items-center justify-between mb-8">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-10 w-32" />
					</div>
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: Just a loading skeleton
								key={`channel-skeleton-${i}`}
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
		</div>
	);
}
