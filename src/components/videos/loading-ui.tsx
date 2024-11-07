import { Skeleton } from "@/components/ui/skeleton";

export function VideoCardSkeleton() {
	return (
		<div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
			<div className="aspect-video bg-muted animate-pulse" />
			<div className="p-4">
				<Skeleton className="h-4 w-3/4 mb-2" />
				<Skeleton className="h-3 w-1/2" />
			</div>
		</div>
	);
}

export function VideoGridSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{Array.from({ length: 6 }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: Need skeleton
				<VideoCardSkeleton key={`skeleton-${i}`} />
			))}
		</div>
	);
}
