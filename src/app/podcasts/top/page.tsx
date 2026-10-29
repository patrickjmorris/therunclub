import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { JsonLd } from "@/components/common/json-ld";
import { PageBreadcrumbs } from "@/components/common/page-breadcrumbs";
import {
	type RankedPodcastEntry,
	getLatestPodcastRanking,
} from "@/lib/services/podcast-service";
import { absoluteUrl } from "@/config/site";
import { itemList, metaDescription, pageMetadata } from "@/lib/seo";

export const revalidate = 86400;

const PATH = "/podcasts/top";

type EntryLink = { kind: "internal" | "external"; href: string } | null;

function entryLink(entry: RankedPodcastEntry): EntryLink {
	if (entry.podcast) {
		return { kind: "internal", href: `/podcasts/${entry.podcast.slug}` };
	}
	return entry.itunesId
		? {
				kind: "external",
				href: `https://podcasts.apple.com/podcast/id${entry.itunesId}`,
		  }
		: null;
}

export async function generateMetadata(): Promise<Metadata> {
	const ranking = await getLatestPodcastRanking();
	if (!ranking) return {};
	const month = format(new Date(ranking.fetchedAt), "MMMM yyyy");
	const leaders = ranking.entries
		.slice(0, 3)
		.map((entry) => entry.podcastName)
		.join(", ");
	return pageMetadata({
		title: `Top ${ranking.entries.length} Running Podcasts (${month})`,
		description: `The most popular running podcasts right now, ranked: ${leaders}, and more. Updated ${format(
			new Date(ranking.fetchedAt),
			"MMM d, yyyy",
		)}.`,
		path: PATH,
	});
}

export default async function TopPodcastsPage() {
	const ranking = await getLatestPodcastRanking();
	if (!ranking) notFound();
	const updated = format(new Date(ranking.fetchedAt), "MMMM d, yyyy");

	return (
		<div className="container px-4 py-8 md:px-6">
			<PageBreadcrumbs
				items={[
					{ name: "Podcasts", path: "/podcasts" },
					{ name: "Top Running Podcasts", path: PATH },
				]}
			/>
			<JsonLd
				data={itemList(
					"Top running podcasts",
					ranking.entries.map((entry) => {
						const link = entryLink(entry);
						return {
							"@type": "PodcastSeries",
							name: entry.podcast?.title ?? entry.podcastName,
							url:
								link?.kind === "internal" ? absoluteUrl(link.href) : link?.href,
						};
					}),
				)}
			/>

			<div className="mb-8 max-w-3xl">
				<h1 className="text-3xl font-bold">Top Running Podcasts</h1>
				<p className="text-muted-foreground mt-2">
					The {ranking.entries.length} most popular running podcasts, ranked
					from the latest podcast charts and updated {updated}. Tap a show to
					browse its latest episodes on The Run Club.
				</p>
			</div>

			<ol className="space-y-4 max-w-3xl">
				{ranking.entries.map((entry) => (
					<li key={entry.rank}>
						<RankedPodcastCard entry={entry} />
					</li>
				))}
			</ol>
		</div>
	);
}

function RankedPodcastCard({ entry }: { entry: RankedPodcastEntry }) {
	const { podcast } = entry;
	const link = entryLink(entry);
	const title = podcast?.title ?? entry.podcastName;

	return (
		<Card>
			<CardContent className="flex gap-4 p-4">
				<span className="text-3xl font-bold text-muted-foreground w-10 shrink-0 text-center">
					{entry.rank}
				</span>
				{podcast?.image && (
					<Image
						src={podcast.image}
						alt={title}
						width={96}
						height={96}
						className="rounded-md object-cover w-24 h-24 shrink-0"
					/>
				)}
				<div className="min-w-0 space-y-1">
					<h2 className="text-lg font-semibold">
						{link?.kind === "internal" ? (
							<Link href={link.href} className="hover:underline">
								{title}
							</Link>
						) : link ? (
							<a
								href={link.href}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 hover:underline"
							>
								{title}
								<ExternalLink className="h-4 w-4" />
							</a>
						) : (
							title
						)}
					</h2>
					{podcast?.author && (
						<p className="text-sm text-muted-foreground">{podcast.author}</p>
					)}
					{podcast?.description && (
						<p className="text-sm line-clamp-2">
							{metaDescription(podcast.description, "")}
						</p>
					)}
					{podcast?.latestEpisode && (
						<p className="text-sm">
							Latest:{" "}
							<Link
								href={`/podcasts/${podcast.slug}/${podcast.latestEpisode.slug}`}
								className="text-primary hover:underline"
							>
								{podcast.latestEpisode.title}
							</Link>
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
