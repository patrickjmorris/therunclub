// Main page for race discovery
import EventListView from "./components/race-list-view";
import { fetchRaces } from "@/lib/runsignup-api";
import type { RunSignupRacesResponse } from "@/types/runsignup";
import { getUserZipFromHeaders } from "@/lib/geolocation";
import type { Headers } from "node-fetch";
// Removed direct header imports
// import { headers } from "next/headers";

// Helper function to fetch ZIP code from our API route
async function getZipCode(): Promise<string | null> {
	try {
		const baseUrl =
			process.env.NEXT_PUBLIC_APP_URL ||
			process.env.VERCEL_URL ||
			"http://localhost:3000";
		const fetchUrl = `${baseUrl}/api/geolocation`;
		console.log(`[getZipCode] Fetching from URL: ${fetchUrl}`); // Log the URL

		const response = await fetch(fetchUrl, {
			cache: "no-store",
		});
		console.log(`[getZipCode] Response status: ${response.status}`); // Log response status

		if (!response.ok) {
			console.error(
				"Geolocation API fetch failed:",
				response.status,
				await response.text(),
			); // Log status and body on failure
			return null;
		}
		const data = await response.json();
		console.log("[getZipCode] Received data:", data); // Log received data
		return data.zipCode ?? null;
	} catch (error) {
		console.error("Error fetching from geolocation API:", error);
		return null; // Ensure return path for catch block
	}
}

// Next.js 15 Server Component for /races
export default async function RacesPage({
	searchParams: searchParamsPromise,
}: {
	searchParams?: Promise<{ zip?: string; radius?: string; page?: string }>;
}) {
	// Await searchParams as a promise (Next.js 15)
	const searchParams = searchParamsPromise ? await searchParamsPromise : {};

	const zipFromQuery = searchParams.zip || "";
	const radius = Number(searchParams.radius) || 25;
	const currentPage = Number(searchParams.page) || 1;
	const resultsPerPage = 25; // Define results per page

	// Use query param if present, else try API geolocation, else fallback
	let zip = zipFromQuery;
	if (!zip) {
		zip = (await getZipCode()) || "10001"; // fallback to NYC
	}

	// Fetch races from the API
	let raceData: RunSignupRacesResponse | null = null;
	let fetchError: Error | null = null;

	console.log("[FindRaces] Fetching races", {
		zip,
		radius,
		page: currentPage,
		perPage: resultsPerPage,
	});
	try {
		raceData = await fetchRaces(zip, radius, currentPage, resultsPerPage);
		console.log("[FindRaces] API response", {
			total: raceData?.total_results,
			sample: raceData?.races?.[0],
		});
	} catch (e) {
		fetchError =
			e instanceof Error ? e : new Error("Failed to fetch race data");
		console.error("[FindRaces] API fetch error", fetchError);
		// Don't set default raceData here, let error handling below manage it
	}

	// TODO: Add Error UI component
	if (fetchError) {
		return (
			<div>
				Error loading races: {fetchError.message}. Please try again later.
			</div>
		);
	}

	// TODO: Add Loading UI component (potentially via Suspense)
	// Although fetch is awaited, a loading state might be good UX if fetch is slow

	const races = raceData?.races?.map((r) => r.race) ?? [];
	const totalRaces = raceData?.total_results ?? 0;
	const totalPages = Math.ceil(totalRaces / resultsPerPage);

	// Log pagination values
	console.log("[Pagination Debug]", {
		totalRaces,
		resultsPerPage,
		totalPages,
		currentPage,
	});

	// UI: ZIP input, radius dropdown, table, pagination
	return (
		<main className="max-w-5xl mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-4">Find Races Near You</h1>

			{/* Search Form */}
			<form
				method="GET"
				action="/races"
				className="flex flex-wrap gap-2 mb-6 items-center"
			>
				<label className="flex items-center gap-1">
					ZIP Code:
					<input
						type="text"
						name="zip"
						defaultValue={zip}
						pattern="\d{5}"
						className="ml-1 border px-2 py-1 rounded w-20"
						maxLength={5}
						placeholder="Enter ZIP"
					/>
				</label>
				<label className="flex items-center gap-1">
					Radius:
					<select
						name="radius"
						defaultValue={radius}
						className="ml-1 border px-2 py-1 rounded"
					>
						{[10, 25, 50, 100].map((r) => (
							<option key={r} value={r}>
								{r} miles
							</option>
						))}
					</select>
				</label>
				{/* Hidden input to reset page number on new search */}
				<input type="hidden" name="page" value="1" />
				<button
					type="submit"
					className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
				>
					Search
				</button>
			</form>

			{/* Pass pagination props */}
			<EventListView
				races={races}
				currentPage={currentPage}
				totalPages={totalPages}
				totalRaces={totalRaces}
				currentQuery={{ zip, radius: String(radius) }} // Pass current search params for pagination links
			/>
		</main>
	);
}
