import { FormattedDate } from "@/components/FormattedDate";
import {
	getPodcastMetadata,
	FEEDS,
	getLastEpisode,
} from "../../../lib/episodes";
import Link from "next/link";
import { getAllPodcastAndLastEpisodes, getDebugData } from "@/db/queries";

export const revalidate = 60 * 60;

export default async function PodcastList() {
	try {
		const podcasts = await getAllPodcastAndLastEpisodes();

		return (
			<div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:grid-cols-3">
					{podcasts.map((podcast) => (
						<div
							key={podcast.podcastId}
							className="flex flex-col w-full gap-2 shadow-lg p-4 rounded-lg overflow-hidden dark:border-gray-800 dark:shadow-gray-800/50"
						>
							<Link href={`/podcasts/${podcast.podcastId}`}>
								<img
									alt={podcast.title}
									className="object-cover w-full aspect-square rounded-lg overflow-hidden"
									height={100}
									src={podcast.image ?? ""}
									width={100}
								/>
							</Link>
							<div className="flex flex-col gap-1">
								<h1 className="font-bold text-lg md:text-xl">
									{podcast.title}
								</h1>
								<h2 className="font-semibold text-sm md:text-base line-clamp-2">
									{podcast.episodeTitle}
								</h2>
								{podcast.episodePubDate && (
									<FormattedDate
										date={new Date(podcast.episodePubDate)}
										className="text-sm text-gray-500 dark:text-gray-400"
									/>
								)}
							</div>
						</div>
					))}
				</section>
			</div>
		);
	} catch (error) {
		console.error("Error in PodcastList component:", error);
		return (
			<div>
				An error occurred while loading podcasts. Please try again later.
			</div>
		);
	}
}
