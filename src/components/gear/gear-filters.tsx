"use client"; // This component needs state and interactivity

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider"; // Assuming Shadcn UI Slider
import { gearCategoryEnum } from "@/db/schema"; // Import enum for categories
import { cn } from "@/lib/utils";

// TODO: Fetch actual brands dynamically
const availableBrands = ["Brand A", "Brand B", "Brand C", "Garmin", "Nike"];
const categories = gearCategoryEnum.enumValues;

interface GearFiltersProps {
	className?: string;
	// TODO: Add props for filter state and onChange handlers later
	// initialFilters?: FiltersState;
	// onFilterChange?: (newFilters: FiltersState) => void;
}

// TODO: Define FilterState type later
// interface FiltersState {
//  category?: string;
//  brands?: string[];
//  minPrice?: number;
//  maxPrice?: number;
//  minRating?: number;
// }

export function GearFilters({ className }: GearFiltersProps) {
	// TODO: Implement state management for filters later
	// const [filters, setFilters] = React.useState<FiltersState>(initialFilters || {});

	const handleClear = () => {
		// TODO: Implement clear logic
		console.log("Clear filters");
	};

	const handleApply = () => {
		// TODO: Implement apply logic (e.g., update URL params or call onFilterChange)
		console.log("Apply filters");
	};

	return (
		<aside className={cn("space-y-6 p-4 border rounded-lg", className)}>
			<h3 className="text-lg font-semibold">Filters</h3>

			{/* Category Pills/Buttons */}
			<div className="space-y-2">
				<Label>Category</Label>
				<div className="flex flex-wrap gap-2">
					{categories.map((category) => (
						<Button
							key={category}
							variant="outline"
							size="sm"
							// TODO: Add active state based on filter selection
							// className={cn(filters.category === category && "border-primary")}
							// onClick={() => handleCategoryChange(category)}
						>
							{/* Improve capitalization/display if needed */}
							{category.charAt(0).toUpperCase() + category.slice(1)}
						</Button>
					))}
				</div>
			</div>

			{/* Brand Selector (Multi-select Dropdown - Placeholder using Checkboxes) */}
			{/* TODO: Replace with a proper multi-select component if available (e.g., Shadcn Combobox multi) */}
			<div className="space-y-2">
				<Label>Brand</Label>
				<div className="max-h-40 overflow-y-auto space-y-2 rounded border p-2">
					{availableBrands.map((brand) => (
						<div key={brand} className="flex items-center space-x-2">
							<Checkbox
								id={`brand-${brand}`}
								// TODO: Checked state
								// onCheckedChange={(checked) => handleBrandChange(brand, checked)}
							/>
							<Label htmlFor={`brand-${brand}`} className="text-sm font-normal">
								{brand}
							</Label>
						</div>
					))}
				</div>
				{/* Consider adding a search input for brands */}
			</div>

			{/* Price Range Slider */}
			<div className="space-y-2">
				<Label>Price Range</Label>
				{/* Placeholder for actual range values */}
				<Slider
					defaultValue={[0, 1000]} // Example range
					max={1500} // Example max
					step={10}
					// TODO: Add onValueChange handler
					// onValueChange={handlePriceChange}
					className="py-2"
				/>
				{/* Display selected range */}
				<div className="flex justify-between text-xs text-muted-foreground">
					<span>$0</span> {/* TODO: Dynamic min */}
					<span>$1000</span> {/* TODO: Dynamic max */}
				</div>
			</div>

			{/* Rating Filter (Example: Min Rating Selector) */}
			<div className="space-y-2">
				<Label htmlFor="min-rating">Min Rating</Label>
				<Select
				// TODO: Add value and onValueChange
				>
					<SelectTrigger id="min-rating">
						<SelectValue placeholder="Any Rating" />
					</SelectTrigger>
					<SelectContent>
						{[4, 3, 2, 1].map((rating) => (
							<SelectItem key={rating} value={String(rating)}>
								{rating} Stars & Up
							</SelectItem>
						))}
						<SelectItem value="0">Any Rating</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Action Buttons */}
			<div className="flex space-x-2 pt-4">
				<Button variant="ghost" onClick={handleClear} className="flex-1">
					Clear All
				</Button>
				<Button onClick={handleApply} className="flex-1">
					Apply Filters
				</Button>
			</div>
		</aside>
	);
}
