import { db } from "@/db/client";
import { runningClubs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

// Get popular running clubs
export async function getPopularRunClubs() {
	return db
		.select({
			id: runningClubs.id,
			clubName: runningClubs.clubName,
			description: runningClubs.description,
			location: runningClubs.location,
			website: runningClubs.website,
			socialMedia: runningClubs.socialMedia,
		})
		.from(runningClubs)
		.limit(3);
}

// Get filtered clubs by city
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
