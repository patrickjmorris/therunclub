"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { SearchResult } from "@/lib/services/search-service";
import { VideoIcon, Headphones, PlayCircle } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import { Badge } from "@/components/ui/badge";

interface SearchResultsProps {
	results: SearchResult[];
	isLoading?: boolean;
}

function SearchResultItem({ result }: { result: SearchResult }) {
	return (
		<Link
			href={result.url}
			className="flex items-start gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors"
		>
			<div className="relative aspect-video w-40 rounded-md overflow-hidden bg-muted">
				{result.thumbnailUrl ? (
					<Image
						src={result.thumbnailUrl}
						alt={result.title}
						fill
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						className="object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center">
						{result.type === "video" && <VideoIcon className="h-8 w-8" />}
						{result.type === "podcast" && <Headphones className="h-8 w-8" />}
						{result.type === "episode" && <PlayCircle className="h-8 w-8" />}
					</div>
				)}
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<h3 className="font-medium leading-tight">{result.title}</h3>
					<Badge variant="secondary" className="capitalize">
						{result.type}
					</Badge>
				</div>
				{(result.channelTitle || result.podcastTitle) && (
					<p className="text-sm text-muted-foreground mt-1">
						{result.type === "video"
							? result.channelTitle
							: result.type === "episode"
							  ? result.podcastTitle
							  : null}
					</p>
				)}
				{result.description && (
					<p
						className="text-sm text-muted-foreground mt-1 line-clamp-2"
						{...(result.type === "episode"
							? {
									dangerouslySetInnerHTML: {
										__html: DOMPurify.sanitize(result.description),
									},
							  }
							: { children: result.description })}
					/>
				)}
				{result.publishedAt && (
					<p className="text-xs text-muted-foreground mt-2">
						{formatDistanceToNow(result.publishedAt, { addSuffix: true })}
					</p>
				)}
			</div>
		</Link>
	);
}

const MemoizedSearchResultItem = memo(SearchResultItem);

export function SearchResults({ results, isLoading }: SearchResultsProps) {
	if (isLoading) {
		return (
			<div className="space-y-4">
				{[...Array(3)].map((_, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: Needed for skeleton
						key={i}
						className="flex items-start gap-4 p-4 animate-pulse"
					>
						<div className="relative aspect-video w-40 rounded-md bg-muted" />
						<div className="flex-1 space-y-2">
							<div className="h-4 bg-muted rounded w-3/4" />
							<div className="h-3 bg-muted rounded w-1/2" />
							<div className="h-3 bg-muted rounded w-5/6" />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (results.length === 0) {
		return null;
		// return (
		//   <div className="text-center py-8 text-muted-foreground">
		//     No results found
		//   </div>
		// );
	}
	console.log("results", results);
	return (
		<div className="space-y-4">
			{results.map((result) => (
				<MemoizedSearchResultItem
					key={`${result.type}-${result.id}`}
					result={result}
				/>
			))}
		</div>
	);
}
