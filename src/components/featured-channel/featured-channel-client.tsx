"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

interface ContentItem {
	id: string;
	title: string;
	thumbnailUrl: string;
	publishedAt: Date;
	type: "video" | "episode";
	podcastTitle?: string;
	podcastSlug?: string;
	episodeSlug?: string;
}

interface FeaturedContentProps {
	title: string;
	thumbnailUrl: string;
	vibrantColor?: string;
	items: ContentItem[];
	type: "video" | "podcast";
	slug: string;
}

export function FeaturedChannelClient({
	title,
	thumbnailUrl,
	vibrantColor = "#1e3a8a",
	items,
	type,
	slug,
}: FeaturedContentProps) {
	const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

	return (
		<Card className="overflow-hidden">
			<Link
				href={
					type === "video" ? `videos/channels/${slug}` : `/podcasts/${slug}`
				}
			>
				<div
					className="relative h-[200px] w-full"
					style={{
						background: `linear-gradient(to bottom, ${vibrantColor}60, ${vibrantColor}95)`,
					}}
				>
					<ImageWithFallback
						src={thumbnailUrl}
						alt={title}
						fill
						type={type}
						priority
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						className="object-cover mix-blend-overlay w-full h-full"
					/>
					<div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60">
						<div className="absolute bottom-4 left-4">
							<h1 className="text-white text-2xl font-bold">{title}</h1>
						</div>
					</div>
				</div>
			</Link>
			{/* Content Row */}
			<div className="p-4">
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{items.map((item) => (
						<Link
							key={item.id}
							href={
								type === "video"
									? `/videos/${item.id}`
									: `/podcasts/${slug}/episodes/${item.id}`
							}
							className="group"
							onMouseEnter={() => setHoveredItemId(item.id)}
							onMouseLeave={() => setHoveredItemId(null)}
						>
							<div className="relative aspect-video rounded-lg overflow-hidden">
								<ImageWithFallback
									src={item.thumbnailUrl || "/images/placeholder.png"}
									alt={item.title}
									width={300}
									height={169}
									type={type}
									className="transition-transform duration-300 group-hover:scale-105"
								/>
								<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
									{type === "video" ? (
										<svg
											className="w-12 h-12 text-white"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											aria-label="Play video"
											role="img"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
											/>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									) : (
										<svg
											className="w-12 h-12 text-white"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											aria-label="Listen to podcast"
											role="img"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M3 18v-6a9 9 0 0118 0v6"
											/>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M21 19a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 012-2h14a2 2 0 012 2v3zM3 18h18"
											/>
										</svg>
									)}
								</div>
							</div>
							<h3 className="mt-2 text-sm font-medium line-clamp-2">
								{item.title}
							</h3>
						</Link>
					))}
				</div>
			</div>
		</Card>
	);
}
