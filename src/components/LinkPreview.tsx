"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { Link2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";

export interface OpenGraphData {
	title: string;
	description: string;
	image: string;
	url: string;
}

interface LinkPreviewProps {
	url: string;
	className?: string;
	ogData: OpenGraphData;
}

export function LinkPreview({ url, className, ogData }: LinkPreviewProps) {
	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className={cn(
				"group flex gap-4 rounded-lg border border-neutral-200 bg-white p-4 no-underline transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700",
				className,
			)}
		>
			<div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md">
				{ogData.image ? (
					<Image
						src={ogData.image}
						alt={ogData.title}
						className="object-cover"
						width={96}
						height={96}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800">
						<Link2 className="h-8 w-8 text-neutral-400 dark:text-neutral-600 -rotate-45" />
					</div>
				)}
			</div>
			<div className="flex min-w-0 flex-col justify-center gap-1">
				<p className="truncate font-medium text-neutral-900 group-hover:text-neutral-600 dark:text-neutral-100 dark:group-hover:text-neutral-400">
					{ogData.title}
				</p>
				{ogData.description && (
					<p className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
						{ogData.description}
					</p>
				)}
				<p className="truncate text-sm text-neutral-500 dark:text-neutral-500">
					{url}
				</p>
			</div>
		</a>
	);
}

function LinkPreviewSkeleton() {
	return (
		<div className="flex gap-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
			<div className="h-24 w-24 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800" />
			<div className="flex min-w-0 flex-col justify-center gap-2">
				<div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
				<div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
				<div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
			</div>
		</div>
	);
}

interface PreviewData {
	title?: string;
	description?: string;
	images?: string[];
	siteName?: string;
	url: string;
}

interface LinkPreviewListProps {
	urls: PreviewData[];
	podcastsLink?: string;
}

export function LinkPreviewList({ urls, podcastsLink }: LinkPreviewListProps) {
	return (
		<div className="space-y-4">
			{urls.map((preview) => (
				<Card key={preview.url}>
					<CardContent className="p-4">
						<a
							href={preview.url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-start gap-4 hover:opacity-80 transition-opacity"
						>
							{preview.images?.[0] && (
								<div className="flex-shrink-0">
									<Image
										src={preview.images[0]}
										alt={preview.title || "Link preview"}
										width={96}
										height={96}
										className="rounded-lg object-cover w-24 h-24"
									/>
								</div>
							)}
							<div className="flex-grow min-w-0">
								<h3 className="font-medium line-clamp-2">{preview.title}</h3>
								{preview.description && (
									<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
										{preview.description}
									</p>
								)}
								{preview.siteName && (
									<p className="text-xs text-muted-foreground mt-2">
										{preview.siteName}
									</p>
								)}
							</div>
						</a>
					</CardContent>
				</Card>
			))}
			{podcastsLink && (
				<div className="text-sm text-muted-foreground">
					<a
						href={podcastsLink}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-600 dark:text-blue-400 underline decoration-blue-600/30 dark:decoration-blue-400/30 hover:decoration-blue-600 dark:hover:decoration-blue-400 transition-colors"
					>
						View on podcast platform
					</a>
				</div>
			)}
		</div>
	);
}
