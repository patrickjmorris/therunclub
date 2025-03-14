import { notFound } from "next/navigation";
import { getVideosByTag, getEpisodesByTag } from "@/lib/services/tag-service";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Tag } from "lucide-react";
import { EpisodeCard } from "@/components/podcasts/EpisodeCard";

export const revalidate = 3600;

interface TagPageProps {
	params: Promise<{
		type: string;
		tag: string;
	}>;
}

// Define types for the content
interface VideoContent {
	id: string;
	title: string;
	description: string | null;
	thumbnailUrl: string | null;
	publishedAt: Date | null;
	channelTitle: string | null;
	youtubeVideoId: string;
}

interface EpisodeContent {
	id: string;
	title: string;
	podcastId: string;
	episodeSlug: string;
	pubDate: Date | null;
	enclosureUrl: string;
	image: string | null;
	podcastTitle: string;
	podcastSlug: string;
	podcastImage: string | null;
}

export default async function TagPage(props: TagPageProps) {
	const params = await props.params;
	const { type, tag } = params;

	// Decode the tag from the URL
	const decodedTag = decodeURIComponent(tag);

	// Validate content type
	if (type !== "video" && type !== "episode") {
		return notFound();
	}

	// Get content based on type
	let content: VideoContent[] | EpisodeContent[] = [];
	if (type === "video") {
		content = await getVideosByTag(decodedTag, 20);
	} else if (type === "episode") {
		content = await getEpisodesByTag(decodedTag, 20);
	}

	// If no content found, return 404
	if (!content || content.length === 0) {
		return notFound();
	}

	return (
		<div className="container px-4 py-12 md:px-6 md:py-24">
			<div className="mb-12">
				<h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl flex items-center">
					<Tag className="mr-4 h-10 w-10" />
					<span className="capitalize">
						{type}s tagged with "{decodedTag}"
					</span>
				</h1>
				<p className="mt-4 text-xl text-muted-foreground">
					Explore {content.length} {type}
					{content.length !== 1 ? "s" : ""} related to {decodedTag}
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{type === "video" &&
					(content as VideoContent[]).map((video) => (
						<Link
							key={video.id}
							href={`/videos/${video.id}`}
							className="block transition-transform hover:scale-[1.02]"
						>
							<Card className="border dark:border-slate-800 hover:shadow-md transition-shadow">
								<CardHeader>
									<CardTitle className="line-clamp-2">{video.title}</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="relative aspect-video mb-4 rounded-md overflow-hidden">
										<Image
											src={video.thumbnailUrl ?? ""}
											alt={video.title}
											fill
											className="object-cover"
										/>
									</div>
									<p className="text-sm text-muted-foreground mb-2">
										{video.channelTitle}
									</p>
									<div className="flex items-center gap-4 text-sm text-muted-foreground">
										<span className="flex items-center">
											<Clock className="w-4 h-4 mr-1" />
											{formatDistanceToNow(new Date(video.publishedAt ?? ""), {
												addSuffix: true,
											})}
										</span>
										<span>
											{video.publishedAt
												? new Date(video.publishedAt).toLocaleDateString()
												: ""}
										</span>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}

				{type === "episode" &&
					(content as EpisodeContent[]).map((episode) => (
						<EpisodeCard
							key={episode.id}
							episode={{
								episodeId: episode.id,
								episodeTitle: episode.title,
								episodeSlug: episode.episodeSlug,
								podcastId: episode.podcastId,
								podcastTitle: episode.podcastTitle,
								podcastSlug: episode.podcastSlug,
								podcastImage: episode.podcastImage,
								itunesImage: episode.image,
								enclosureUrl: episode.enclosureUrl,
								pubDate: episode.pubDate ? new Date(episode.pubDate) : null,
							}}
						/>
					))}
			</div>
		</div>
	);
}
