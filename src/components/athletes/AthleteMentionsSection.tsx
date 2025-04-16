import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";
import {
	AthleteMentionsRow,
	AthleteMentionsRowSkeleton,
} from "./AthleteMentionsRow";
import { Suspense } from "react";

// Loading state component for the entire section
export function AthleteMentionsSectionSkeleton() {
	return (
		<section className="w-full py-12 md:py-16 bg-slate-50/50 dark:bg-slate-800/10">
			<div className="container px-4 md:px-6">
				<div className="flex items-center justify-between mb-8">
					<Skeleton className="h-8 w-64" /> {/* Skeleton for title */}
					<Skeleton className="h-10 w-32" /> {/* Skeleton for button */}
				</div>
				<AthleteMentionsRowSkeleton />
			</div>
		</section>
	);
}

interface AthleteMentionsSectionProps {
	contentType?: "podcast" | "video";
	title?: string;
	showViewAllLink?: boolean;
}

export function AthleteMentionsSection({
	contentType,
	title = "Recently Mentioned Athletes",
	showViewAllLink = true,
}: AthleteMentionsSectionProps) {
	return (
		<section className="w-full py-12 md:py-16 bg-slate-50/50 dark:bg-slate-800/10">
			<div className="container px-4 md:px-6">
				<div className="flex items-center justify-between mb-8">
					<h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
						{title}
					</h2>
					{showViewAllLink && (
						<Button variant="outline" asChild>
							<Link href="/athletes">
								View All Athletes
								<ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					)}
				</div>
				<Suspense fallback={<AthleteMentionsRowSkeleton />}>
					<AthleteMentionsRow contentType={contentType} />
				</Suspense>
			</div>
		</section>
	);
}
