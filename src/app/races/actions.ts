"use server";

import { findRaces } from "../actions/races";
import { raceFiltersSchema, type RaceFilters } from "./types";

export async function updateRaces(filters: RaceFilters) {
	const validatedFilters = raceFiltersSchema.parse(filters);
	return findRaces({
		location: validatedFilters.location,
		distance: validatedFilters.distance,
		type: validatedFilters.type,
		terrain: validatedFilters.terrain,
	});
}
