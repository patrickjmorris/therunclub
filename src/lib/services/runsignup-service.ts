import { Race } from "@/db/schema";

interface RunSignUpEvent {
	event_id: number;
	name: string;
	details: string | null;
	start_time: string;
	end_time: string;
	registration_opens: string;
	event_type: string;
	distance: string;
	registration_periods: Array<{
		registration_opens: string;
		registration_closes: string;
		race_fee: string;
		processing_fee: string;
	}>;
}

interface RunSignUpRace {
	race_id: number;
	name: string;
	next_date: string;
	next_end_date: string;
	is_registration_open: "T" | "F";
	description: string;
	url: string;
	address: {
		street: string | null;
		street2: string | null;
		city: string;
		state: string;
		zipcode: string;
		country_code: string;
	};
	logo_url: string | null;
	events: RunSignUpEvent[];
}

interface RunSignUpResponse {
	race?: {
		race: RunSignUpRace;
	};
	races?: Array<{
		race: RunSignUpRace;
	}>;
	next_page?: string;
	total?: number;
	error?: {
		error_code: number;
		error_msg: string;
	};
}

const BASE_URL = "https://runsignup.com/Rest/races";
const RACE_URL = "https://runsignup.com/Rest/race";
const AFFILIATE_TOKEN = process.env.RUNSIGNUP_AFFILIATE_TOKEN;

if (!process.env.RUNSIGNUP_API_KEY || !process.env.RUNSIGNUP_API_SECRET) {
	throw new Error("RunSignUp API credentials are not configured");
}

const API_KEY = process.env.RUNSIGNUP_API_KEY;
const API_SECRET = process.env.RUNSIGNUP_API_SECRET;

function addAffiliateToken(url: string | undefined): string {
	if (!url || !AFFILIATE_TOKEN || !url.includes("runsignup.com"))
		return url ?? "";

	const urlObj = new URL(url);
	urlObj.searchParams.set("raceReferal", AFFILIATE_TOKEN);
	return urlObj.toString();
}

export async function getRaces(page = 1): Promise<RunSignUpResponse> {
	const params = new URLSearchParams();
	params.append("format", "json");
	params.append("page", page.toString());
	params.append("results_per_page", "1000");
	params.append("sort", "date");
	params.append("race_type", "running_race");
	params.append("only_partner_races", "F");
	params.append("event_type", "running_race");
	params.append("distance_units", "K");
	params.append("events", "T");
	params.append("api_key", API_KEY);
	params.append("api_secret", API_SECRET);

	const response = await fetch(`${BASE_URL}?${params}`);
	if (!response.ok) {
		throw new Error(`Failed to fetch races: ${response.statusText}`);
	}

	const data = await response.json();
	if (data.error) {
		throw new Error(`API Error: ${JSON.stringify(data.error)}`);
	}

	return data;
}

export async function getRaceDetails(raceId: number): Promise<RunSignUpRace> {
	const params = new URLSearchParams({
		format: "json",
		race_id: raceId.toString(),
		api_key: API_KEY,
		api_secret: API_SECRET,
	});

	const response = await fetch(`${RACE_URL}/${raceId}?${params}`);
	if (!response.ok) {
		throw new Error(`Failed to fetch race details: ${response.statusText}`);
	}

	const data = await response.json();
	if (data.error) {
		throw new Error(`API Error: ${data.error}`);
	}

	return data.race;
}

function parseDistance(distance: string): number {
	const value = parseFloat(distance);
	if (Number.isNaN(value)) return 5000; // Default to 5K if parsing fails

	if (distance.toLowerCase().includes("k")) {
		return Math.round(value * 1000); // Convert to meters and round
	}

	if (distance.toLowerCase().includes("mi")) {
		return Math.round(value * 1609.34); // Convert miles to meters and round
	}

	if (distance.toLowerCase().includes("m")) {
		return Math.round(value); // Round to nearest meter
	}

	// If no unit specified, assume kilometers
	return Math.round(value * 1000);
}

export function mapToRace(raceData: { race: RunSignUpRace }): Omit<Race, "id"> {
	const runSignUpRace = raceData.race;

	// Generate a fallback ID if race_id is missing
	const externalId =
		runSignUpRace.race_id?.toString() ??
		`fallback-${Date.now()}-${Math.random().toString(36).slice(2)}`;

	// Get the first event's data
	const firstEvent = runSignUpRace.events?.[0];

	// Get the registration period with the lowest price
	const lowestPricePeriod = firstEvent?.registration_periods?.reduce(
		(lowest, current) => {
			const currentPrice = parseFloat(current.race_fee.replace("$", ""));
			const lowestPrice = parseFloat(lowest.race_fee.replace("$", ""));
			return currentPrice < lowestPrice ? current : lowest;
		},
		firstEvent.registration_periods[0],
	);

	// Safely construct location string with null checks
	const locationParts = [
		runSignUpRace.address?.city,
		runSignUpRace.address?.state,
		runSignUpRace.address?.country_code,
	].filter(Boolean);
	const location =
		locationParts.length > 0 ? locationParts.join(", ") : "Virtual Race";

	// Determine registration status based on is_registration_open flag
	const registrationStatus: "not_open" | "open" | "closed" | "waitlist" =
		runSignUpRace.is_registration_open === "T" ? "open" : "closed";

	return {
		name: runSignUpRace.name ?? "Untitled Race",
		description: runSignUpRace.description ?? "",
		date: new Date(runSignUpRace.next_date ?? Date.now()),
		registrationDeadline: runSignUpRace.next_end_date
			? new Date(runSignUpRace.next_end_date)
			: null,
		location,
		distance: firstEvent ? parseDistance(firstEvent.distance) : 5000,
		elevation: null,
		price: lowestPricePeriod
			? Math.round(
					parseFloat(lowestPricePeriod.race_fee.replace("$", "")) * 100,
			  )
			: null,
		type: "road", // Default to road since type isn't in the basic response
		terrain: "road", // Default to road since terrain isn't in the basic response
		website: addAffiliateToken(runSignUpRace.url),
		organizerId: null,
		maxParticipants: null, // Not in basic response
		currentParticipants: null, // Not in basic response
		externalId,
		registrationStatus,
		isTimed: true, // Assuming all races are timed by default
		timingMethod: null,
		isVirtual: false, // Assuming not virtual by default
		ageRestrictions: null, // Not in basic response
		images: {
			logo: runSignUpRace.logo_url ?? undefined,
			header: undefined, // No header image in basic response
		},
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}
