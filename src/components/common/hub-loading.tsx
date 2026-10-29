import { Skeleton } from "@/components/ui/skeleton";
import { LoadingGridSkeleton } from "@/components/videos/loading-ui";

export function HubLoading() {
	return (
		<div className="container space-y-6 py-8">
			<Skeleton className="h-10 w-64" />
			<Skeleton className="h-4 w-96 max-w-full" />
			<LoadingGridSkeleton count={9} />
		</div>
	);
}
