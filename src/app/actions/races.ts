"use server";

import { db } from "@/db/client";
import { races } from "@/db/schema";
import { eq, and, or, like, between } from "drizzle-orm";
import { type RaceFilters } from "../races/types";

export async function findRaces(filters: RaceFilters) {
	const query = db.select().from(races);

	// Build where conditions
	const conditions = [];

	if (filters.location) {
		conditions.push(like(races.location, `%${filters.location}%`));
	}

	if (filters.distance) {
		// Allow ±10% of the target distance
		const minDistance = filters.distance * 1000 * 0.9;
		const maxDistance = filters.distance * 1000 * 1.1;
		conditions.push(between(races.distance, minDistance, maxDistance));
	}

	if (filters.type) {
		conditions.push(eq(races.type, filters.type));
	}

	if (filters.terrain) {
		conditions.push(eq(races.terrain, filters.terrain));
	}

	// Apply conditions if any exist
	if (conditions.length > 0) {
		query.where(and(...conditions));
	}

	// Order by date
	query.orderBy(races.date);

	const results = await query;
	return { races: results };
}

export async function getRaceById(id: string) {
	const result = await db.select().from(races).where(eq(races.id, id)).limit(1);

	return result[0] || null;
}
