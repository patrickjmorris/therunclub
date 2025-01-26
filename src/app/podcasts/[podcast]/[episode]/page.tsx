import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEpisode } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Play, Calendar, Clock, Pause } from "lucide-react";
import { FormattedDate } from "@/components/FormattedDate";
import { formatDuration } from "@/lib/formatDuration";
import { EpisodePlayButton } from "@/components/EpisodePlayButton";
import { sanitizeHtml } from "@/lib/sanitize";
import { extractUrlsFromHtml } from "@/lib/extract-urls";
import { LinkPreviewList } from "@/components/LinkPreview";
import { TabsWithState } from "@/components/TabsWithState";
import Image from "next/image";
import { Suspense } from "react";
import { AthleteReferences } from "@/components/athlete-references";
import { MentionLoading } from "@/components/mention-loading";
import { MentionError } from "@/components/mention-error";
import { getEpisodeAthleteReferences } from "@/lib/queries/athlete-mentions";
import { db } from "@/db/client";
import { episodes, podcasts } from "@/db/schema";
import { isNotNull, desc } from "drizzle-orm";
import { eq, and } from "drizzle-orm";
import type { OpenGraphData } from "@/lib/og";
import { cache } from "react";

interface EpisodePageProps {
	params: Promise<{
		podcast: string;
		episode: string;
	}>;
}

// Cache the episode fetch to prevent multiple fetches during build
const getEpisodeCached = cache(async (episodeSlug: string) => {
	try {
		return await getEpisode(episodeSlug);
	} catch (error) {
		console.error(`[Build] Error fetching episode ${episodeSlug}:`, error);
		return null;
	}
});

// Cache athlete references fetch to prevent multiple fetches
const getAthleteReferencesCached = cache(async (episodeId: string) => {
	// Skip fetching during build to prevent failures
	if (process.env.NEXT_PHASE === "build") {
		return [];
	}

	const maxRetries = 3;
	let lastError: unknown;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const references = await getEpisodeAthleteReferences(episodeId);
			return references;
		} catch (error: unknown) {
			lastError = error;
			console.error(
				`[Build] Attempt ${
					attempt + 1
				}/${maxRetries} failed fetching athlete references for episode ${episodeId}:`,
				error,
			);

			// Only wait between retries, not after the last attempt
			if (attempt < maxRetries - 1) {
				await new Promise((resolve) =>
					setTimeout(resolve, 1000 * (attempt + 1)),
				);
			}
		}
	}

	// If all retries failed, return empty array instead of failing
	console.error(
		`[Build] All attempts failed fetching athlete references for episode ${episodeId}:`,
		lastError,
	);
	return [];
});

async function AthleteReferencesSection({ episodeId }: { episodeId: string }) {
	try {
		const references = await getAthleteReferencesCached(episodeId);

		// If we're in build phase or have no references, return null to skip rendering
		if (process.env.NEXT_PHASE === "build" || !references.length) {
			return null;
		}

		return <AthleteReferences references={references} />;
	} catch (error) {
		console.error("[Build] Error in AthleteReferencesSection:", error);
		// During build, return null instead of error UI
		if (process.env.NEXT_PHASE === "build") {
			return null;
		}
		return (
			<MentionError
				title="Error Loading Athletes"
				message="Unable to load athlete references for this episode."
			/>
		);
	}
}

// Create a separate component for link previews that won't fail the build
async function LinkPreviewSection({
	urls,
	podcastsLink,
}: {
	urls: string[];
	podcastsLink?: string;
}) {
	// Skip OpenGraph fetching during build to prevent timeouts
	if (process.env.NEXT_PHASE === "build") {
		return (
			<LinkPreviewList
				urls={urls}
				podcastsLink={podcastsLink}
				preloadedData={{}}
			/>
		);
	}

	// Only fetch OpenGraph data on the client side or during revalidation
	const preloadedOgData: Record<string, OpenGraphData> = {};

	try {
		if (urls.length > 0) {
			// Process URLs in batches of 2 to reduce load
			const batchSize = 2;
			for (let i = 0; i < urls.length; i += batchSize) {
				const batch = urls.slice(i, i + batchSize);
				const fetchPromises = batch.map(async (url) => {
					try {
						const controller = new AbortController();
						const timeoutId = setTimeout(() => controller.abort(), 3000);

						const response = await fetch(
							`${
								process.env.NEXT_PUBLIC_APP_URL || ""
							}/api/og?url=${encodeURIComponent(url)}`,
							{
								next: { revalidate: 86400 },
								signal: controller.signal,
							},
						);

						clearTimeout(timeoutId);
						if (!response.ok) return;

						const data = await response.json();
						if (data && !data.error) {
							preloadedOgData[url] = data;
						}
					} catch {
						// Silently continue on errors
						return;
					}
				});

				await Promise.allSettled(fetchPromises);
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}
	} catch (error) {
		console.error("[Build] Error fetching OpenGraph data:", error);
	}

	return (
		<LinkPreviewList
			urls={urls}
			podcastsLink={podcastsLink}
			preloadedData={preloadedOgData}
		/>
	);
}

export async function generateStaticParams() {
	console.log("[Build] Starting generateStaticParams for podcast episodes");
	try {
		const allPodcasts = await db
			.select({
				podcastSlug: podcasts.podcastSlug,
			})
			.from(podcasts)
			.where(isNotNull(podcasts.podcastSlug));

		console.log(`[Build] Found ${allPodcasts.length} podcasts`);
		const params = [];

		for (const podcast of allPodcasts) {
			try {
				// Get last 10 episodes for each podcast (reduced from 30)
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
				console.log(
					`[Build] Added ${recentEpisodes.length} episodes from podcast ${podcast.podcastSlug}`,
				);
			} catch (error) {
				console.error(
					`[Build] Error processing podcast ${podcast.podcastSlug}:`,
					error,
				);
			}
		}

		console.log(`[Build] Total episodes to build: ${params.length}`);
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
	const episode = await getEpisodeCached(resolvedParams.episode);

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

export const dynamic = "force-static";
export const revalidate = 3600; // Revalidate every hour

export default async function EpisodePage({ params }: EpisodePageProps) {
	try {
		const { episode: episodeSlug } = await params;
		const episode = await getEpisodeCached(episodeSlug);

		if (!episode) {
			notFound();
		}

		const date = episode.pubDate ? new Date(episode.pubDate) : new Date();
		const imageUrl = episode.image || episode.podcastImage;
		const duration = episode.duration ? formatDuration(episode.duration) : null;

		// Extract URLs early and limit to 5 during build
		const sanitizedContent = addLinkStyles(sanitizeHtml(episode.content ?? ""));
		const urls = extractUrlsFromHtml(sanitizedContent).slice(
			0,
			process.env.NEXT_PHASE === "build" ? 5 : 10,
		);

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
							<Suspense
								fallback={<MentionLoading title="Athletes Mentioned" />}
							>
								<AthleteReferencesSection episodeId={episode.id} />
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
														<div className="space-y-4">
															{[...Array(Math.min(urls.length, 3))].map(
																(_, i) => (
																	<div
																		key={`link-preview-skeleton-${
																			urls[i] || i
																		}`}
																		className="h-32 bg-muted animate-pulse rounded-lg"
																	/>
																),
															)}
														</div>
													}
												>
													<LinkPreviewSection
														urls={urls}
														podcastsLink={episode.link || undefined}
													/>
												</Suspense>
											</div>
										),
									},
								]}
							/>
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
			</div>
		);
	} catch (error) {
		console.error("[Build] Error in EpisodePage:", error);
		notFound();
	}
}
