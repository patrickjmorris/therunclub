import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PodcastGridSkeletonProps {
	count?: number;
	className?: string;
}

export function PodcastGridSkeleton({
	count = 10,
	className,
}: PodcastGridSkeletonProps) {
	return (
		<div
			className={cn(
				"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
				className,
			)}
		>
			<PodcastSkeletonItem />
			<PodcastSkeletonItem />
			<PodcastSkeletonItem />
			<PodcastSkeletonItem />
			<PodcastSkeletonItem />
			<PodcastSkeletonItem />
			<PodcastSkeletonItem />
			<PodcastSkeletonItem />
			<PodcastSkeletonItem />
			<PodcastSkeletonItem />
			{count > 10 && (
				<>
					<PodcastSkeletonItem />
					<PodcastSkeletonItem />
					<PodcastSkeletonItem />
					<PodcastSkeletonItem />
					<PodcastSkeletonItem />
				</>
			)}
		</div>
	);
}

function PodcastSkeletonItem() {
	return (
		<Card className="h-full">
			<CardContent className="p-3 flex flex-col h-full">
				<Skeleton className="aspect-square w-full rounded-md mb-2" />
				<div className="space-y-2 flex-1">
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-3 w-full" />
					<Skeleton className="h-3 w-2/3" />
				</div>
				<div className="flex items-center justify-between mt-2">
					<Skeleton className="h-3 w-1/3" />
					<Skeleton className="h-4 w-4 rounded-full" />
				</div>
			</CardContent>
		</Card>
	);
}
