import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface VideoCardProps {
	id: string;
	title: string;
	channelTitle: string;
	thumbnailUrl: string;
	publishedAt: string;
	onShare?: (id: string) => Promise<void>;
}

export function VideoCard({
	id,
	title,
	channelTitle,
	thumbnailUrl,
	publishedAt,
	onShare,
}: VideoCardProps) {
	return (
		<Card className="overflow-hidden">
			<Link href={`/videos/${encodeURIComponent(id)}`}>
				<CardContent className="p-0">
					<div className="relative aspect-video">
						<Image
							src={thumbnailUrl}
							alt={title}
							fill
							className="object-cover"
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						/>
					</div>
					<div className="p-4">
						<h3 className="font-semibold line-clamp-2">{title}</h3>
						<p className="text-sm text-muted-foreground mt-1">{channelTitle}</p>
						<p className="text-xs text-muted-foreground mt-1">
							{formatDistanceToNow(new Date(publishedAt), { addSuffix: true })}
						</p>
					</div>
				</CardContent>
			</Link>
			<CardFooter className="flex justify-end p-4 pt-0">
				<Button variant="ghost" size="sm" onClick={() => onShare?.(id)}>
					<Share2 className="h-4 w-4 mr-2" />
					Share
				</Button>
			</CardFooter>
		</Card>
	);
}
