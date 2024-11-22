"use client";

import Image from "next/image";
import Link from "next/link";

interface DynamicHeaderProps {
	imageUrl: string;
	title: string;
	author: string;
	vibrantColor?: string;
	podcastSlug: string;
}

export default function DynamicHeader({
	imageUrl,
	title,
	author,
	vibrantColor,
	podcastSlug,
}: DynamicHeaderProps) {
	const bgColor = {
		background: vibrantColor,
	};

	return (
		<Link href={`/podcasts/${podcastSlug}`}>
			<div className="relative pt-8 pb-8 px-4 md:px-6" style={bgColor}>
				<div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />
				<div className="container max-w-7xl relative">
					<div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
						<div>
							<div className="aspect-square relative rounded-lg overflow-hidden shadow-xl">
								<Image
									src={imageUrl}
									alt={title}
									fill
									className="object-cover"
									priority
								/>
							</div>
						</div>
						<div className="flex flex-col justify-end">
							<h1 className="text-4xl md:text-5xl font-bold">{title}</h1>
							<p className="text-xl mt-4 text-muted-foreground">{author}</p>
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
}