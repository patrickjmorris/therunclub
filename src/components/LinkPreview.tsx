import { getOpenGraphData } from "@/lib/og";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Suspense } from "react";

interface LinkPreviewProps {
	url: string;
	className?: string;
}

export async function LinkPreview({ url, className }: LinkPreviewProps) {
	const ogData = await getOpenGraphData(url);

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
			{ogData.image && (
				<div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md">
					<Image
						src={ogData.image}
						alt={ogData.title}
						className="object-cover"
						fill
						sizes="96px"
					/>
				</div>
			)}
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

export function LinkPreviewList({
	urls,
	className,
}: {
	urls: string[];
	className?: string;
}) {
	if (!urls.length) return null;

	return (
		<div className={cn("my-4 flex flex-col gap-4", className)}>
			{urls.map((url) => (
				<Suspense key={url} fallback={<LinkPreviewSkeleton />}>
					<LinkPreview url={url} />
				</Suspense>
			))}
		</div>
	);
}
