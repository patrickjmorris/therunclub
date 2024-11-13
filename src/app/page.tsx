import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Headphones,
	Video,
	PersonStanding,
	Dumbbell,
	Users,
	Clock,
	MapPin,
} from "lucide-react";
import Link from "next/link";
import {
	getNewEpisodes,
	getLatestVideos,
	getPopularRunClubs,
} from "@/db/queries";

export const revalidate = 3600; // 60 minutes in seconds

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
			<section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-primary">
				<div className="container px-4 md:px-6">
					<div className="flex flex-col items-center space-y-4 text-center">
						<h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
							Welcome to the Run Club
						</h1>
						<p className="mx-auto max-w-[700px] text-zinc-200 md:text-xl">
							Discover amazing podcasts and stay tuned for exciting new features
							coming soon!
						</p>
						<Button className="bg-white text-primary hover:bg-zinc-200">
							<Link href="/podcasts">Explore Now</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Videos Section */}
			<section className="w-full py-12 md:py-24">
				<div className="container px-4 md:px-6">
					<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">
						Latest Videos
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{videos.map((video) => (
							<Link
								key={video.id}
								href={`/videos/${video.id}`}
								className="block transition-transform hover:scale-[1.02]"
							>
								<Card>
									<CardHeader>
										<CardTitle className="line-clamp-2">
											{video.title}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="relative aspect-video mb-4">
											<Image
												src={video.thumbnailUrl ?? ""}
												alt={video.title}
												fill
												className="object-cover rounded-md"
											/>
										</div>
										<p className="text-sm text-muted-foreground mb-2">
											{video.channelTitle}
										</p>
										<div className="flex items-center gap-4 text-sm text-muted-foreground">
											<span className="flex items-center">
												<Clock className="w-4 h-4 mr-1" />
												{formatDistanceToNow(
													new Date(video.publishedAt ?? ""),
													{
														addSuffix: true,
													},
												)}
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
							<Link
								key={podcast.episodeSlug}
								href={`/podcasts/${podcast.podcastSlug}/${podcast.episodeSlug}`}
								className="block transition-transform hover:scale-[1.02]"
							>
								<Card>
									<CardHeader>
										<CardTitle>{podcast.podcastTitle}</CardTitle>
									</CardHeader>
									<CardContent>
										<Image
											src={podcast.podcastImage ?? ""}
											alt={podcast.podcastTitle}
											width={192}
											height={192}
											className="w-48 h-48 object-cover mb-4 rounded-md mx-auto"
										/>
										<p className="text-muted-foreground">
											{podcast.episodeTitle}
										</p>
										<p className="text-sm text-muted-foreground mb-2">
											{podcast.pubDate
												? new Date(podcast.pubDate).toLocaleDateString()
												: ""}
										</p>
										<Button className="mt-4" variant="outline">
											<Headphones className="mr-2 h-4 w-4" />
											Listen Now
										</Button>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</div>
			</section>

			{/* Run Clubs Section */}
			<section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
				<div className="container px-4 md:px-6">
					<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">
						Popular Run Clubs
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{runClubs.map((club) => (
							<Link
								key={club.id}
								href={`/clubs/${club.id}`}
								className="block transition-transform hover:scale-[1.02]"
							>
								<Card>
									<CardHeader>
										<CardTitle>{club.clubName}</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="relative h-48 mb-4">
											{/* <Image
												src={club.location.city}
												alt={club.clubName}
												fill
												className="object-cover rounded-md"
											/> */}
										</div>
										<p className="text-muted-foreground mb-4 line-clamp-2">
											{club.description}
										</p>
										<div className="flex items-center justify-between text-sm text-muted-foreground">
											<span className="flex items-center">
												<MapPin className="w-4 h-4 mr-1" />
												{club.location.city}, {club.location.state}
											</span>
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</div>
			</section>

			{/* Coming Soon Section */}
			<section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
				<div className="container px-4 md:px-6">
					<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">
						Coming Soon
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						{[
							{ name: "Video", icon: Video },
							{ name: "Runners", icon: PersonStanding },
							{ name: "Training", icon: Dumbbell },
							{ name: "Clubs", icon: Users },
						].map((item) => (
							<Card key={item.name} className="text-center">
								<CardContent className="pt-6">
									<item.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
									<h3 className="text-lg font-semibold">{item.name}</h3>
									<p className="text-sm text-muted-foreground mt-2">
										Exciting features on the way!
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
