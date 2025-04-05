import { db } from "@/db/client";
import { runningClubs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getOpenGraphData } from "@/lib/og";
import { createWeeklyCache } from "@/lib/utils/cache";

// Get clubs data with cities and OG data
export const getClubsData = createWeeklyCache(
	async () => {
		const clubs = await db.select().from(runningClubs);
		const cities = [...new Set(clubs.map((club) => club.location.city))].sort();

		// Fetch OG data for clubs with websites
		const clubsWithOgData = await Promise.all(
			clubs.map(async (club) => {
				let ogData = null;
				if (club.website) {
					try {
						ogData = await getOpenGraphData(club.website);
					} catch (error) {
						console.error(
							`Failed to fetch OG data for ${club.website}:`,
							error,
						);
					}
				}
				return { ...club, ogData };
			}),
		);

		return {
			cities,
			clubs: clubsWithOgData,
		};
	},
	["clubs-data"],
	["clubs"],
);

// Get popular running clubs
export const getPopularRunClubs = createWeeklyCache(
	async () => {
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
	},
	["popular-clubs"],
	["clubs"],
);

// Get filtered clubs by city
export const getFilteredClubs = createWeeklyCache(
	async (city: string | null) => {
		const query = city
			? db
					.select()
					.from(runningClubs)
					.where(eq(runningClubs.city, city))
					.orderBy(desc(runningClubs.lastUpdated))
			: db.select().from(runningClubs).orderBy(desc(runningClubs.lastUpdated));

		return await query;
	},
	["filtered-clubs"],
	["clubs"],
);
