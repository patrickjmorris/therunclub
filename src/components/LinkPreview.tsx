import { getOpenGraphData } from "@/lib/og";
import type { OpenGraphData } from "@/lib/og";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Suspense } from "react";
import { Link2 } from "lucide-react";

interface LinkPreviewProps {
	url: string;
	className?: string;
	ogData?: OpenGraphData;
}

export async function LinkPreview({
	url,
	className,
	ogData: preloadedData,
}: LinkPreviewProps) {
	const ogData = preloadedData || (await getOpenGraphData(url));

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
						fill
						sizes="96px"
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

export async function LinkPreviewList({
	urls,
	podcastsLink,
	className,
}: {
	urls: string[];
	podcastsLink?: string | null;
	className?: string;
}) {
	if (!urls.length && !podcastsLink) return null;

	const allUrls = podcastsLink ? [podcastsLink, ...urls] : urls;

	// Fetch all OpenGraph data in parallel and filter out invalid responses
	const previews = await Promise.all(
		allUrls.map(async (url) => {
			try {
				const ogData = await getOpenGraphData(url);
				// Only include previews that have at least a title and aren't error states
				const isValid =
					ogData.title &&
					ogData.title !== url &&
					ogData.title !== new URL(url).hostname &&
					!ogData.title.includes("Request timeout") &&
					!ogData.title.includes("Connection failed") &&
					!ogData.title.includes("Page not found") &&
					!ogData.title.includes("Access denied") &&
					!ogData.title.includes("Too many requests");

				return isValid ? { url, ogData } : null;
			} catch {
				return null;
			}
		}),
	);

	// Filter out null responses
	const validPreviews = previews.filter(
		(preview): preview is { url: string; ogData: OpenGraphData } =>
			preview !== null,
	);

	if (!validPreviews.length) return null;

	return (
		<div className={cn("my-4 flex flex-col gap-4", className)}>
			{validPreviews.map(({ url, ogData }) => (
				<Suspense key={url} fallback={<LinkPreviewSkeleton />}>
					<LinkPreview url={url} ogData={ogData} />
				</Suspense>
			))}
		</div>
	);
}
