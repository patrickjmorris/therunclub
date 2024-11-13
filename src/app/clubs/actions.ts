"use server";

import { db } from "@/db";
import { runningClubs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function getFilteredClubs(city: string | null) {
	if (city) {
		return await db
			.select()
			.from(runningClubs)
			.where(eq(runningClubs.city, city))
			.orderBy(desc(runningClubs.lastUpdated));
	}

	return await db
		.select()
		.from(runningClubs)
		.orderBy(desc(runningClubs.lastUpdated));
}
