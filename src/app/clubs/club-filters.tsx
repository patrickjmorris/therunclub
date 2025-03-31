"use client";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, X, ExternalLink, Footprints } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState, useEffect } from "react";
import { type RunningClub } from "@/db/schema";

interface ClubFiltersProps {
	cities: string[];
	initialClubs: RunningClub[];
}

export function ClubFilters({ cities, initialClubs }: ClubFiltersProps) {
	const [city, setCity] = useQueryState("city");
	const [filteredClubs, setFilteredClubs] =
		useState<RunningClub[]>(initialClubs);

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
					<Card key={club.id} className="flex flex-col">
						<CardHeader>
							<div className="flex items-start justify-between">
								<div>
									<CardTitle>{club.clubName}</CardTitle>
									<CardDescription className="flex items-center mt-1">
										<MapPin className="h-4 w-4 mr-1" />
										{club.location.city}
										{club.location.state && `, ${club.location.state}`}
									</CardDescription>
								</div>
							</div>
						</CardHeader>

						<CardContent className="flex-grow">
							<p className="text-sm text-muted-foreground">
								{club.description}
							</p>
						</CardContent>

						<CardFooter className="flex flex-wrap gap-2">
							{club.website && (
								<Button variant="outline" size="sm" asChild>
									<a
										href={club.website}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center"
									>
										<ExternalLink className="h-4 w-4 mr-2" />
										Website
									</a>
								</Button>
							)}
							{club.socialMedia?.strava && (
								<Button variant="outline" size="sm" asChild>
									<a
										href={club.socialMedia.strava}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center"
									>
										<Footprints className="h-4 w-4 mr-2" />
										Strava
									</a>
								</Button>
							)}
						</CardFooter>
					</Card>
				))}
			</div>
		</>
	);
}
