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
import Image from "next/image";
interface EpisodePageProps {
	params: Promise<{
		podcast: string;
		episode: string;
	}>;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ podcast: string; episode: string }>;
}): Promise<Metadata> {
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

export default async function EpisodePage({ params }: EpisodePageProps) {
	const { episode: episodeSlug } = await params;
	const episode = await getEpisode(episodeSlug);

	if (!episode) {
		notFound();
	}

	const date = episode.pubDate ? new Date(episode.pubDate) : new Date();
	const imageUrl = episode.image || episode.podcastImage;
	const duration = episode.duration ? formatDuration(episode.duration) : null;

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
				// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
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
					<div className="prose dark:prose-invert max-w-none overflow-hidden">
						<div
							className="space-y-4 whitespace-pre-wrap break-words"
							// biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized
							dangerouslySetInnerHTML={{
								__html: sanitizeHtml(episode.content ?? ""),
							}}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
