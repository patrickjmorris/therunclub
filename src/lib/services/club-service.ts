import { db } from "@/db/client";
import { runningClubs } from "@/db/schema";
import { asc, count, desc, eq, gte, max } from "drizzle-orm";
import { getOpenGraphData } from "@/lib/og";
import { createDailyCache, createWeeklyCache } from "@/lib/utils/cache";
import { slugify } from "@/lib/utils";

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

// A city page needs enough clubs to be worth landing on from search.
const MIN_CLUBS_PER_CITY = 5;

// location.state is empty in the data, so search-facing labels come from here.
const CITY_REGIONS: Record<string, string> = {
	"New York": "NY",
	Boston: "MA",
	Chicago: "IL",
	"Los Angeles": "CA",
	Austin: "TX",
	"San Francisco": "CA",
};

export interface ClubCity {
	city: string;
	label: string;
	slug: string;
	count: number;
	lastModified: string;
}

export const getClubCities = createDailyCache(
	async (): Promise<ClubCity[]> => {
		const rows = await db
			.select({
				city: runningClubs.city,
				count: count(),
				lastModified: max(runningClubs.lastUpdated),
			})
			.from(runningClubs)
			.groupBy(runningClubs.city)
			.having(gte(count(), MIN_CLUBS_PER_CITY))
			.orderBy(desc(count()), runningClubs.city);
		return rows.map((row) => ({
			city: row.city,
			label: CITY_REGIONS[row.city]
				? `${row.city}, ${CITY_REGIONS[row.city]}`
				: row.city,
			slug: slugify(row.city),
			count: row.count,
			lastModified: (row.lastModified ?? new Date()).toISOString(),
		}));
	},
	["club-cities"],
	["clubs"],
);

export const getClubsInCity = createDailyCache(
	async (city: string) =>
		db
			.select()
			.from(runningClubs)
			.where(eq(runningClubs.city, city))
			.orderBy(asc(runningClubs.clubName)),
	["clubs-in-city"],
	["clubs"],
);
