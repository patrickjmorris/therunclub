import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingClubs() {
	return (
		<div className="container py-8">
			<div className="flex justify-between items-center mb-8">
				<div>
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-64 mt-2" />
				</div>
				<Skeleton className="h-10 w-24" />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{Array.from({ length: 6 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: needed for skeleton
					<Card key={i} className="flex flex-col">
						<CardHeader>
							<Skeleton className="h-6 w-3/4" />
							<Skeleton className="h-4 w-1/2 mt-2" />
						</CardHeader>
						<CardContent className="flex-grow space-y-4">
							<Skeleton className="h-20 w-full" />
							<div className="flex gap-2">
								<Skeleton className="h-6 w-16" />
								<Skeleton className="h-6 w-16" />
								<Skeleton className="h-6 w-16" />
							</div>
						</CardContent>
						<CardFooter className="flex gap-2">
							<Skeleton className="h-9 w-20" />
							<Skeleton className="h-9 w-20" />
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	);
}
