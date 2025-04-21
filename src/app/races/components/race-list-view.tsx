"use client";

import { useState, useMemo } from "react";
import { Calendar, MapPin, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
	formatDate,
	formatTime,
	getFormattedAddress,
	parseDistanceToMiles,
} from "@/lib/utils/event-helpers";
import type { RunSignupRace, EventDetails } from "@/types/runsignup";
import type { AppliedFilters } from "../page";
import { parseISO, isWithinInterval, isValid } from "date-fns";
import type { Interval } from "date-fns";

interface EventListViewProps {
	races: RunSignupRace[];
	currentPage: number;
	totalPages: number;
	totalRaces: number;
	appliedFilters: AppliedFilters;
}

// Helper to generate pagination link URLs
function createPageUrl(page: number, filters: AppliedFilters): string {
	const params = new URLSearchParams();
	if (filters.zip) params.set("zip", filters.zip);
	if (filters.radius) params.set("radius", filters.radius);
	if (filters.startDate) params.set("startDate", filters.startDate);
	if (filters.endDate) params.set("endDate", filters.endDate);
	if (filters.eventType) params.set("eventType", filters.eventType);
	if (filters.status) params.set("status", filters.status);
	params.set("page", String(page));
	return `/races?${params.toString()}`;
}

export default function EventListView({
	races,
	currentPage,
	totalPages,
	totalRaces,
	appliedFilters,
}: EventListViewProps) {
	const [sortColumn, setSortColumn] = useState<string | null>(null);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
	const [searchTerm, setSearchTerm] = useState("");

	const handleSort = (column: string) => {
		if (sortColumn === column) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortColumn(column);
			setSortDirection("asc");
		}
	};

	// Memoize sorted races
	const sortedRaces = useMemo(() => {
		return [...races].sort((a, b) => {
			if (!sortColumn) return 0;

			let aCompValue: string | number;
			let bCompValue: string | number;

			switch (sortColumn) {
				case "name":
					aCompValue = (a.name || "").toLowerCase();
					bCompValue = (b.name || "").toLowerCase();
					break;
				case "date": {
					const aValue: number = a.next_date
						? parseISO(`${a.next_date}T00:00:00`).getTime()
						: NaN;
					const bValue: number = b.next_date
						? parseISO(`${b.next_date}T00:00:00`).getTime()
						: NaN;
					aCompValue = Number.isNaN(aValue) ? 0 : aValue;
					bCompValue = Number.isNaN(bValue) ? 0 : bValue;
					break;
				}
				case "location":
					aCompValue = (a.address?.city || "").toLowerCase();
					bCompValue = (b.address?.city || "").toLowerCase();
					break;
				default:
					return 0;
			}

			if (aCompValue < bCompValue) return sortDirection === "asc" ? -1 : 1;
			if (aCompValue > bCompValue) return sortDirection === "asc" ? 1 : -1;
			return 0;
		});
	}, [races, sortColumn, sortDirection]);

	// Memoize filtered races based on all filters
	const filteredRaces = useMemo(() => {
		let interval: Interval | null = null;
		if (appliedFilters.startDate && appliedFilters.endDate) {
			try {
				const start = parseISO(`${appliedFilters.startDate}T00:00:00`);
				const end = parseISO(`${appliedFilters.endDate}T23:59:59`);
				if (isValid(start) && isValid(end)) {
					interval = { start, end };
				}
			} catch (e) {
				console.error("Error parsing date filter range:", e);
			}
		}

		// Parse distance filters ONCE
		const minMiles = appliedFilters.minDistance
			? parseFloat(appliedFilters.minDistance)
			: null;
		const maxMiles = appliedFilters.maxDistance
			? parseFloat(appliedFilters.maxDistance)
			: null;
		const applyDistanceFilter =
			(minMiles !== null && !Number.isNaN(minMiles)) ||
			(maxMiles !== null && !Number.isNaN(maxMiles));

		return sortedRaces.filter((race) => {
			const searchTermLower = searchTerm.toLowerCase();
			const textMatch =
				searchTermLower === "" ||
				(race.name || "").toLowerCase().includes(searchTermLower) ||
				(race.address?.city || "").toLowerCase().includes(searchTermLower) ||
				(race.address?.state || "").toLowerCase().includes(searchTermLower);

			if (!textMatch) return false;

			if (appliedFilters.status && appliedFilters.status !== "all") {
				const isOpen = race.is_registration_open === "T";
				if (appliedFilters.status === "open" && !isOpen) return false;
				if (appliedFilters.status === "closed" && isOpen) return false;
			}

			if (appliedFilters.eventType && appliedFilters.eventType !== "all") {
				const eventTypeMatch = race.events?.some(
					(event: EventDetails) =>
						event.event_type === appliedFilters.eventType,
				);
				if (!eventTypeMatch) return false;
			}

			if (interval && race.next_date) {
				try {
					const raceDate = parseISO(`${race.next_date}T00:00:00`);
					if (!isValid(raceDate) || !isWithinInterval(raceDate, interval)) {
						return false;
					}
				} catch (e) {
					console.error(`Error parsing race date ${race.next_date}:`, e);
					return false;
				}
			}

			// 5. Distance Filter (Client-side)
			if (applyDistanceFilter && race.events && race.events.length > 0) {
				const distanceMatch = race.events.some((event: EventDetails) => {
					const eventMiles = parseDistanceToMiles(event.distance);
					if (eventMiles === null) return false; // Cannot compare if distance is unparseable

					const minOk =
						minMiles === null ||
						Number.isNaN(minMiles) ||
						eventMiles >= minMiles;
					const maxOk =
						maxMiles === null ||
						Number.isNaN(maxMiles) ||
						eventMiles <= maxMiles;

					return minOk && maxOk;
				});

				if (!distanceMatch) return false; // If no event in the race matches distance criteria
			}

			return true;
		});
	}, [sortedRaces, searchTerm, appliedFilters]);

	const hasPreviousPage = currentPage > 1;
	const hasNextPage = currentPage < totalPages;

	return (
		<>
			<div className="flex justify-between items-center mb-4">
				<Input
					placeholder={`Filter ${sortedRaces.length} races on this page...`}
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-sm"
				/>
				{totalRaces > 0 && (
					<span className="text-sm text-muted-foreground">
						Page {currentPage} of {totalPages} ({totalRaces} total races found)
					</span>
				)}
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[300px]">
								<Button variant="ghost" onClick={() => handleSort("name")}>
									Event Name
									<ArrowUpDown className="ml-2 h-4 w-4" />
								</Button>
							</TableHead>
							<TableHead>
								<Button variant="ghost" onClick={() => handleSort("date")}>
									Date
									<ArrowUpDown className="ml-2 h-4 w-4" />
								</Button>
							</TableHead>
							<TableHead>
								<Button variant="ghost" onClick={() => handleSort("location")}>
									Location
									<ArrowUpDown className="ml-2 h-4 w-4" />
								</Button>
							</TableHead>
							<TableHead className="text-right">Links</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredRaces.length > 0 ? (
							filteredRaces.map((race) => (
								<TableRow key={race.race_id}>
									<TableCell className="font-medium">{race.name}</TableCell>
									<TableCell>
										<div className="flex items-center">
											<Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
											{race.next_date ? formatDate(race.next_date) : "TBD"}
										</div>
										<div className="text-sm text-muted-foreground">
											{race.next_date ? formatTime(race.next_date) : ""}
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center">
											<MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
											{getFormattedAddress(
												race.address?.street,
												race.address?.street2,
												race.address?.city,
												race.address?.state,
											)}
										</div>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex gap-2 justify-end">
											{race.url && race.is_registration_open === "T" && (
												<Button asChild size="sm">
													<a
														href={race.url}
														target="_blank"
														rel="noopener noreferrer"
													>
														Register
													</a>
												</Button>
											)}
											<Button asChild size="sm" variant="outline">
												<Link href={`/races/${race.race_id}`}>Details</Link>
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={4} className="h-24 text-center">
									{races.length === 0
										? "No races found for this search."
										: "No results matching your filter on this page."}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination Controls */}
			{totalPages > 1 && (
				<div className="flex items-center justify-end space-x-2 py-4">
					<Link
						href={createPageUrl(currentPage - 1, appliedFilters)}
						passHref
						legacyBehavior
					>
						<Button
							variant="outline"
							size="sm"
							disabled={!hasPreviousPage}
							aria-disabled={!hasPreviousPage}
						>
							Previous
						</Button>
					</Link>
					<Link
						href={createPageUrl(currentPage + 1, appliedFilters)}
						passHref
						legacyBehavior
					>
						<Button
							variant="outline"
							size="sm"
							disabled={!hasNextPage}
							aria-disabled={!hasNextPage}
						>
							Next
						</Button>
					</Link>
				</div>
			)}
		</>
	);
}
