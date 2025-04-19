"use client";

import { useState } from "react";
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
} from "@/lib/utils/event-helpers";
import type { RunSignupRace } from "@/types/runsignup";

// Interface for current search query props needed for pagination links
interface CurrentQuery {
	zip?: string;
	radius?: string;
	// Add other filter params here if needed
}

interface EventListViewProps {
	races: RunSignupRace[];
	currentPage: number;
	totalPages: number;
	totalRaces: number;
	currentQuery: CurrentQuery;
}

// Helper to generate pagination link URLs
function createPageUrl(page: number, currentQuery: CurrentQuery): string {
	const params = new URLSearchParams();
	if (currentQuery.zip) params.set("zip", currentQuery.zip);
	if (currentQuery.radius) params.set("radius", currentQuery.radius);
	params.set("page", String(page));
	return `/races?${params.toString()}`;
}

export default function EventListView({
	races,
	currentPage,
	totalPages,
	totalRaces,
	currentQuery,
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

	// Note: Sorting and filtering are applied *after* pagination
	// This means only the current page's data is sorted/filtered.
	// For full dataset sorting/filtering, it needs to happen server-side
	// before pagination, or the client needs all data (not scalable).
	const sortedRaces = [...races].sort((a, b) => {
		if (!sortColumn) return 0;

		let aValue: string | number;
		let bValue: string | number;

		switch (sortColumn) {
			case "name":
				aValue = (a.name || "").toLowerCase();
				bValue = (b.name || "").toLowerCase();
				break;
			case "date":
				aValue = a.next_date ? new Date(a.next_date).getTime() : 0;
				bValue = b.next_date ? new Date(b.next_date).getTime() : 0;
				break;
			case "location":
				aValue = (a.address?.city || "").toLowerCase();
				bValue = (b.address?.city || "").toLowerCase();
				break;
			default:
				return 0;
		}

		if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
		if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
		return 0;
	});

	const filteredRaces = sortedRaces.filter(
		(race) =>
			race.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(race.address?.city || "")
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			(race.address?.state || "")
				.toLowerCase()
				.includes(searchTerm.toLowerCase()),
	);

	const hasPreviousPage = currentPage > 1;
	const hasNextPage = currentPage < totalPages;

	return (
		// Changed container div to fragment as main page already has container/padding
		<>
			<div className="flex justify-between items-center mb-4">
				<Input
					placeholder={`Search ${races.length} races on this page...`}
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
						href={createPageUrl(currentPage - 1, currentQuery)}
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
						href={createPageUrl(currentPage + 1, currentQuery)}
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
