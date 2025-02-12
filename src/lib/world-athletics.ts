const WORLD_ATHLETICS_API = process.env.WORLD_ATHLETICS_API_URL as string;

if (!WORLD_ATHLETICS_API) {
	throw new Error("WORLD_ATHLETICS_API_URL is not defined");
}

const headers = {
	"x-api-key": process.env.WORLD_ATHLETICS_API_KEY,
	Accept: "application/json",
	"Accept-Language": "en-US,en;q=0.9",
	"Cache-Control": "no-cache",
	Origin: "https://worldathletics.org",
	Referer: "https://worldathletics.org/",
	"User-Agent":
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
	accept: "*/*",
	"content-type": "application/json",
	"sec-ch-ua":
		'"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
	"sec-ch-ua-mobile": "?0",
	"sec-ch-ua-platform": '"macOS"',
	"x-amz-user-agent": "aws-amplify/3.0.2",
};

async function gqlRequest<T>(
	query: string,
	variables?: Record<string, unknown>,
): Promise<T> {
	const response = await fetch(WORLD_ATHLETICS_API, {
		method: "POST",
		headers: {
			...headers,
			"x-api-key": headers["x-api-key"] ?? "",
		},
		body: JSON.stringify({ query, variables }),
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const { data } = await response.json();
	return data;
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
		query GetSingleCompetitor($getSingleCompetitorId: Int) {
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
