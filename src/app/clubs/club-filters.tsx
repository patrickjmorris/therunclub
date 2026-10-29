"use client";

import { Badge } from "@/components/ui/badge";
import { MapPin, X } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState, useEffect } from "react";
import { type RunningClub } from "@/db/schema";
import { ClubCard } from "./club-card";
import type { OpenGraphData } from "@/lib/og";

interface ClubFiltersProps {
	cities: string[];
	initialClubs: Array<RunningClub & { ogData: OpenGraphData | null }>;
	cityHrefs: Record<string, string>;
}

export function ClubFilters({
	cities,
	initialClubs,
	cityHrefs,
}: ClubFiltersProps) {
	const [city, setCity] = useQueryState("city");
	const [filteredClubs, setFilteredClubs] =
		useState<Array<RunningClub & { ogData: OpenGraphData | null }>>(
			initialClubs,
		);

	// Filter clubs client-side when city changes
	useEffect(() => {
		if (!city) {
			setFilteredClubs(initialClubs);
			return;
		}

		const filtered = initialClubs.filter((club) => club.location.city === city);
		setFilteredClubs(filtered);
	}, [city, initialClubs]);

	return (
		<>
			{/* City Filter */}
			<div className="mb-8">
				<div className="flex flex-wrap gap-2">
					{cities.map((cityName) => (
						<button
							type="button"
							key={cityName}
							onClick={() => setCity(city === cityName ? null : cityName)}
							className="inline-flex items-center"
						>
							<Badge
								variant={city === cityName ? "default" : "outline"}
								className="cursor-pointer hover:bg-primary/90 hover:text-primary-foreground"
							>
								<MapPin className="h-3 w-3 mr-1" />
								{cityName}
								{city === cityName && <X className="h-3 w-3 ml-1" />}
							</Badge>
						</button>
					))}
				</div>
			</div>

			{/* Clubs Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filteredClubs.map((club) => (
					<ClubCard
						key={club.id}
						club={club}
						ogData={club.ogData}
						cityHref={cityHrefs[club.location.city]}
					/>
				))}
			</div>
		</>
	);
}
