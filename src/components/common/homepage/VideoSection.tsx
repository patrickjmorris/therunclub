import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import { CompactVideoCard } from "@/components/videos/CompactVideoCard";
import { LoadingCardSkeleton } from "@/components/videos/loading-ui";
import { getHomeLatestVideos } from "@/lib/services/video-service";
import { createStandardCache } from "@/lib/utils/cache";
import { Skeleton } from "@/components/ui/skeleton";
import { nanoid } from "nanoid";

// Loading state component
export function VideoSectionSkeleton() {
	// Generate stable keys for skeleton items
	const skeletonKeys = Array.from({ length: 4 }, () => nanoid());

	return (
		<section className="w-full py-12 md:py-24">
			<div className="container px-4 md:px-6">
				<div className="flex items-center justify-between mb-8">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-10 w-32" />
				</div>
				<div className="flex overflow-hidden space-x-4 pb-4">
					{skeletonKeys.map((key) => (
						<div key={key} className="w-[280px] flex-shrink-0">
							<LoadingCardSkeleton />
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

// Cache video data
const getVideosData = createStandardCache(
	async () => {
		const videos = await getHomeLatestVideos(16);
		return videos;
	},
	["home-latest-videos"],
	["videos", "home"],
);

export async function VideoSection() {
	const videos = await getVideosData();

	return (
		<section className="w-full py-12 md:py-24">
			<div className="container px-4 md:px-6">
				<div className="flex items-center justify-between mb-8">
					<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
						Latest Videos
					</h2>
					<Button variant="ghost" asChild>
						<Link href={"/videos"} className="group">
							View All Videos
							<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
						</Link>
					</Button>
				</div>
				<HorizontalScroll>
					{videos.map((video) => (
						<CompactVideoCard
							key={video.id}
							video={{
								id: video.id,
								title: video.title,
								thumbnailUrl: video.thumbnailUrl,
								publishedAt: video.publishedAt,
								channelTitle: video.channelTitle,
							}}
						/>
					))}
				</HorizontalScroll>
			</div>
		</section>
	);
}
