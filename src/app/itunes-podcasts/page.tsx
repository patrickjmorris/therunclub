import { iTunesPodcast } from "@/lib/itunes-types";
import { formatDistanceToNow } from "date-fns";

async function getITunesPodcasts() {
	const response = await fetch("http://localhost:3000/api/itunes-podcasts");
	if (!response.ok) {
		throw new Error("Failed to fetch podcasts");
	}
	const data = await response.json();
	return data.results as iTunesPodcast[];
}

export default async function ITunesPodcastsPage() {
	const podcasts = await getITunesPodcasts();

	return (
		<div className="container mx-auto py-8">
			<h1 className="text-2xl font-bold mb-6">iTunes Design Podcasts</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{podcasts
					.sort(
						(a, b) =>
							new Date(b.releaseDate).getTime() -
							new Date(a.releaseDate).getTime(),
					)
					.map((podcast) => (
						<div
							key={podcast.collectionId}
							className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
						>
							<div className="aspect-square relative">
								<img
									src={podcast.artworkUrl600}
									alt={podcast.collectionName}
									className="object-cover w-full h-full"
								/>
							</div>

							<div className="p-4">
								<h2 className="font-bold text-lg mb-2">
									{podcast.collectionName}
								</h2>
								<p className="text-sm text-gray-600 mb-2">
									{podcast.artistName}
								</p>

								<div className="flex flex-wrap gap-2 mb-3">
									{podcast.genres.map((genre) => (
										<span
											key={genre}
											className="px-2 py-1 bg-gray-100 rounded-full text-xs"
										>
											{genre}
										</span>
									))}
								</div>

								<div className="text-sm text-gray-500 space-y-1">
									<p>Episodes: {podcast.trackCount}</p>
									<p>
										Updated:{" "}
										{formatDistanceToNow(new Date(podcast.releaseDate), {
											addSuffix: true,
										})}
									</p>
									<p>{podcast.releaseDate}</p>
								</div>

								<div className="mt-4 space-x-2">
									<a
										href={podcast.collectionViewUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-500 hover:text-blue-700 text-sm"
									>
										View in iTunes
									</a>
									<span className="text-gray-300">|</span>
									<a
										href={podcast.feedUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-500 hover:text-blue-700 text-sm"
									>
										RSS Feed
									</a>
								</div>
							</div>
						</div>
					))}
			</div>
		</div>
	);
}
