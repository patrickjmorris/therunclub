"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { BasicVideo } from "@/types/shared";

interface VideoCardProps {
	video: BasicVideo;
	onShare?: (id: string) => Promise<void>;
	hideShare?: boolean;
}

export function VideoCard({ video, onShare, hideShare }: VideoCardProps) {
	return (
		<Card className="overflow-hidden">
			<Link href={`/videos/${encodeURIComponent(video.id)}`}>
				<CardContent className="p-0">
					<div className="relative aspect-video">
						<Image
							src={video.thumbnailUrl ?? ""}
							alt={video.title}
							width={435}
							height={245}
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
							{video.publishedAt &&
								formatDistanceToNow(video.publishedAt, {
									addSuffix: true,
								})}
						</p>
					</div>
				</CardContent>
			</Link>
			{!hideShare && (
				<CardFooter className="flex justify-end p-4 pt-0">
					<Button variant="ghost" size="sm" onClick={() => onShare?.(video.id)}>
						<Share2 className="h-4 w-4 mr-2" />
						Share
					</Button>
				</CardFooter>
			)}
		</Card>
	);
}
