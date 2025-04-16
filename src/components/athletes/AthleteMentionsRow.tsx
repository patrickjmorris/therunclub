import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import { CompactAthleteCard } from "./CompactAthleteCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecentlyMentionedAthletes } from "@/lib/services/athlete-service";
import { nanoid } from "nanoid";

export function AthleteMentionsRowSkeleton() {
	// Generate stable keys for skeleton items (approx 7 fit on a typical screen)
	const skeletonKeys = Array.from({ length: 7 }, () => nanoid());

	return (
		<div className="flex overflow-hidden space-x-4 pb-4">
			{skeletonKeys.map((key) => (
				<div key={key} className="w-[150px] flex-shrink-0">
					<Skeleton className="aspect-square w-full rounded-full mb-2" />
					<Skeleton className="h-4 w-3/4 mx-auto" />
				</div>
			))}
		</div>
	);
}

interface AthleteMentionsRowProps {
	contentType?: "podcast" | "video";
}

export async function AthleteMentionsRow({
	contentType,
}: AthleteMentionsRowProps) {
	const athletes = await getRecentlyMentionedAthletes({
		contentType,
		limit: 10,
	});

	if (!athletes || athletes.length === 0) {
		// Render nothing if no athletes are found for this context
		return null;
	}

	return (
		<HorizontalScroll>
			{athletes.map((athlete) => (
				<CompactAthleteCard key={athlete.slug} athlete={athlete} />
			))}
		</HorizontalScroll>
	);
}
