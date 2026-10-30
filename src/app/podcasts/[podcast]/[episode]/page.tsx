import { SpotSportsCta } from "@/components/spot-sports/spot-sports-cta";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
	getEpisode,
	getLastTenEpisodesByPodcastSlug,
} from "@/lib/services/podcast-service";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Play, Calendar, Clock, Pause } from "lucide-react";
import { FormattedDate } from "@/components/common/formatted-date";
import { formatDuration } from "@/lib/formatDuration";
import { EpisodePlayButton } from "@/components/podcasts/episode-play-button";
import { sanitizeHtml } from "@/lib/sanitize";
import { extractUrlsFromHtml } from "@/lib/extract-urls";
import { TabsWithState } from "@/components/common/tabs-with-state";
import Image from "next/image";
import { Suspense } from "react";
import { AthleteReferences } from "@/components/athletes/athlete-references";
import { MentionLoading } from "@/components/common/mention-loading";
import { eq, desc, and, isNotNull, like, gt } from "drizzle-orm";
import { db } from "@/db/client";
import { episodes, podcasts } from "@/db/schema";
import { MoreContent } from "@/components/common/content/more-content";
import { createWeeklyCache } from "@/lib/utils/cache";
import { LinkPreviewList } from "@/components/common/link-preview/link-preview";
import { JsonLd } from "@/components/common/json-ld";
import { absoluteUrl } from "@/config/site";
import {
	breadcrumbList,
	isoDuration,
	metaDescription,
	pageMetadata,
} from "@/lib/seo";

export const dynamic = "force-static";
export const revalidate = 604800;

interface EpisodePageProps {
	params: Promise<{
		podcast: string;
		episode: string;
	}>;
}

export async function generateStaticParams() {
	// console.log("[Build] Starting generateStaticParams for podcast episodes");
	try {
		const allPodcasts = await db
			.select({
				podcastSlug: podcasts.podcastSlug,
			})
			.from(podcasts)
			.where(like(podcasts.language, "%en%"));

		// console.log(`[Build] Found ${allPodcasts.length} podcasts`);
		const params = [];

		for (const podcast of allPodcasts) {
			try {
				const oneYearAgo = new Date();
				oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

				const recentEpisodes = await db
					.select({
						episodeSlug: episodes.episodeSlug,
					})
					.from(episodes)
					.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
					.where(
						and(
							isNotNull(episodes.episodeSlug),
							eq(podcasts.podcastSlug, podcast.podcastSlug),
							gt(episodes.pubDate, oneYearAgo),
						),
					)
					.orderBy(desc(episodes.pubDate))
					.limit(10);

				// Add each episode to params
				for (const episode of recentEpisodes) {
					if (episode.episodeSlug) {
						params.push({
							podcast: podcast.podcastSlug,
							episode: episode.episodeSlug,
						});
					}
				}
				// console.log(
				// 	`[Build] Added ${recentEpisodes.length} episodes from podcast ${podcast.podcastSlug}`,
				// );
			} catch (error) {
				console.error(
					`[Build] Error processing podcast ${podcast.podcastSlug}:`,
					error,
				);
			}
		}

		// console.log(`[Build] Total episodes to build: ${params.length}`);
		return params;
	} catch (error) {
		console.error("[Build] Error in generateStaticParams:", error);
		return []; // Return empty array instead of failing
	}
}

// Helper function to safely handle dates with configurable fallback
const safeHandleDate = (
	dateInput: string | Date | null | undefined,
	options: { returnEmpty?: boolean } = {},
): string => {
	if (!dateInput) return options.returnEmpty ? "" : new Date().toISOString();
	try {
		const date = new Date(dateInput);
		if (Number.isNaN(date.getTime())) {
			return options.returnEmpty ? "" : new Date().toISOString();
		}
		return date.toISOString();
	} catch {
		return options.returnEmpty ? "" : new Date().toISOString();
	}
};

// Create a cached function for fetching episode data
const getEpisodeData = createWeeklyCache(
	async (podcastSlug: string, episodeSlug: string) => {
		const episode = await getEpisode(podcastSlug, episodeSlug);
		if (!episode) return null;

		// Get more episodes from the same podcast (fetch 4 to ensure we have enough after filtering)
		const moreEpisodes = await getLastTenEpisodesByPodcastSlug(podcastSlug, 4);
		const filteredMoreEpisodes = moreEpisodes
			.filter((e) => e.episodeSlug !== episodeSlug)
			.slice(0, 3);

		const date = safeHandleDate(episode.pubDate);
		const imageUrl = episode.image || episode.podcastImage || "";
		const duration = episode.duration ? formatDuration(episode.duration) : null;
		const sanitizedContent = sanitizeHtml(episode.content ?? "");
		const urls = extractUrlsFromHtml(sanitizedContent);

		return {
			episode,
			moreEpisodes: filteredMoreEpisodes,
			date,
			imageUrl,
			duration,
			sanitizedContent,
			urls,
		};
	},
	["episode-detail"],
	["episodes"],
);

export async function generateMetadata({
	params,
}: EpisodePageProps): Promise<Metadata> {
	const { podcast: podcastSlug, episode: episodeSlug } = await params;
	const data = await getEpisodeData(podcastSlug, episodeSlug);

	if (!data) {
		return {
			title: "Episode Not Found",
			description: "The episode you're looking for could not be found.",
		};
	}

	const { episode, imageUrl } = data;
	const metadata = pageMetadata({
		title: `${episode.title} | ${episode.podcastTitle}`,
		description: metaDescription(
			episode.content,
			`Listen to ${episode.title} on The Run Club`,
		),
		path: `/podcasts/${podcastSlug}/${episodeSlug}`,
		images: imageUrl ? [{ url: imageUrl, alt: episode.title }] : undefined,
		type: "article",
	});
	return {
		...metadata,
		openGraph: {
			...metadata.openGraph,
			audio: [{ url: episode.enclosureUrl, type: "audio/mpeg" }],
		},
	};
}

export default async function EpisodePage({ params }: EpisodePageProps) {
	const { podcast: podcastSlug, episode: episodeSlug } = await params;
	const data = await getEpisodeData(podcastSlug, episodeSlug);

	if (!data) {
		notFound();
	}

	const {
		episode,
		moreEpisodes,
		date,
		imageUrl,
		duration,
		sanitizedContent,
		urls,
	} = data;

	const episodePath = `/podcasts/${episode.podcastSlug}/${episode.episodeSlug}`;
	const podcastPath = `/podcasts/${episode.podcastSlug}`;
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "PodcastEpisode",
		name: episode.title,
		url: absoluteUrl(episodePath),
		datePublished: safeHandleDate(episode.pubDate, { returnEmpty: true }),
		description: metaDescription(
			episode.content,
			`Listen to ${episode.title} on The Run Club`,
		),
		image: imageUrl || undefined,
		associatedMedia: {
			"@type": "MediaObject",
			contentUrl: episode.enclosureUrl,
			duration: isoDuration(episode.duration),
		},
		partOfSeries: {
			"@type": "PodcastSeries",
			name: episode.podcastTitle,
			url: absoluteUrl(podcastPath),
			image: episode.podcastImage || undefined,
		},
	};

	return (
		<div className="space-y-8">
			<JsonLd
				data={[
					jsonLd,
					breadcrumbList([
						{ name: "Podcasts", path: "/podcasts" },
						{ name: episode.podcastTitle, path: podcastPath },
						{ name: episode.title, path: episodePath },
					]),
				]}
			/>
			<Card className="">
				<CardHeader className="flex flex-col lg:flex-row lg:items-start lg:gap-8 px-6">
					<div className="w-full lg:w-[350px] lg:shrink-0">
						<Image
							src={imageUrl ?? ""}
							alt={episode.title}
							width={350}
							height={350}
							className="w-full h-auto rounded-lg"
						/>
					</div>
					<div className="grow mt-6 lg:mt-0">
						<h1 className="text-2xl font-semibold leading-tight tracking-tight">
							{episode.title}
						</h1>
						<div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
							<div className="flex items-center">
								<Calendar className="mr-2 h-4 w-4" />
								<FormattedDate date={date} />
							</div>
							{duration && (
								<div className="flex items-center">
									<Clock className="mr-2 h-4 w-4" />
									{duration}
								</div>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex gap-4">
						<EpisodePlayButton
							episode={episode}
							className="flex items-center gap-2"
							playing={
								<>
									<Pause className="mr-2 h-4 w-4 fill-current" />
									<span aria-hidden="true">Playing</span>
								</>
							}
							paused={
								<>
									<Play className="mr-2 h-4 w-4 fill-current" />
									<span aria-hidden="true">Play Episode</span>
								</>
							}
						/>
					</div>
					<Separator />
					<div className="mt-8">
						<Suspense fallback={<MentionLoading title="Athletes Mentioned" />}>
							<AthleteReferences
								contentId={episode.id}
								contentType="podcast"
								title="Athletes Mentioned"
							/>
						</Suspense>
					</div>
					{urls.length > 0 ? (
						<TabsWithState
							className="max-w-3xl"
							tabs={[
								{
									value: "description",
									label: "Description",
									content: (
										<div className="prose dark:prose-invert max-w-none overflow-hidden [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:decoration-blue-600/30 dark:[&_a]:decoration-blue-400/30 [&_a:hover]:decoration-blue-600 dark:[&_a:hover]:decoration-blue-400 [&_a]:transition-colors">
											<div
												className="space-y-4 whitespace-pre-wrap wrap-break-word"
												// biome-ignore lint/security/noDangerouslySetInnerHtml: Content is sanitized by DOMPurify and processed by addLinkStyles
												dangerouslySetInnerHTML={{
													__html: sanitizedContent,
												}}
											/>
										</div>
									),
								},
								{
									value: "links",
									label: `Links (${urls.length})`,
									content: (
										<LinkPreviewList
											urls={urls}
											podcastsLink={episode.link ?? undefined}
										/>
									),
								},
							]}
						/>
					) : (
						<div className="prose dark:prose-invert max-w-3xl overflow-hidden [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:decoration-blue-600/30 dark:[&_a]:decoration-blue-400/30 [&_a:hover]:decoration-blue-600 dark:[&_a:hover]:decoration-blue-400 [&_a]:transition-colors">
							<div
								className="space-y-4 whitespace-pre-wrap wrap-break-word"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: Content is sanitized by DOMPurify and processed by addLinkStyles
								dangerouslySetInnerHTML={{
									__html: sanitizedContent,
								}}
							/>
						</div>
					)}
				</CardContent>
			</Card>

			<SpotSportsCta placement="episode_detail" />

			{/* More Episodes Section */}
			{moreEpisodes.length > 0 && (
				<MoreContent
					title={`More from ${episode.podcastTitle}`}
					items={moreEpisodes.map((e) => ({
						id: e.id,
						title: e.title,
						thumbnailUrl: e.episodeImage ?? e.podcastImage ?? undefined,
						publishedAt: e.pubDate ? new Date(e.pubDate) : undefined,
						duration: e.duration ?? undefined,
						type: "episode",
						podcastSlug: e.podcastSlug ?? undefined,
						episodeSlug: e.episodeSlug ?? undefined,
					}))}
				/>
			)}
		</div>
	);
}
