import type {
	RunSignupRacesResponse,
	RunSignupRaceResponse,
} from "@/types/runsignup";

/**
 * Fetches races from the RunSignup API for a given zip code and radius.
 * Uses env vars RUNSIGNUP_API_KEY, RUNSIGNUP_API_SECRET, RUNSIGNUP_AFFILIATE_TOKEN
 */
export async function fetchRaces(
	zip: string,
	radius = 25,
	page = 1,
	perPage = 25,
): Promise<RunSignupRacesResponse> {
	const apiKey = process.env.RUNSIGNUP_API_KEY;
	const apiSecret = process.env.RUNSIGNUP_API_SECRET;
	const affiliateToken = process.env.RUNSIGNUP_AFFILIATE_TOKEN;

	if (!apiKey || !apiSecret || !affiliateToken) {
		throw new Error(
			"RunSignup API credentials are not set in environment variables.",
		);
	}

	const params = new URLSearchParams({
		api_key: apiKey,
		api_secret: apiSecret,
		affiliate_token: affiliateToken,
		format: "json",
		events: "F",
		race_headings: "F",
		race_links: "F",
		include_waiver: "F",
		include_multiple_waivers: "F",
		include_event_days: "F",
		include_extra_date_info: "F",
		page: String(page),
		results_per_page: String(perPage),
		zipcode: zip,
		radius: String(radius),
		sort: "end_date",
	});

	const url = `https://runsignup.com/Rest/races?${params.toString()}`;
	console.log("[RunSignup API] Request URL:", url);
	console.log("[RunSignup API] Params:", Object.fromEntries(params.entries()));

	try {
		const res = await fetch(url);
		const rawText = await res.text();
		console.log("[RunSignup API] Raw response:", rawText);
		if (!res.ok) {
			throw new Error(`RunSignup API error: ${res.status} ${res.statusText}`);
		}
		const data = JSON.parse(rawText);
		// Structure matches types
		return data;
		// biome-ignore lint/suspicious/noExplicitAny: Remove since it's only errors
	} catch (error: any) {
		console.error("[RunSignup API] Fetch error:", error);
		throw new Error("Failed to fetch races from RunSignup API.");
	}
}

/**
 * Fetches a single race by race_id from the RunSignup API (includes events array)
 */
export async function fetchRace(
	raceId: number | string,
): Promise<RunSignupRaceResponse> {
	const apiKey = process.env.RUNSIGNUP_API_KEY;
	const apiSecret = process.env.RUNSIGNUP_API_SECRET;
	const affiliateToken = process.env.RUNSIGNUP_AFFILIATE_TOKEN;

	if (!apiKey || !apiSecret || !affiliateToken) {
		throw new Error(
			"RunSignup API credentials are not set in environment variables.",
		);
	}

	const params = new URLSearchParams({
		api_key: apiKey,
		api_secret: apiSecret,
		affiliate_token: affiliateToken,
		format: "json",
		events: "T",
		future_events_only: "T",
	});
	const url = `https://runsignup.com/Rest/race/${raceId}?${params.toString()}`;
	console.log("[RunSignup API] Request URL:", url);
	try {
		const res = await fetch(url);
		const rawText = await res.text();
		if (!res.ok) {
			throw new Error(`RunSignup API error: ${res.status} ${res.statusText}`);
		}
		const data = JSON.parse(rawText);
		return data;
		// biome-ignore lint/suspicious/noExplicitAny: Remove since it's only errors
	} catch (error: any) {
		console.error("[RunSignup API] Fetch error:", error);
		throw new Error("Failed to fetch race from RunSignup API.");
	}
}
