import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "../ui/card";
import { nanoid } from "nanoid";

export function LoadingCardSkeleton() {
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

export function LoadingGridSkeleton({ count = 6 }: { count?: number }) {
	// Generate stable keys for skeleton items
	const keys = Array.from({ length: count }, () => nanoid());

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{keys.map((key) => (
				<LoadingCardSkeleton key={key} />
			))}
		</div>
	);
}

export default function LoadingFeaturedChannel() {
	return (
		<div className="container mx-auto p-4 max-w-2xl">
			<Card className="overflow-hidden">
				{/* Hero Section Skeleton */}
				<div className="relative h-[300px] w-full bg-muted">
					<div className="absolute inset-0">
						<div className="absolute top-4 left-4 flex items-center gap-3">
							<Skeleton className="h-12 w-12 rounded-lg" />
							<div className="space-y-2">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-24" />
							</div>
						</div>
						<div className="absolute bottom-8 left-0 w-full flex flex-col items-center space-y-2">
							<Skeleton className="h-8 w-64" />
							<Skeleton className="h-4 w-32" />
						</div>
					</div>
				</div>

				{/* Videos Grid Skeleton */}
				<div className="p-4">
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="aspect-video w-full rounded-md" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-3 w-24" />
							</div>
						))}
					</div>
				</div>
			</Card>
		</div>
	);
}
