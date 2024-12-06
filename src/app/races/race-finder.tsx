"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateRaces } from "./actions";
import { type RaceFilters } from "./types";
import { Race } from "@/db/schema";
import { RaceCard } from "./components/race-card";
import { Slider } from "@/components/ui/slider";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function RaceFinder() {
	const searchParams = useSearchParams();
	const [races, setRaces] = useState<Race[]>([]);
	const [filters, setFilters] = useState<RaceFilters>({
		location: searchParams.get("location") || undefined,
		distance: searchParams.get("distance")
			? Number(searchParams.get("distance"))
			: undefined,
		type: (searchParams.get("type") as RaceFilters["type"]) || undefined,
		terrain:
			(searchParams.get("terrain") as RaceFilters["terrain"]) || undefined,
	});
	const [isLoading, setIsLoading] = useState(false);

	// Update races when filters change
	useEffect(() => {
		let isMounted = true;

		async function fetchRaces() {
			setIsLoading(true);
			try {
				const results = await updateRaces(filters);
				if (isMounted) {
					setRaces(results.races);
				}
			} catch (error) {
				console.error("Failed to update races:", error);
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		}

		const timeoutId = setTimeout(() => {
			fetchRaces();
		}, 500);

		return () => {
			isMounted = false;
			clearTimeout(timeoutId);
		};
	}, [filters]);

	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<div className="space-y-2">
					<Label htmlFor="location">Location</Label>
					<Input
						id="location"
						placeholder="Enter city, state, or country"
						value={filters.location ?? ""}
						onChange={(e) =>
							setFilters((prev) => ({
								...prev,
								location: e.target.value || undefined,
							}))
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="distance">Distance (km)</Label>
					<Slider
						id="distance"
						min={0}
						max={100}
						step={5}
						value={[filters.distance ?? 0]}
						onValueChange={(value) =>
							setFilters((prev) => ({
								...prev,
								distance: value[0] || undefined,
							}))
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="type">Race Type</Label>
					<Select
						value={filters.type ?? "any"}
						onValueChange={(value) =>
							setFilters((prev) => ({
								...prev,
								type:
									value === "any" ? undefined : (value as RaceFilters["type"]),
							}))
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="any">Any</SelectItem>
							<SelectItem value="road">Road</SelectItem>
							<SelectItem value="trail">Trail</SelectItem>
							<SelectItem value="track">Track</SelectItem>
							<SelectItem value="cross_country">Cross Country</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="terrain">Terrain</Label>
					<Select
						value={filters.terrain ?? "any"}
						onValueChange={(value) =>
							setFilters((prev) => ({
								...prev,
								terrain:
									value === "any"
										? undefined
										: (value as RaceFilters["terrain"]),
							}))
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select terrain" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="any">Any</SelectItem>
							<SelectItem value="road">Road</SelectItem>
							<SelectItem value="trail">Trail</SelectItem>
							<SelectItem value="track">Track</SelectItem>
							<SelectItem value="mixed">Mixed</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{isLoading ? (
					<div>Loading races...</div>
				) : races.length > 0 ? (
					races.map((race) => <RaceCard key={race.id} race={race} />)
				) : (
					<div>No races found matching your criteria.</div>
				)}
			</div>
		</div>
	);
}
