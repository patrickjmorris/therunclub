import { fetchRace } from "@/lib/runsignup-api"; // Use fetchRace
import RaceDetailsView from "./components/RaceDetailsView";
import type { RunSignupRace, RunSignupRaceResponse } from "@/types/runsignup"; // Import correct types
import { Suspense } from "react";

// TODO: Add better loading UI with Skeleton
function LoadingFallback() {
	return <div>Loading race details...</div>;
}

// TODO: Add better error UI
function ErrorFallback({ error }: { error: Error }) {
	return <div>Error loading race details: {error.message}</div>;
}

export default async function RaceDetailPage({
	params,
}: { params: { race_id: string } }) {
	const { race_id } = params;

	let raceData: RunSignupRace | null = null;
	let fetchError: Error | null = null;

	try {
		console.log(`Fetching data for race_id: ${race_id}`);
		const response: RunSignupRaceResponse = await fetchRace(race_id); // Call fetchRace
		raceData = response.race; // Extract the race object
	} catch (error) {
		fetchError =
			error instanceof Error
				? error
				: new Error("Failed to fetch race details");
		console.error("Failed to fetch race details:", fetchError);
	}

	// Handle Error State
	if (fetchError) {
		return <ErrorFallback error={fetchError} />;
	}

	// Handle Not Found State (or raceData is null/undefined after fetch)
	if (!raceData) {
		// This case might indicate a 404 or empty response from API
		// You might want to use Next.js notFound() utility here
		// import { notFound } from 'next/navigation';
		// notFound();
		return <div>Race not found.</div>;
	}

	return (
		<Suspense fallback={<LoadingFallback />}>
			<RaceDetailsView raceData={raceData} />
		</Suspense>
	);
}
