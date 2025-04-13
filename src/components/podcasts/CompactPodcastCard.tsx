import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { TopRankedPodcast } from "@/lib/services/podcast-service";

interface CompactPodcastCardProps {
	podcast: Pick<TopRankedPodcast, "slug" | "title" | "imageUrl">;
	className?: string;
}

export function CompactPodcastCard({
	podcast,
	className,
}: CompactPodcastCardProps) {
	return (
		<div className={cn("w-[180px] flex-shrink-0 snap-center", className)}>
			<Card className="h-full transition-shadow hover:shadow-md overflow-hidden">
				<Link
					href={`/podcasts/${podcast.slug}`}
					className="flex flex-col h-full group"
				>
					<CardContent className="p-3 flex flex-col h-full">
						<div className="relative aspect-square w-full overflow-hidden rounded-md mb-2">
							<Image
								alt={podcast.title ?? "Podcast Cover"}
								priority={true}
								className="object-cover transition-transform group-hover:scale-105"
								width={180}
								height={180}
								src={podcast.imageUrl || "/podcast-placeholder.png"} // Add placeholder
							/>
						</div>
						<div className="space-y-1 flex-1 mt-auto">
							<h3 className="font-medium text-sm line-clamp-2">
								{podcast.title}
							</h3>
						</div>
					</CardContent>
				</Link>
			</Card>
		</div>
	);
}
