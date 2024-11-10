import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Video } from "@/db/schema";

interface VideoCardProps {
	video: Video;
	onShare?: (id: string) => Promise<void>;
}

export function VideoCard({ video, onShare }: VideoCardProps) {
	return (
		<Card className="overflow-hidden">
			<Link href={`/videos/${encodeURIComponent(video.id)}`}>
				<CardContent className="p-0">
					<div className="relative aspect-video">
						<Image
							src={video.thumbnailUrl ?? ""}
							alt={video.title}
							fill
							className="object-cover"
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						/>
					</div>
					<div className="p-4">
						<h3 className="font-semibold line-clamp-2">{video.title}</h3>
						<p className="text-sm text-muted-foreground mt-1">
							{video.channelTitle}
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							{formatDistanceToNow(new Date(video.publishedAt ?? ""), {
								addSuffix: true,
							})}
						</p>
					</div>
				</CardContent>
			</Link>
			<CardFooter className="flex justify-end p-4 pt-0">
				<Button variant="ghost" size="sm" onClick={() => onShare?.(video.id)}>
					<Share2 className="h-4 w-4 mr-2" />
					Share
				</Button>
			</CardFooter>
		</Card>
	);
}
