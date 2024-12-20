import { db } from "../src/db/client";
import { athletes, athleteResults } from "@/db/schema";
import { getAthleteById, worldAthleticsClient } from "@/lib/world-athletics";
import { countryCodeMap } from "@/lib/utils/country-codes";
import { sql } from "drizzle-orm";

interface AthleteSearchResponse {
	getAthleteRepresentativeAthleteSearch: {
		athletes: Array<{
			children: Array<{
				athleteId: number;
			}>;
		}>;
	};
}

interface LeadingAthletesResponse {
	getLeadingAthletes: {
		eventResults: Array<{
			results: Array<{
				competitor: {
					id: number;
				};
			}>;
		}>;
	};
}

function parseBirthDate(dateStr: string | undefined | null): string | null {
	if (!dateStr) return null;

	// If it's just a year (4 digits)
	if (/^\d{4}$/.test(dateStr)) {
		return `${dateStr}-01-01`;
	}

	// Try parsing the full date
	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	return date.toISOString().split("T")[0];
}

async function getAthleteIds(): Promise<string[]> {
	const query = `
		query GetAthleteRepresentativeAthleteSearch {
			getAthleteRepresentativeAthleteSearch {
				athletes {
					children {
						athleteId
					}
				}
			}
		}
	`;

	try {
		const response =
			await worldAthleticsClient.request<AthleteSearchResponse>(query);
		// Flatten the nested structure and convert numbers to strings
		return response.getAthleteRepresentativeAthleteSearch.athletes
			.flatMap((athlete) => athlete.children)
			.map((child) => child.athleteId.toString());
	} catch (error) {
		console.error("Error fetching athlete IDs:", error);
		return [];
	}
}

async function getAthleteIdsByCountry(countryCode: string): Promise<string[]> {
	const query = `
		query GetLeadingAthletes($all: Boolean, $preferredCountry: String) {
			getLeadingAthletes(all: $all, preferredCountry: $preferredCountry) {
				eventResults {
					results {
						competitor {
							id
						}
					}
				}
			}
		}
	`;

	try {
		const response =
			await worldAthleticsClient.request<LeadingAthletesResponse>(query, {
				all: true,
				preferredCountry: countryCode,
			});

		// Flatten the nested structure and convert numbers to strings
		return response.getLeadingAthletes.eventResults
			.flatMap((event) => event.results)
			.map((result) => result.competitor.id.toString());
	} catch (error) {
		console.error(`Error fetching athletes for country ${countryCode}:`, error);
		return [];
	}
}

async function importAthletes() {
	// Get athletes from the first method
	const athleteIds = await getAthleteIds();
	console.log(`Found ${athleteIds.length} athletes from representative search`);

	// Get athletes from each country
	const countryAthleteIds = new Set<string>();
	for (const [code3] of Object.entries(countryCodeMap)) {
		console.log(`Fetching athletes from country: ${code3}`);
		const ids = await getAthleteIdsByCountry(code3);
		for (const id of ids) {
			countryAthleteIds.add(id);
		}

		// Add delay between country requests
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	console.log(
		`Found ${countryAthleteIds.size} additional athletes from countries`,
	);

	// Combine and deduplicate athlete IDs
	const allAthleteIds = [...new Set([...athleteIds, ...countryAthleteIds])];
	console.log(`Total unique athletes to process: ${allAthleteIds.length}`);

	for (const id of allAthleteIds) {
		console.log(`Importing athlete ${id}...`);
		const athleteData = await getAthleteById(id);

		// Add delay to avoid rate limiting
		await new Promise((resolve) => setTimeout(resolve, 200));

		if (!athleteData) {
			console.error(`Failed to fetch athlete ${id}`);
			continue;
		}

		// Insert or update athlete
		await db
			.insert(athletes)
			.values({
				id: athleteData.id,
				name: athleteData.name,
				countryCode: athleteData.countryCode ?? null,
				countryName: athleteData.countryName ?? null,
				dateOfBirth: parseBirthDate(athleteData.dateOfBirth),
			})
			.onConflictDoUpdate({
				target: athletes.id,
				set: {
					name: athleteData.name,
					countryCode: athleteData.countryCode ?? null,
					countryName: athleteData.countryName ?? null,
					dateOfBirth: parseBirthDate(athleteData.dateOfBirth),
					updatedAt: sql`CURRENT_TIMESTAMP`,
				},
			});

		// Insert personal bests as results
		if (athleteData.personalBests) {
			for (const result of athleteData.personalBests) {
				const resultId = `${athleteData.id}-${result.discipline}-${result.date}`;

				await db
					.insert(athleteResults)
					.values({
						id: resultId,
						athleteId: athleteData.id,
						competitionName: result.eventName,
						date: result.date,
						discipline: result.discipline,
						performance: result.mark,
						place: null,
						wind: null,
					})
					.onConflictDoNothing();
			}
		}

		console.log(`Successfully imported athlete ${athleteData.name}`);
	}
}

// Execute the script
importAthletes()
	.then(() => {
		console.log("✅ Import completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Import failed:", error);
		process.exit(1);
	});
