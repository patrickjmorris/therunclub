import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Headphones, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
	getLatestVideos,
	getNewEpisodes,
	getPopularRunClubs,
} from "@/db/queries";
import { PageHeader } from "@/components/page-header";
import { GlobalSearch } from "@/components/search/global-search";

export default async function HomePage() {
	const [podcasts, videos, runClubs] = await Promise.all([
		getNewEpisodes(),
		getLatestVideos(),
		getPopularRunClubs(),
	]);

	return (
		<div className="flex flex-col min-h-screen">
			{/* Hero Section */}
			<PageHeader />

			{/* Global Search Section */}
			<section className="w-full py-12 bg-background">
				<div className="container px-4 md:px-6">
					<GlobalSearch />
				</div>
			</section>

			{/* Videos Section */}
			<section className="w-full py-12 md:py-24 bg-muted/50">
				<div className="container px-4 md:px-6">
					<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">
						Latest Videos
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{videos.map((video) => (
							<Card
								key={video.id}
								className="group relative overflow-hidden border-1 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl bg-card hover:bg-card/80"
							>
								<Link href={`/videos/${video.id}`}>
									<CardContent className="p-0">
										<div className="relative aspect-video">
											<Image
												src={video.thumbnailUrl ?? ""}
												alt={video.title}
												fill
												className="object-cover brightness-90 group-hover:brightness-100 transition-all duration-300"
												sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
											/>
											<div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
										</div>
										<div className="p-6">
											<h3 className="font-bold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
												{video.title}
											</h3>
											<p className="text-sm text-muted-foreground mt-1">
												{video.channelTitle}
											</p>
											<div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
												<span className="flex items-center">
													<Clock className="w-4 h-4 mr-1" />
													{formatDistanceToNow(
														new Date(video.publishedAt ?? ""),
														{
															addSuffix: true,
														},
													)}
												</span>
											</div>
											<Button
												className="w-full mt-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
												variant="default"
											>
												<Play className="mr-2 h-4 w-4" />
												Watch Now
											</Button>
										</div>
									</CardContent>
								</Link>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Podcasts Row */}
			<section className="w-full py-12 md:py-24">
				<div className="container px-4 md:px-6">
					<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">
						Featured Podcasts
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{podcasts.map((podcast) => (
							<Card
								key={podcast.episodeSlug}
								className="group relative overflow-hidden border-0 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl bg-card hover:bg-card/80"
							>
								<Link
									href={`/podcasts/${podcast.podcastSlug}/${podcast.episodeSlug}`}
								>
									<CardContent className="p-0">
										<div className="relative aspect-video">
											<Image
												src={podcast.podcastImage ?? ""}
												alt={podcast.podcastTitle}
												fill
												className="object-cover brightness-90 group-hover:brightness-100 transition-all duration-300"
												sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
											/>
											<div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
										</div>
										<div className="p-6">
											<h3 className="font-bold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
												{podcast.podcastTitle}
											</h3>
											<p className="text-sm text-muted-foreground mt-1">
												{podcast.episodeTitle}
											</p>
											<div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
												<span className="flex items-center">
													<Clock className="w-4 h-4 mr-1" />
													{podcast.pubDate
														? formatDistanceToNow(new Date(podcast.pubDate), {
																addSuffix: true,
														  })
														: ""}
												</span>
											</div>
											<Button
												className="w-full mt-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
												variant="default"
											>
												<Headphones className="mr-2 h-4 w-4" />
												Listen Now
											</Button>
										</div>
									</CardContent>
								</Link>
							</Card>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
