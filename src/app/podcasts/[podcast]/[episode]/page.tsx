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

export const revalidate = 86400; // Revalidate every day

interface EpisodePageProps {
	params: Promise<{
		podcast: string;
		episode: string;
	}>;
}

async function AthleteReferencesSection({ episodeId }: { episodeId: string }) {
	try {
		const references = await getEpisodeAthleteReferences(episodeId);
		return <AthleteReferences references={references} />;
	} catch (error) {
		console.error("Error loading athlete references:", error);
		return (
			<MentionError
				title="Error Loading Athletes"
				message="Unable to load athlete references for this episode."
			/>
		);
	}
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

export async function generateMetadata({
	params,
}: EpisodePageProps): Promise<Metadata> {
	const resolvedParams = await params;
	const episode = await getEpisode(resolvedParams.episode);

	if (!episode) return {};

	const imageUrl = episode.image || episode.podcastImage || "";
	const description =
		episode.content?.substring(0, 155) ||
		`Listen to ${episode.title} on The Run Club`;

	return {
		title: episode.title,
		description: description,
		openGraph: {
			type: "article",
			title: episode.title,
			description: description,
			siteName: "The Run Club",
			publishedTime: episode.pubDate
				? new Date(episode.pubDate).toISOString()
				: "",
			modifiedTime: episode.pubDate
				? new Date(episode.pubDate).toISOString()
				: "",
			images: [
				{
					url: imageUrl,
					width: 350,
					height: 350,
					alt: episode.title,
				},
			],
			locale: "en_US",
			authors: episode.podcastAuthor,
		},
		twitter: {
			card: "summary_large_image",
			title: episode.title,
			description: description,
			images: [imageUrl],
		},
		alternates: {
			canonical: `/podcasts/${resolvedParams.podcast}/${resolvedParams.episode}`,
		},
	};
}

// Update link styles function
function addLinkStyles(html: string): string {
	return html.replace(
		/<a\s/g,
		'<a class="text-blue-600 dark:text-blue-400 underline decoration-blue-600/30 dark:decoration-blue-400/30 hover:decoration-blue-600 dark:hover:decoration-blue-400 transition-colors" ',
	);
}

export default async function EpisodePage({ params }: EpisodePageProps) {
	const { podcast: podcastSlug, episode: episodeSlug } = await params;
	const episode = await getEpisode(episodeSlug);

	if (!episode) {
		notFound();
	}

	// Get more episodes from the same podcast
	const moreEpisodes = await getLastTenEpisodesByPodcastSlug(podcastSlug, 3);
	const filteredMoreEpisodes = moreEpisodes.filter(
		(e) => e.episodeSlug !== episodeSlug,
	);

	const date = episode.pubDate ? new Date(episode.pubDate) : new Date();
	const imageUrl = episode.image || episode.podcastImage;
	const duration = episode.duration ? formatDuration(episode.duration) : null;
	const sanitizedContent = addLinkStyles(sanitizeHtml(episode.content ?? ""));
	const urls = extractUrlsFromHtml(sanitizedContent);

	// Start preloading the link previews
	const preloadedData = preloadLinks(urls);

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "PodcastEpisode",
		name: episode.title,
		datePublished: episode.pubDate
			? new Date(episode.pubDate).toISOString()
			: "",
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
			<Card>
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
							<AthleteReferencesSection episodeId={episode.id} />
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
			{filteredMoreEpisodes.length > 0 && (
				<MoreContent
					title={`More from ${episode.podcastTitle}`}
					items={filteredMoreEpisodes.map((e) => ({
						id: e.id,
						title: e.title,
						thumbnailUrl: e.image ?? e.podcastImage ?? undefined,
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
