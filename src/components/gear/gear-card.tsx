import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Gear } from "@/db/schema";
import { cn } from "@/lib/utils";
// Import a star icon if available for rating, e.g., from lucide-react
// import { Star } from 'lucide-react';

interface GearCardProps {
	item: Gear;
	className?: string;
}

export function GearCard({ item, className }: GearCardProps) {
	return (
		<div className={cn("group relative w-full", className)}>
			<Link
				href={item.link}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={`View ${item.name ?? "gear item"} on ${
					item.merchant || "merchant site"
				}`}
			>
				<div className="aspect-square w-full overflow-hidden rounded-md bg-muted transition-shadow duration-300 group-hover:shadow-md">
					<Image
						src={item.optimizedImageUrl ?? item.image}
						alt={item.name ?? "Gear item image"}
						width={300} // Larger default size for a card
						height={300}
						className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
						// Consider adding placeholder/blurDataURL if images load slowly
						// placeholder="blur"
						// blurDataURL="data:image/..."
					/>
				</div>
				<div className="mt-2 flex flex-col">
					{/* Brand */}
					{item.brand && (
						<p className="text-xs font-medium text-muted-foreground">
							{item.brand}
						</p>
					)}
					{/* Name */}
					<h3 className="mt-0.5 truncate text-sm font-semibold text-foreground group-hover:text-primary">
						{item.name ?? "Unnamed Gear"}
					</h3>
					{/* Price & Rating Row */}
					<div className="mt-1 flex items-center justify-between">
						<p className="text-sm font-medium text-foreground">${item.price}</p>
						{/* Rating */}
						{item.rating && (
							<div className="flex items-center space-x-1">
								{/* <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" /> */}
								<span className="text-xs font-medium text-muted-foreground">
									{parseFloat(item.rating).toFixed(1)}
									{item.reviewCount && ` (${item.reviewCount})`}
								</span>
							</div>
						)}
					</div>
				</div>
				{/* Add absolute link overlay for better click target? */}
				{/* <span className="absolute inset-0 z-10" aria-hidden="true" /> */}
			</Link>
		</div>
	);
}
