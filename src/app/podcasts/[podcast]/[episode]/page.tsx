import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
	getEpisode,
	getLastTenEpisodesByPodcastSlug,
} from "@/lib/services/podcast-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Play, Calendar, Clock, Pause } from "lucide-react";
import { FormattedDate } from "@/components/FormattedDate";
import { formatDuration } from "@/lib/formatDuration";
import { EpisodePlayButton } from "@/components/EpisodePlayButton";
import { sanitizeHtml } from "@/lib/sanitize";
import { extractUrlsFromHtml } from "@/lib/extract-urls";
import { TabsWithState } from "@/components/TabsWithState";
import Image from "next/image";
import { Suspense } from "react";
import { AthleteReferences } from "@/components/athlete-references";
import { MentionLoading } from "@/components/mention-loading";
import { MentionError } from "@/components/mention-error";
import { getEpisodeAthleteReferences } from "@/lib/services/athlete-service";
import { eq, desc, and, isNotNull, like, gt } from "drizzle-orm";
import { db } from "@/db/client";
import { episodes, podcasts } from "@/db/schema";
import { LinkPreviewClientWrapper } from "@/components/LinkPreviewClientWrapper";
import {
	LinkPreviewPreloader,
	preloadLinks,
} from "@/components/LinkPreviewPreloader";
import { LinkPreviewErrorBoundary } from "@/components/LinkPreviewErrorBoundary";
import { MoreContent } from "@/components/content/more-content";
import { getUserRole } from "@/lib/auth-utils";
import { AthleteMentions } from "@/components/athlete-mentions";
import {
	getAthleteRecentMentions,
	getAthleteData,
	getAllAthletes,
} from "@/lib/services/athlete-service";
import { formatDistanceToNow, format } from "date-fns";
import { createWeeklyCache } from "@/lib/utils/cache";

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

// Create a cached function for fetching episode data
const getEpisodeData = createWeeklyCache(
	async (podcastSlug: string, episodeSlug: string) => {
		const episode = await getEpisode(episodeSlug);

		// Return null if episode doesn't exist or doesn't match podcast
		if (!episode || episode.podcastSlug !== podcastSlug) {
			return null;
		}

		// Get more episodes from the same podcast (fetch 4 to ensure we have enough after filtering)
		const moreEpisodes = await getLastTenEpisodesByPodcastSlug(podcastSlug, 4);
		const filteredMoreEpisodes = moreEpisodes
			.filter((e) => e.episodeSlug !== episodeSlug)
			.slice(0, 3);

		const date = episode.pubDate ? new Date(episode.pubDate) : new Date();
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
	const title = `${episode.title} | ${episode.podcastTitle}`;
	const description = episode.content
		? `${episode.content.substring(0, 155).replace(/<[^>]*>/g, "")}...`
		: `Listen to ${episode.title} on The Run Club`;

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			type: "article",
			images: [
				{
					url: imageUrl,
					width: 350,
					height: 350,
					alt: episode.title,
				},
			],
			audio: episode.enclosureUrl
				? [
						{
							url: episode.enclosureUrl,
							type: "audio/mpeg",
						},
				  ]
				: undefined,
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: imageUrl ? [imageUrl] : undefined,
		},
		alternates: {
			canonical: `/podcasts/${podcastSlug}/${episodeSlug}`,
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

	// Helper function to safely format date
	const safeFormatDate = (
		dateInput: string | Date | null | undefined,
	): string => {
		if (!dateInput) return "";
		try {
			const date = new Date(dateInput);
			return Number.isNaN(date.getTime()) ? "" : date.toISOString();
		} catch {
			return "";
		}
	};

	// Start preloading the link previews
	const preloadedData = preloadLinks(urls);

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "PodcastEpisode",
		name: episode.title,
		datePublished: safeFormatDate(episode.pubDate),
		description:
			episode.content || `Listen to ${episode.title} on The Run Club`,
		duration: episode.duration,
		associatedMedia: {
			"@type": "MediaObject",
			contentUrl: episode.enclosureUrl,
		},
		partOfSeries: {
			"@type": "PodcastSeries",
			name: episode.podcastTitle,
			image: episode.podcastImage,
		},
	};

	return (
		<div className="space-y-8">
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON data is generated server-side and safe
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<Card className="">
				<CardHeader className="flex flex-col lg:flex-row lg:items-start lg:gap-8 px-6">
					<div className="w-full lg:w-[350px] lg:flex-shrink-0">
						<Image
							src={imageUrl ?? ""}
							alt={episode.title}
							width={350}
							height={350}
							className="w-full h-auto rounded-lg"
						/>
					</div>
					<div className="flex-grow mt-6 lg:mt-0">
						<CardTitle className="text-2xl">{episode.title}</CardTitle>
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
						<>
							<LinkPreviewPreloader urls={urls} />
							<TabsWithState
								className="max-w-3xl"
								tabs={[
									{
										value: "description",
										label: "Description",
										content: (
											<div className="prose dark:prose-invert max-w-none overflow-hidden [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:decoration-blue-600/30 dark:[&_a]:decoration-blue-400/30 [&_a:hover]:decoration-blue-600 dark:[&_a:hover]:decoration-blue-400 [&_a]:transition-colors">
												<div
													className="space-y-4 whitespace-pre-wrap break-words"
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
											<div className="space-y-4">
												<Suspense
													fallback={
														<div className="animate-pulse">
															Loading link previews...
														</div>
													}
												>
													<LinkPreviewErrorBoundary
														fallback={
															<div className="text-sm text-muted-foreground">
																Unable to load link previews. You can still
																click the links in the description.
															</div>
														}
													>
														<LinkPreviewClientWrapper
															urls={urls}
															podcastsLink={episode.link ?? undefined}
															preloadedData={preloadedData}
														/>
													</LinkPreviewErrorBoundary>
												</Suspense>
											</div>
										),
									},
								]}
							/>
						</>
					) : (
						<div className="prose dark:prose-invert max-w-3xl overflow-hidden [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:decoration-blue-600/30 dark:[&_a]:decoration-blue-400/30 [&_a:hover]:decoration-blue-600 dark:[&_a:hover]:decoration-blue-400 [&_a]:transition-colors">
							<div
								className="space-y-4 whitespace-pre-wrap break-words"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: Content is sanitized by DOMPurify and processed by addLinkStyles
								dangerouslySetInnerHTML={{
									__html: sanitizedContent,
								}}
							/>
						</div>
					)}
				</CardContent>
			</Card>

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
