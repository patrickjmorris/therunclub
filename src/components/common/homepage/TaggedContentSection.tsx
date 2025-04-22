import { Button } from "@/components/ui/button";
import { ArrowRight, Tag } from "lucide-react";
import Link from "next/link";
import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import { CompactVideoCard } from "@/components/videos/CompactVideoCard";
import { CompactEpisodeCard } from "@/components/podcasts/CompactEpisodeCard";
import { LoadingCardSkeleton } from "@/components/videos/loading-ui";
import {
	getTopTags,
	getVideosByTag,
	getEpisodesByTag,
} from "@/lib/services/tag-service";
import { createDailyCache } from "@/lib/utils/cache";
import { Skeleton } from "@/components/ui/skeleton";
import { nanoid } from "nanoid";

// Loading state component
export function TaggedContentSkeleton() {
	// Generate stable keys for skeleton items
	const skeletonKeys = Array.from({ length: 4 }, () => nanoid());

	return (
		<section className="w-full py-12 md:py-24 bg-slate-50 dark:bg-slate-800/20">
			<div className="container px-4 md:px-6">
				<div className="flex items-center justify-between mb-8">
					<div className="flex items-center gap-2">
						<Tag className="h-6 w-6" />
						<Skeleton className="h-8 w-64" />
					</div>
					<Skeleton className="h-10 w-24" />
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

// Cache tagged content data
const getTaggedContentData = createDailyCache(
	async () => {
		// Get top tags for video and podcasts in parallel
		const [topVideoTag, topEpisodeTag] = await Promise.all([
			getTopTags("video", 7, 1).then((tags) => tags[0] || null),
			getTopTags("episode", 7, 1).then((tags) => tags[0] || null),
		]);

		// Fetch tagged content in parallel if tags exist
		const [taggedVideos, taggedEpisodes] = await Promise.all([
			topVideoTag ? getVideosByTag(topVideoTag.tag, 16) : Promise.resolve([]),
			topEpisodeTag
				? getEpisodesByTag(topEpisodeTag.tag, 16)
				: Promise.resolve([]),
		]);

		return { topVideoTag, topEpisodeTag, taggedVideos, taggedEpisodes };
	},
	["home-tagged-content"],
	["tags", "home"],
);

export async function TaggedContentSection() {
	const { topVideoTag, topEpisodeTag, taggedVideos, taggedEpisodes } =
		await getTaggedContentData();

	return (
		<>
			{topVideoTag && taggedVideos.length > 0 && (
				<section className="w-full py-12 md:py-24 bg-slate-50 dark:bg-slate-800/20">
					<div className="container px-4 md:px-6">
						<div className="flex items-center justify-between mb-8">
							<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl flex items-center">
								<Tag className="mr-3 h-8 w-8" />
								<span>Top Videos: {topVideoTag.tag}</span>
							</h2>
							<Button variant="ghost" asChild>
								<Link
									href={`/tags/video/${encodeURIComponent(topVideoTag.tag)}`}
									className="group"
								>
									View All
									<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
								</Link>
							</Button>
						</div>
						<HorizontalScroll>
							{taggedVideos.map((video) => (
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
			)}

			{topEpisodeTag && taggedEpisodes.length > 0 && (
				<section className="w-full py-12 md:py-24 bg-white dark:bg-background">
					<div className="container px-4 md:px-6">
						<div className="flex items-center justify-between mb-8">
							<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl flex items-center">
								<Tag className="mr-3 h-8 w-8" />
								<span>Top Episodes: {topEpisodeTag.tag}</span>
							</h2>
							<Button variant="ghost" asChild>
								<Link
									href={`/tags/episode/${encodeURIComponent(
										topEpisodeTag.tag,
									)}`}
									className="group"
								>
									View All
									<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
								</Link>
							</Button>
						</div>
						<HorizontalScroll>
							{taggedEpisodes.map((episode) => (
								<CompactEpisodeCard
									key={episode.id}
									episode={{
										episodeId: episode.id,
										episodeTitle: episode.title,
										episodeSlug: episode.episodeSlug,
										podcastId: episode.podcastId,
										podcastTitle: episode.podcastTitle,
										podcastSlug: episode.podcastSlug,
										podcastImage: episode.podcastImage,
										episodeImage: episode.image,
										enclosureUrl: episode.enclosureUrl,
										pubDate: episode.pubDate ? new Date(episode.pubDate) : null,
									}}
								/>
							))}
						</HorizontalScroll>
					</div>
				</section>
			)}
		</>
	);
}
