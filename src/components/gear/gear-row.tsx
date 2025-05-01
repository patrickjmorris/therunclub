import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Gear } from "@/db/schema"; // Import the Gear type
import { cn } from "@/lib/utils"; // Assuming Shadcn UI setup
import { GearCard } from "./gear-card"; // Import GearCard

interface GearRowProps {
	title: string;
	items: Gear[]; // Array of gear items
	ctaLink?: string; // Optional link for a "View All"
	className?: string;
}

export function GearRow({ title, items, ctaLink, className }: GearRowProps) {
	if (!items || items.length === 0) {
		// Optionally render nothing or an empty state message
		return null;
		// Or: return <div className={cn("py-4", className)}><p>No gear items to display.</p></div>;
	}

	return (
		<section className={cn("py-8", className)}>
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-2xl font-bold tracking-tight">{title}</h2>
				{ctaLink && (
					<Link
						href={ctaLink}
						className="text-sm font-medium text-primary hover:underline"
					>
						View All
					</Link>
				)}
			</div>

			{/* Horizontal Scrolling Container */}
			<div className="relative">
				<div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-muted">
					{items.map((item) => (
						// Use GearCard, applying specific width and flex-shrink here
						<GearCard
							key={item.id}
							item={item}
							className="w-48 flex-shrink-0 md:w-56" // Adjust width as needed
						/>
					))}
				</div>
				{/* Optional: Add fade overlays at the edges if desired */}
			</div>
		</section>
	);
}
