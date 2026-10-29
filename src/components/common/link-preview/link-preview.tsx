"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
						unoptimized
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

function LinkPreviewSkeleton({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"flex gap-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900",
				className,
			)}
		>
			<div className="h-24 w-24 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800" />
			<div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
				<div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
				<div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
			</div>
		</div>
	);
}

// Canonical form (no fragment, normalized) so equivalent links share a
// CDN cache entry.
function canonical(url: string) {
	if (!URL.canParse(url)) return url;
	const parsed = new URL(url);
	parsed.hash = "";
	return parsed.href;
}

// Fetches the preview once the card scrolls near the viewport; renders
// nothing if the site has no usable preview. Keyed by url so a new url
// starts from a fresh, observable state.
export function LinkPreviewCard(props: { url: string; className?: string }) {
	return <LazyLinkPreview key={props.url} {...props} />;
}

function LazyLinkPreview({
	url,
	className,
}: {
	url: string;
	className?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [ogData, setOgData] = useState<OpenGraphData | null | undefined>();

	useEffect(() => {
		const node = ref.current;
		if (!node) return;
		const controller = new AbortController();
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				observer.disconnect();
				const query = new URLSearchParams({ url: canonical(url) });
				fetch(`/api/link-preview?${query}`, {
					signal: controller.signal,
				})
					.then((response) => (response.ok ? response.json() : null))
					.then((data) => setOgData(data?.preview ?? null))
					.catch(() => {
						if (!controller.signal.aborted) setOgData(null);
					});
			},
			{ rootMargin: "200px" },
		);
		observer.observe(node);
		return () => {
			observer.disconnect();
			controller.abort();
		};
	}, [url]);

	if (ogData === null) return null;
	return (
		<div ref={ref}>
			{ogData ? (
				<LinkPreview url={url} ogData={ogData} className={className} />
			) : (
				<LinkPreviewSkeleton className={className} />
			)}
		</div>
	);
}

export function LinkPreviewList({
	urls,
	podcastsLink,
}: {
	urls: string[];
	podcastsLink?: string;
}) {
	return (
		<div className="space-y-4">
			{urls.map((url) => (
				<LinkPreviewCard key={url} url={url} />
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
