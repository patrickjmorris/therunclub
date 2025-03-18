import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { Clock, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface CompactVideoCardProps {
	video: {
		id: string;
		title: string;
		thumbnailUrl?: string | null;
		publishedAt?: string | Date | null;
		channelTitle?: string | null;
	};
	className?: string;
}

export function CompactVideoCard({
	video,
	className = "",
}: CompactVideoCardProps) {
	return (
		<div className={cn("w-[220px] flex-shrink-0 snap-center", className)}>
			<Card className="h-full transition-shadow hover:shadow-md">
				<Link href={`/videos/${video.id}`} className="flex flex-col h-full">
					<CardContent className="p-3 flex flex-col h-full">
						<div className="relative aspect-video w-full overflow-hidden rounded-md mb-2">
							<Image
								alt={video.title}
								priority={true}
								className="object-cover transition-transform hover:scale-105"
								width={220}
								height={124}
								src={video.thumbnailUrl || "/images/placeholder.png"}
							/>
							<div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
								<Play className="h-10 w-10 text-white" />
							</div>
						</div>
						<div className="space-y-1 flex-1">
							<h3 className="font-medium text-sm line-clamp-2">
								{video.title}
							</h3>
							{video.channelTitle && (
								<p className="text-xs text-muted-foreground line-clamp-1">
									{video.channelTitle}
								</p>
							)}
						</div>
						{video.publishedAt && (
							<div className="flex items-center mt-2 text-xs text-muted-foreground">
								<Clock className="h-3 w-3 mr-1" />
								{formatDistanceToNow(new Date(video.publishedAt), {
									addSuffix: true,
								})}
							</div>
						)}
					</CardContent>
				</Link>
			</Card>
		</div>
	);
}
