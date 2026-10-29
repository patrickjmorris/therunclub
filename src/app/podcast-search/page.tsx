import { PodcastSearch } from "@/components/podcasts/podcast-search";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = {
	...pageMetadata({
		title: "Podcast Search",
		description: "Search the Podcast Index for running podcasts.",
		path: "/podcast-search",
	}),
	robots: { index: false, follow: true },
};

export default function PodcastSearchPage() {
	return (
		<div className="container mx-auto py-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">
					Podcast Search (Podcast Index API)
				</h1>
				<Link
					href="/itunes-podcasts"
					className="text-blue-500 hover:text-blue-700"
				>
					View iTunes Podcasts
				</Link>
			</div>
			<PodcastSearch />
		</div>
	);
}
