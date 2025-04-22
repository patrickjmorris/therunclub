"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface FilterToggleWrapperProps {
	children: ReactNode;
}

export function FilterToggleWrapper({ children }: FilterToggleWrapperProps) {
	const [showFilters, setShowFilters] = useState(false);

	return (
		<div className="mb-6">
			{/* Toggle Button for Mobile */}
			<div className="md:hidden mb-4">
				<Button
					variant="outline"
					className="w-full"
					onClick={() => setShowFilters(!showFilters)}
					aria-expanded={showFilters}
				>
					{showFilters ? "Hide Filters" : "Show Filters"}
				</Button>
			</div>

			{/* Filters Form Content - Hidden on mobile unless toggled, always visible on md+ */}
			<div
				className={`${
					showFilters ? "block" : "hidden"
				} md:block p-4 border rounded-lg bg-card text-card-foreground shadow-sm`}
			>
				{children} {/* Render the filter form content here */}
			</div>
		</div>
	);
}
