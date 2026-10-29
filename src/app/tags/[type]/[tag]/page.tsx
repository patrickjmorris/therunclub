import { notFound } from "next/navigation";
import {
	type TagHub,
	getEpisodesByTag,
	getTagHubs,
	getVideosByTag,
	tagHubPath,
} from "@/lib/services/tag-service";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Tag } from "lucide-react";
import { EpisodeCard } from "@/components/podcasts/EpisodeCard";
import { itemList, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/common/json-ld";
import { PageBreadcrumbs } from "@/components/common/page-breadcrumbs";
import type { Metadata } from "next";

const TYPE_LABELS = {
	episode: { noun: "Podcast Episodes", source: "podcasts", verb: "Listen to" },
	video: { noun: "Videos", source: "YouTube channels", verb: "Watch" },
} as const;

async function findHub(params: TagPageProps["params"]) {
	const { type, tag } = await params;
	const decodedTag = decodeURIComponent(tag);
	const hubs = await getTagHubs();
	const hub = hubs.find(
		(entry) => entry.type === type && entry.tag === decodedTag,
	);
	const sibling = hubs.find(
		(entry) => entry.type !== type && entry.tag === decodedTag,
	);
	return { hub, sibling };
}

function hubTitle(hub: TagHub) {
	const label = hub.tag.replace(/\b\w/g, (c) => c.toUpperCase());
	const { noun } = TYPE_LABELS[hub.type];
	return /running/i.test(label)
		? `${label} ${noun}`
		: `${label} Running ${noun}`;
}

export async function generateMetadata(props: TagPageProps): Promise<Metadata> {
	const { hub } = await findHub(props.params);
	if (!hub) return {};
	const { noun, source, verb } = TYPE_LABELS[hub.type];
	return pageMetadata({
		title: hubTitle(hub),
		description: `${verb} ${hub.count.toLocaleString(
			"en-US",
		)} running ${noun.toLowerCase()} about ${
			hub.tag
		} from top running ${source}, newest first.`,
		path: tagHubPath({ type: hub.type, tag: hub.canonicalTag }),
	});
}

export const dynamic = "force-static";
export const revalidate = 86400;

const PAGE_SIZE = 24;

interface TagPageProps {
	params: Promise<{
		type: string;
		tag: string;
	}>;
}

export default async function TagPage(props: TagPageProps) {
	const { hub, sibling } = await findHub(props.params);
	if (!hub) notFound();

	const [videos, episodes] = await Promise.all([
		hub.type === "video" ? getVideosByTag(hub.tag, PAGE_SIZE) : [],
		hub.type === "episode" ? getEpisodesByTag(hub.tag, PAGE_SIZE) : [],
	]);
	const { noun, source } = TYPE_LABELS[hub.type];
	const title = hubTitle(hub);
	const items = [
		...videos.map((video) => ({
			name: video.title,
			path: `/videos/${video.id}`,
			source: video.channelTitle,
		})),
		...episodes.map((episode) => ({
			name: episode.title,
			path: `/podcasts/${episode.podcastSlug}/${episode.episodeSlug}`,
			source: episode.podcastTitle,
		})),
	];
	const sources = [
		...new Set(items.flatMap((item) => (item.source ? [item.source] : []))),
	].slice(0, 3);

	return (
		<div className="container px-4 py-12 md:px-6 md:py-24">
			<PageBreadcrumbs
				items={[
					{ name: "Running Topics", path: "/tags" },
					{ name: title, path: tagHubPath(hub) },
				]}
			/>
			<JsonLd
				data={itemList(
					title,
					items.map(({ name, path }) => ({ name, path })),
				)}
			/>
			<div className="mb-12 max-w-3xl">
				<h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl flex items-center">
					<Tag className="mr-4 h-10 w-10 shrink-0" />
					<span>{title}</span>
				</h1>
				<p className="mt-4 text-xl text-muted-foreground">
					{hub.count.toLocaleString("en-US")} {noun.toLowerCase()} about{" "}
					{hub.tag} from running {source}
					{sources.length > 0 && <>, including {sources.join(", ")}</>}. The{" "}
					{items.length} newest are below.
				</p>
				{sibling && (
					<p className="mt-2">
						<Link
							href={tagHubPath(sibling)}
							className="text-primary hover:underline"
						>
							{sibling.count.toLocaleString("en-US")} {hub.tag}{" "}
							{TYPE_LABELS[sibling.type].noun.toLowerCase()} →
						</Link>
					</p>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{videos.map((video) => (
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
										width={400}
										height={225}
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

				{episodes.map((episode) => (
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
							episodeImage: episode.image,
							enclosureUrl: episode.enclosureUrl,
							pubDate: episode.pubDate ? new Date(episode.pubDate) : null,
						}}
					/>
				))}
			</div>
		</div>
	);
}
