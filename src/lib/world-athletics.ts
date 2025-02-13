// Default to the known working URL if environment variable is not set
const WORLD_ATHLETICS_API = process.env.WORLD_ATHLETICS_API_URL as string;

if (!process.env.WORLD_ATHLETICS_API_KEY) {
	throw new Error("WORLD_ATHLETICS_API_KEY is not defined");
}

// Log the API URL being used during initialization
// console.log("[World Athletics API] Using API URL:", WORLD_ATHLETICS_API);

const headers = {
	Accept: "*/*",
	"Accept-Language": "en-US,en;q=0.9,da;q=0.8",
	"Cache-Control": "no-cache",
	Connection: "keep-alive",
	Origin: "https://worldathletics.org",
	Pragma: "no-cache",
	Referer: "https://worldathletics.org/",
	"Sec-Fetch-Dest": "empty",
	"Sec-Fetch-Mode": "cors",
	"Sec-Fetch-Site": "same-site",
	"User-Agent":
		"Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
	"content-type": "application/json",
	"x-amz-user-agent": "aws-amplify/3.0.2",
	"x-api-key": process.env.WORLD_ATHLETICS_API_KEY || "",
};

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Create a reusable GraphQL client function to replace worldAthleticsClient
export async function gqlClient<T>(
	query: string,
	variables?: Record<string, unknown>,
): Promise<T> {
	let lastError: Error | null = null;

	for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		try {
			console.log("[World Athletics API] Attempt", attempt, "of", MAX_RETRIES);
			console.log("[World Athletics API] URL:", WORLD_ATHLETICS_API);
			console.log(`[World Athletics API] Query: ${query.slice(0, 100)}...`);
			console.log("[World Athletics API] Variables:", variables);

			const response = await fetch(WORLD_ATHLETICS_API, {
				method: "POST",
				headers,
				body: JSON.stringify({ query, variables }),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`HTTP error! status: ${response.status}, body: ${errorText}`,
				);
			}

			const json = await response.json();

			if (json.errors) {
				console.error("[World Athletics API] GraphQL Errors:", json.errors);
				throw new Error(`GraphQL Error: ${JSON.stringify(json.errors)}`);
			}

			console.log("[World Athletics API] Success on attempt", attempt);
			return json.data;
		} catch (error) {
			lastError = error as Error;
			console.error(
				"[World Athletics API] Attempt",
				attempt,
				"of",
				MAX_RETRIES,
				"failed:",
				error,
			);

			if (attempt < MAX_RETRIES) {
				const delay = INITIAL_RETRY_DELAY * 2 ** (attempt - 1);
				console.log("[World Athletics API] Retrying in", delay, "ms");
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	throw lastError || new Error("All retry attempts failed");
}

// Update the existing gqlRequest to use the new gqlClient
async function gqlRequest<T>(
	query: string,
	variables?: Record<string, unknown>,
): Promise<T> {
	return gqlClient<T>(query, variables);
}

interface AthleteResult {
	id: string;
	competition: {
		name: string;
		date: string;
	};
	discipline: string;
	performance: string;
	place?: number;
	wind?: number;
}

interface CompetitorBasicData {
	birthDate: string;
	countryCode: string;
	countryFullName: string;
	familyName: string;
	givenName: string;
}

interface PersonalBest {
	date: string;
	discipline: string;
	eventName: string;
	records: string[];
	mark: string;
	venue: string;
}

interface CompetitorResponse {
	getSingleCompetitor: {
		_id: string;
		basicData: CompetitorBasicData;
		personalBests: {
			results: PersonalBest[];
			withRecords: boolean;
		};
		honours: Honor[];
	} | null;
}

interface Honor {
	categoryName: string;
	results: Array<{
		competition: string;
		mark: string;
		place: string;
		discipline: string;
	}>;
}

interface Athlete {
	id: string;
	name: string;
	countryCode?: string;
	countryName?: string;
	dateOfBirth?: string;
	personalBests?: PersonalBest[];
	honours?: Honor[];
}

function capitalizeWithHyphens(name: string): string {
	return name
		.toLowerCase()
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("-");
}

function formatName(firstName: string, familyName: string): string {
	const formattedFirstName = capitalizeWithHyphens(firstName);
	const formattedFamilyName = capitalizeWithHyphens(familyName);
	return `${formattedFirstName} ${formattedFamilyName}`;
}

export async function getAthleteById(id: string): Promise<Athlete | null> {
	const query = `
		query GetSingleCompetitor($getSingleCompetitorId: Int!) {
			getSingleCompetitor(id: $getSingleCompetitorId) {
				_id
				basicData {
					birthDate
					countryCode
					countryFullName
					familyName
					givenName
				}
				honours {
					categoryName
					results {
						competition
						mark
						place
						discipline
					}
				}
				personalBests {
					results {
						date
						discipline
						eventName
						records
						mark
						venue
					}
					withRecords
				}
			}
		}
	`;

	const MAX_RETRIES = 3;
	let retries = 0;

	while (retries < MAX_RETRIES) {
		try {
			const data = await gqlRequest<CompetitorResponse>(query, {
				getSingleCompetitorId: parseInt(id, 10),
			});

			if (!data.getSingleCompetitor) return null;

			const { basicData, personalBests, honours } = data.getSingleCompetitor;

			return {
				id: data.getSingleCompetitor._id,
				name: formatName(basicData.givenName, basicData.familyName),
				countryCode: basicData.countryCode,
				countryName: basicData.countryFullName,
				dateOfBirth: basicData.birthDate,
				personalBests: personalBests.results,
				honours: honours,
			};
		} catch (error) {
			retries++;
			console.error(`Attempt ${retries} failed:`, error);
			if (retries === MAX_RETRIES) {
				console.error("Max retries reached for athlete:", id);
				return null;
			}
			await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** retries));
		}
	}
	return null;
}
