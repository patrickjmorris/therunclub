import Image from "next/image";
import { Play, SkipBack, SkipForward, Pause } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { getLastTenEpisodes, getPodcastMetadata } from "@/lib/episodes";
import Link from "next/link";
import { AboutSection } from "@/components/AboutSection";
import { slugify } from "@/lib/utils";
import Parser from "rss-parser";
import { FormattedDate } from "@/components/FormattedDate";

export default async function PodcastLayout() {
	const data = await getPodcastMetadata(
		"https://anchor.fm/s/9085ecc/podcast/rss",
	);
	// console.log(data)

	const episodes = await getLastTenEpisodes(
		"https://anchor.fm/s/9085ecc/podcast/rss",
	);

	return (
		<div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 text-slate-900">
			{/* Left Panel (1/4 width, independently scrollable) */}
			<div className="lg:w-1/4 lg:overflow-y-auto lg:h-screen lg:pt-6">
				<Card className="bg-slate-50 p-6 lg:min-h-screen">
					<div className="sticky top-0">
						<div className="mb-4">
							<Link
								href={`/podcasts/${slugify(data.title)}`}
								className="relative block w-48 mx-auto overflow-hidden rounded-lg shadow-xl bg-slate-200 shadow-slate-200 sm:w-64 sm:rounded-xl lg:w-auto lg:rounded-2xl"
								aria-label="Homepage"
							>
								<img
									className="w-full"
									src={data.image}
									alt=""
									width={400}
									height={400}
									sizes="(min-width: 1024px) 20rem, (min-width: 640px) 16rem, 12rem"
								/>
								<div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10 sm:rounded-xl lg:rounded-2xl" />
							</Link>
						</div>
						<h2 className="text-2xl font-bold mb-2">{data.title}</h2>
						<AboutSection description={data.description} />
						<div>
							<h3 className="text-sm uppercase text-gray-500 mb-2">
								HOSTED BY
							</h3>
							<p>{data.author}</p>
						</div>
					</div>
				</Card>
			</div>

			{/* Right Panel (3/4 width) */}
			<div className="lg:w-3/4 p-6 space-y-6 overflow-y-auto lg:h-screen">
				<h2 className="text-3xl font-bold">Episodes</h2>
				{episodes.map((episode) => (
					<Card className="bg-gray-100" key={episode.title}>
						<CardContent className="p-4">
							<div className="flex space-x-4">
								<Image
									src={episode.itunes.image || data.image}
									alt={episode.title}
									width={200}
									height={200}
									className="rounded"
								/>
								<div>
									<FormattedDate date={new Date(episode.pubDate)} />
									<h3 className="text-lg font-semibold mb-2">
										{episode.title}
									</h3>
									<div
										className="text-sm text-gray-400 line-clamp-3 prose prose-slate"
										// biome-ignore lint/security/noDangerouslySetInnerHtml: We want to use the HTML content to apply styling
										dangerouslySetInnerHTML={{
											__html: episode.description,
										}}
									/>
									<div className="mt-2 space-x-2">
										<Button variant="secondary" size="sm">
											<Play className="h-4 w-4 mr-2" />
											Play Episode
										</Button>
										<Button variant="outline" size="sm">
											Show notes
										</Button>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
				{/* Media Player */}
				<div className="fixed inset-x-0 bottom-0 z-10 lg:left-112 xl:left-120">
					{/* <AudioPlayer /> */}
				</div>{" "}
			</div>
		</div>
	);
}
