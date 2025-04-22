import type {
	RunSignupRacesResponse,
	RunSignupRaceResponse,
} from "@/types/runsignup";

// Define allowed distance units based on API docs
type DistanceUnit = "K" | "M" | "y" | "m";

/**
 * Fetches races from the RunSignup API with filtering options.
 * Uses env vars RUNSIGNUP_API_KEY, RUNSIGNUP_API_SECRET, RUNSIGNUP_AFFILIATE_TOKEN
 */
export async function fetchRaces(
	zip: string,
	radius = 25,
	page = 1,
	perPage = 17,
	startDate?: string,
	endDate?: string,
	eventType?: string,
	minDistance?: number,
	maxDistance?: number,
	dDistanceUnits: DistanceUnit = "K",
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
		events: "T",
		race_headings: "F",
		future_events_only: "T",
		race_links: "F",
		include_waiver: "F",
		include_multiple_waivers: "F",
		include_event_days: "F",
		include_extra_date_info: "F",
		page: String(page),
		results_per_page: String(perPage),
		zipcode: zip,
		radius: String(radius),
		sort: "end_date ASC",
	});

	if (startDate) params.set("start_date", startDate);
	if (endDate) params.set("end_date", endDate);
	if (eventType) params.set("event_type", eventType);
	if (minDistance !== undefined)
		params.set("min_distance", String(minDistance));
	if (maxDistance !== undefined)
		params.set("max_distance", String(maxDistance));
	if (minDistance !== undefined || maxDistance !== undefined) {
		params.set("distance_units", dDistanceUnits);
	}

	const url = `https://runsignup.com/Rest/races?${params.toString()}`;
	console.log("[RunSignup API] Request URL:", url);
	console.log("[RunSignup API] Params:", Object.fromEntries(params.entries()));

	try {
		const res = await fetch(url);
		const rawText = await res.text();
		// console.log("[RunSignup API] Raw response:", rawText);
		if (!res.ok) {
			throw new Error(`RunSignup API error: ${res.status} ${res.statusText}`);
		}
		const data: RunSignupRacesResponse = JSON.parse(rawText);
		if (!data || !Array.isArray(data.races)) {
			console.error("[RunSignup API] Invalid response structure:", data);
			throw new Error("Received invalid data structure from RunSignup API.");
		}
		return data;
	} catch (error: unknown) {
		console.error("[RunSignup API] Fetch error:", error);
		throw new Error(
			`Failed to fetch races from RunSignup API. ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		);
	}
}

/**
 * Fetches a single race by race_id from the RunSignup API (includes events array by default)
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
		future_events_only: "T",
		format: "json",
	});
	const url = `https://runsignup.com/Rest/race/${raceId}?${params.toString()}`;
	console.log("[RunSignup API] Request URL (single race):", url);
	try {
		const res = await fetch(url);
		const rawText = await res.text();
		if (!res.ok) {
			console.error(
				"[RunSignup API] Error response body (single race):",
				rawText,
			);
			throw new Error(
				`RunSignup API error (single race): ${res.status} ${res.statusText}`,
			);
		}
		const data: RunSignupRaceResponse = JSON.parse(rawText);
		if (!data || !data.race) {
			console.error(
				"[RunSignup API] Invalid response structure (single race):",
				data,
			);
			throw new Error(
				"Received invalid data structure from RunSignup API (single race).",
			);
		}
		return data;
	} catch (error: unknown) {
		console.error("[RunSignup API] Fetch error (single race):", error);
		throw new Error(
			`Failed to fetch race from RunSignup API. ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		);
	}
}
