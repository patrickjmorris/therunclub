import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // Still used for styling the submit button
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DateRangePickerServer } from "./DateRangePickerServer";
import { AppliedFilters } from "../page";
import Link from "next/link"; // For Clear button

// Define options based on RunSignup API docs / common usage
const RADIUS_OPTIONS = [10, 25, 50, 100, 200];
const EVENT_TYPES = [
	{ value: "all", label: "Any Type" },
	{ value: "running_race", label: "Running Race" },
	{ value: "virtual_race", label: "Virtual Race" },
	{ value: "trail_race", label: "Trail Race" },
	{ value: "ultra", label: "Ultra Marathon" },
	{ value: "triathlon", label: "Triathlon" },
	{ value: "bike_race", label: "Bike Race" },
	{ value: "walk", label: "Walk" },
	{ value: "other", label: "Other" },
];
const STATUS_OPTIONS = [
	{ value: "all", label: "Any Status" },
	{ value: "open", label: "Open Registration" },
	{ value: "closed", label: "Closed Registration" },
];

// Define common distances with labels and approximate mile ranges
export const COMMON_DISTANCES = [
	{ key: "all", label: "Any Distance", minMiles: null, maxMiles: null },
	{ key: "1m", label: "1 Mile", minMiles: 0.9, maxMiles: 1.1 },
	{ key: "5k", label: "5K", minMiles: 2.9, maxMiles: 3.3 },
	{ key: "5m", label: "5 Mile", minMiles: 4.9, maxMiles: 5.1 },
	{ key: "10k", label: "10K", minMiles: 6.0, maxMiles: 6.4 },
	{ key: "10m", label: "10 Mile", minMiles: 9.9, maxMiles: 10.1 },
	{ key: "half", label: "Half Marathon", minMiles: 13.0, maxMiles: 13.3 },
	{ key: "marathon", label: "Marathon", minMiles: 26.0, maxMiles: 26.4 },
	{
		key: "ultra",
		label: "Ultra Marathon",
		minMiles: 26.41,
		maxMiles: Infinity,
	},
];

// Define props for the component
interface RaceFiltersProps {
	initialFilters: AppliedFilters;
}

// Helper to find distance key based on min/max miles (for useEffect sync)
function findDistanceKey(min?: string, max?: string): string {
	const minF = min ? parseFloat(min) : null;
	const maxF = max ? parseFloat(max) : null;

	for (const dist of COMMON_DISTANCES) {
		if (dist.minMiles === minF && dist.maxMiles === maxF) {
			return dist.key;
		}
		// Special case for Ultra (only min matters)
		if (dist.key === "ultra" && dist.minMiles === minF && maxF === null) {
			return dist.key;
		}
	}
	return "all"; // Default if no match
}

// RaceFilters is now a Server Component
export function RaceFilters({ initialFilters }: RaceFiltersProps) {
	// Calculate initial values directly from props
	const initialZip = initialFilters.zip || "";
	const initialRadius = initialFilters.radius || "50";
	const initialEventType = initialFilters.eventType || "all";
	const initialStatus = initialFilters.status || "all";
	const initialDistanceKey = findDistanceKey(
		initialFilters.minDistance,
		initialFilters.maxDistance,
	);

	// Determine if any filters are active (for showing clear button)
	const areFiltersActive =
		initialZip !== "" ||
		initialRadius !== "50" ||
		initialEventType !== "all" ||
		initialStatus !== "all" ||
		initialDistanceKey !== "all" ||
		initialFilters.startDate !== undefined ||
		initialFilters.endDate !== undefined;

	// For Distance Select, we need to translate the key back to min/max for form submission
	// We'll use hidden inputs for minDistance and maxDistance controlled by the Select
	// This part still needs client-side interaction to update hidden fields.
	// OR simplify: Have the Select directly use name="distanceKey" and handle server-side.
	// Let's try the simpler server-side handling first.

	return (
		<div className="mb-6 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
			{/* Use a standard form */}
			<form action="/races" method="GET">
				{/* Hidden input for page reset */}
				<input type="hidden" name="page" value="1" />

				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
					{/* ZIP Code */}
					<div className="space-y-1">
						<Label htmlFor="zip">ZIP Code</Label>
						<Input
							id="zip"
							name="zip" // Use name for form submission
							defaultValue={initialZip} // Use defaultValue
							pattern="\d{5}"
							maxLength={5}
							placeholder="e.g., 90210"
							className="w-full"
						/>
					</div>

					{/* Radius */}
					<div className="space-y-1">
						<Label htmlFor="radius">Radius</Label>
						<Select name="radius" defaultValue={initialRadius}>
							<SelectTrigger id="radius" className="w-full">
								<SelectValue placeholder="Select radius" />
							</SelectTrigger>
							<SelectContent>
								{RADIUS_OPTIONS.map((r) => (
									<SelectItem key={r} value={String(r)}>
										{r} miles
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Date Range Picker - Requires a separate client component wrapper */}
					<div className="space-y-1 md:col-span-2 lg:col-span-1">
						<Label>Date Range</Label>
						<DateRangePickerServer
							initialStartDate={initialFilters.startDate}
							initialEndDate={initialFilters.endDate}
						/>
					</div>

					{/* Distance Select - Use distanceKey for submission */}
					<div className="space-y-1">
						<Label htmlFor="distanceKey">Distance</Label>
						<Select name="distanceKey" defaultValue={initialDistanceKey}>
							<SelectTrigger id="distanceKey" className="w-full">
								<SelectValue placeholder="Any Distance" />
							</SelectTrigger>
							<SelectContent>
								{COMMON_DISTANCES.map((dist) => (
									<SelectItem key={dist.key} value={dist.key}>
										{dist.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Event Type */}
					<div className="space-y-1">
						<Label htmlFor="eventType">Event Type</Label>
						<Select name="eventType" defaultValue={initialEventType}>
							<SelectTrigger id="eventType" className="w-full">
								<SelectValue placeholder="Any Type" />
							</SelectTrigger>
							<SelectContent>
								{EVENT_TYPES.map((type) => (
									<SelectItem key={type.value} value={type.value}>
										{type.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Status */}
					<div className="space-y-1">
						<Label htmlFor="status">Status</Label>
						<Select name="status" defaultValue={initialStatus}>
							<SelectTrigger id="status" className="w-full">
								<SelectValue placeholder="Any Status" />
							</SelectTrigger>
							<SelectContent>
								{STATUS_OPTIONS.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Apply Button - Standard submit */}
					<Button type="submit" className="w-full lg:col-span-1">
						Apply Filters
					</Button>

					{/* Clear Filters Button - Link to reset */}
					{areFiltersActive && (
						<Button asChild variant="ghost" className="w-full lg:col-span-1">
							<Link href="/races">Clear Filters</Link>
						</Button>
					)}
				</div>
			</form>
		</div>
	);
}

// We need a new client component wrapper for DateRangePicker
// Let's create DateRangePickerServer.tsx next.
