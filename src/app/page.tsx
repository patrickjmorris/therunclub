import { PageHeader } from "@/components/common/page-header";
import { Suspense } from "react";
import { GlobalSearch } from "@/components/common/search/global-search";
import {
	VideoSection,
	VideoSectionSkeleton,
} from "@/components/common/homepage/VideoSection";
import {
	PodcastSection,
	PodcastSectionSkeleton,
} from "@/components/common/homepage/PodcastSection";
import {
	TaggedContentSection,
	TaggedContentSkeleton,
} from "@/components/common/homepage/TaggedContentSection";
import {
	FeaturedChannelsSection,
	FeaturedPodcastsSection,
	FeaturedChannelsSkeleton,
	FeaturedPodcastsSkeleton,
} from "@/components/common/homepage/FeaturedSection";
import {
	TopRankedPodcastsSection,
	TopRankedPodcastsSkeleton,
} from "@/components/common/homepage/TopRankedPodcastsSection";
import {
	AthleteMentionsSection,
	AthleteMentionsSectionSkeleton,
} from "@/components/athletes/AthleteMentionsSection";
import { UpcomingRacesWidget } from "@/components/common/homepage/UpcomingRacesWidget";
import { GearRow } from "@/components/gear/gear-row";
import { queryGear } from "@/lib/db/queries/gear";
import { Skeleton } from "@/components/ui/skeleton";
// import { TopRankedPodcastsSkeleton } from "@/components/podcasts/TopRankedPodcastsRow";

// Route segment config
export const dynamic = "force-static";
export const revalidate = 3600; // 1 hour (down from 24 hours)

// Add dynamic metadata
export const metadata = {
	title: "The Run Club - Running Podcasts, Videos & More",
	description:
		"Discover the best running podcasts, videos, and content from top athletes and coaches.",
};

// Define a simple skeleton for the GearRow
function LatestGearSectionSkeleton() {
	return (
		<section className="py-8 container">
			<div className="mb-4 flex items-center justify-between">
				<Skeleton className="h-8 w-48" /> {/* Title skeleton */}
				<Skeleton className="h-5 w-20" /> {/* View All skeleton */}
			</div>
			<div className="flex space-x-4 overflow-hidden pb-4">
				{[...Array(5)].map((_, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: Static array for skeleton, index is fine
						key={`skeleton-item-${i}`}
						className="w-48 flex-shrink-0 md:w-56"
					>
						<Skeleton className="aspect-square w-full rounded-md" />
						<div className="mt-2 space-y-1">
							<Skeleton className="h-3 w-1/3" /> {/* Brand */}
							<Skeleton className="h-4 w-full" /> {/* Name */}
							<Skeleton className="h-4 w-1/4" /> {/* Price */}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

async function LatestGearSection() {
	const { items: latestGear } = await queryGear({
		limit: 20,
		sort: "newest",
	});

	return (
		<GearRow
			title="Latest Gear"
			items={latestGear}
			ctaLink="/gear"
			className="container"
		/>
	);
}

export default function HomePage() {
	return (
		<div className="flex flex-col min-h-screen">
			{/* Hero Section */}
			{/* <PageHeader /> */}

			{/* Global Search Section */}
			{/* <section className="w-full py-12 bg-background">
				<div className="container px-4 md:px-6">
					<GlobalSearch />
				</div>
			</section> */}

			{/* Top Ranked Podcasts Section */}
			<Suspense fallback={<TopRankedPodcastsSkeleton />}>
				<TopRankedPodcastsSection />
			</Suspense>

			{/* Recently Mentioned Athletes Section */}
			<Suspense fallback={<AthleteMentionsSectionSkeleton />}>
				<AthleteMentionsSection />
			</Suspense>

			{/* Videos Section with Suspense */}
			<Suspense fallback={<VideoSectionSkeleton />}>
				<VideoSection />
			</Suspense>

			{/* Podcasts Section with Suspense */}
			<Suspense fallback={<PodcastSectionSkeleton />}>
				<PodcastSection />
			</Suspense>

			{/* Tagged Content Sections with Suspense */}
			<Suspense fallback={<TaggedContentSkeleton />}>
				<TaggedContentSection />
			</Suspense>

			{/* Featured Channels Section with Suspense */}
			<Suspense fallback={<FeaturedChannelsSkeleton />}>
				<FeaturedChannelsSection />
			</Suspense>

			{/* Featured Podcasts Section with Suspense */}
			<Suspense fallback={<FeaturedPodcastsSkeleton />}>
				<FeaturedPodcastsSection />
			</Suspense>

			{/* === NEW Latest Gear Section === */}
			<Suspense fallback={<LatestGearSectionSkeleton />}>
				<LatestGearSection />
			</Suspense>
			{/* ============================== */}

			<UpcomingRacesWidget />
		</div>
	);
}
