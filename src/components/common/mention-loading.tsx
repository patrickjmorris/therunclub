import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MentionLoadingProps {
	count?: number;
	title?: string;
}

export function MentionLoading({
	count = 3,
	title = "Loading...",
}: MentionLoadingProps) {
	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">{title}</h3>
			<div className="grid gap-4">
				{Array.from({ length: count }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Skeleton key
					<Card key={i}>
						<CardContent className="p-4">
							<div className="flex items-start gap-4">
								<Skeleton className="h-10 w-10 rounded-full" />
								<div className="flex-1 space-y-2">
									<div className="flex items-center justify-between">
										<Skeleton className="h-4 w-[200px]" />
										<Skeleton className="h-4 w-16" />
									</div>
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-3 w-24" />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
