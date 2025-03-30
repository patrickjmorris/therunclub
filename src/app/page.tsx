import { PageHeader } from "@/components/page-header";
import { Suspense } from "react";
import { GlobalSearch } from "@/components/search/global-search";
import {
	VideoSection,
	VideoSectionSkeleton,
} from "@/components/homepage/VideoSection";
import {
	PodcastSection,
	PodcastSectionSkeleton,
} from "@/components/homepage/PodcastSection";
import {
	TaggedContentSection,
	TaggedContentSkeleton,
} from "@/components/homepage/TaggedContentSection";
import {
	FeaturedChannelsSection,
	FeaturedPodcastsSection,
	FeaturedChannelsSkeleton,
	FeaturedPodcastsSkeleton,
} from "@/components/homepage/FeaturedSection";

// Route segment config
export const dynamic = "force-static";
export const revalidate = 86400; // 24 hours (up from 30 minutes)

// Add dynamic metadata
export const metadata = {
	title: "The Run Club - Running Podcasts, Videos & More",
	description:
		"Discover the best running podcasts, videos, and content from top athletes and coaches.",
};

export default function HomePage() {
	return (
		<div className="flex flex-col min-h-screen">
			{/* Hero Section */}
			<PageHeader />

			{/* Global Search Section */}
			<section className="w-full py-12 bg-background">
				<div className="container px-4 md:px-6">
					<GlobalSearch />
				</div>
			</section>

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
		</div>
	);
}
