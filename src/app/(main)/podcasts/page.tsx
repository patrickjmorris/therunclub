import { FormattedDate } from "@/components/FormattedDate";
import {
	getPodcastMetadata,
	FEEDS,
	getLastEpisode,
} from "../../../lib/episodes";
import Link from "next/link";
export const revalidate = 60 * 60;

export default async function PodcastList() {
	// Use the getPodcastMetadata function to get metadata for each podcast
	// Use the FEEDS array to get the metadata for each podcast
	// Use getLastEpisode function to get the last episode for each podcast
	// Use the parsePodcastFeed function to parse the RSS feed for each podcast

	const data = await Promise.all(
		(
			await Promise.all(
				FEEDS.map(async (feed) => {
					try {
						const metadata = await getPodcastMetadata(feed.url);
						const episodes = await getLastEpisode(feed.url);
						return {
							slug: feed.slug,
							title: metadata.title,
							description: metadata.description,
							image: metadata.image,
							episodes: {
								title: episodes.title,
								pubDate: new Date(episodes.pubDate),
							},
						};
					} catch (error) {
						console.error(`Failed to fetch data for ${feed.url}:`, error);
						return null;
					}
				}),
			)
		).filter((item): item is NonNullable<typeof item> => item !== null),
	);

	// console.log(data)
	return (
		<div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
			<section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:grid-cols-3">
				{data
					.sort(
						(a, b) =>
							b.episodes.pubDate.getTime() - a.episodes.pubDate.getTime(),
					)
					.map((feed) => (
						<div
							key={feed.title}
							className="flex flex-col w-full gap-2 shadow-lg p-4 rounded-lg overflow-hidden dark:border-gray-800 dark:shadow-gray-800/50"
						>
							<Link href={`/podcasts/${feed.slug}`}>
								<img
									alt={feed.title}
									className="object-cover w-full aspect-square rounded-lg overflow-hidden"
									height={100}
									src={feed.image}
									width={100}
								/>
							</Link>
							<div className="flex flex-col gap-1">
								<h1 className="font-bold text-lg md:text-xl">{feed.title}</h1>
								<h2 className="font-semibold text-sm md:text-base line-clamp-2">
									{feed.episodes.title}
								</h2>
								{/* <div className="text-sm text-gray-500 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: feed.description }}> */}
								<FormattedDate
									date={feed.episodes.pubDate}
									className="text-sm text-gray-500 dark:text-gray-400"
								/>
							</div>
						</div>
					))}
			</section>
		</div>
	);
}
