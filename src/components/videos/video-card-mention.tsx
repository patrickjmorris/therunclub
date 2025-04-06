"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { formatDuration } from "@/lib/formatDuration";
import type { BasicVideo } from "@/types/shared";
import { Play, Video } from "lucide-react";

interface VideoCardMentionProps {
	video: BasicVideo;
}

export function VideoCardMention({ video }: VideoCardMentionProps) {
	if (!video) return null;
	const date = video.publishedAt ? new Date(video.publishedAt) : null;
	const duration = video.duration ? formatDuration(video.duration) : null;

	return (
		<Card className="hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-colors my-4">
			<CardContent className="p-6">
				<div className="grid grid-cols-[auto_1fr] lg:grid-cols-[180px_1fr] gap-4 lg:gap-6">
					<div className="row-span-1 lg:row-span-3">
						<div className="relative aspect-video h-32 lg:h-[180px] w-32 lg:w-[180px]">
							<Image
								src={video.thumbnailUrl ?? ""}
								alt={video.title}
								fill
								className="rounded-lg object-cover"
								sizes="(max-width: 768px) 128px, 180px"
							/>
							<div className="absolute top-2 left-2">
								<Badge
									variant="secondary"
									className="flex items-center gap-1 bg-black/70 text-white"
								>
									<Video className="h-3 w-3" />
									<span className="text-xs">Video</span>
								</Badge>
							</div>
						</div>
					</div>
					<div className="flex flex-col">
						<h2 className="text-lg font-bold line-clamp-2">
							<Link
								href={`/videos/${encodeURIComponent(video.id)}`}
								className="hover:underline"
							>
								{video.title}
							</Link>
						</h2>
						<p className="text-sm text-muted-foreground mt-1">
							{video.channelTitle}
						</p>
						{date && (
							<p className="text-sm text-muted-foreground mt-1">
								{formatDistanceToNow(date, { addSuffix: true })}
							</p>
						)}
					</div>
					<div className="prose dark:prose-invert col-span-2 lg:col-span-1 lg:col-start-2 h-18 line-clamp-3">
						{video.description && (
							<p className="text-sm text-muted-foreground line-clamp-3">
								{video.description}
							</p>
						)}
					</div>
					<div className="flex items-center gap-4 mt-4 col-span-2 lg:col-span-1 lg:col-start-2">
						<Button
							variant="outline"
							size="sm"
							asChild
							className="flex items-center gap-2"
						>
							<Link href={`/videos/${encodeURIComponent(video.id)}`}>
								<Play className="h-4 w-4 fill-current" />
								<span aria-hidden="true">Watch</span>
							</Link>
						</Button>
						<Button variant="ghost" size="sm" asChild>
							<Link href={`/videos/${encodeURIComponent(video.id)}`}>
								Show details
							</Link>
						</Button>
						{duration && (
							<span className="text-sm text-muted-foreground">{duration}</span>
						)}
						{video.viewCount && (
							<span className="text-sm text-muted-foreground">
								{parseInt(video.viewCount).toLocaleString()} views
							</span>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
