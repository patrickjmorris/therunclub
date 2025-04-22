// UpcomingRacesWidget stub
import React from "react";
import Link from "next/link";
import { headers } from "next/headers"; // Import headers function
import { fetchRaces } from "@/lib/runsignup-api";
import { getUserZipFromHeaders } from "@/lib/geolocation"; // Correct function name
import { RaceCard } from "@/components/races/RaceCard";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import type { RunSignupRace } from "@/types/runsignup"; // Correct type name

// Define a default ZIP code if geolocation fails
const DEFAULT_ZIP_CODE = "10001";
const DEFAULT_RADIUS = 50; // Default search radius
const RACE_LIMIT = 5;

export async function UpcomingRacesWidget() {
	const headerList = await headers(); // Await the headers() call

	// Extract specific headers needed for geolocation
	const relevantHeaders: Record<string, string | undefined> = {
		"x-vercel-ip-postal-code":
			headerList.get("x-vercel-ip-postal-code") ?? undefined,
		"x-vercel-ip-country-region":
			headerList.get("x-vercel-ip-country-region") ?? undefined,
		"cf-postal-code": headerList.get("cf-postal-code") ?? undefined,
	};

	let zipCode = DEFAULT_ZIP_CODE;
	let raceEntries: { race: RunSignupRace }[] = []; // Type according to API response structure
	let error: string | null = null;

	try {
		// Pass the extracted headers object
		zipCode = getUserZipFromHeaders(relevantHeaders) || DEFAULT_ZIP_CODE;
		const raceData = await fetchRaces(zipCode, DEFAULT_RADIUS, 1, RACE_LIMIT);
		raceEntries = raceData.races || []; // Correctly assign the array of race entries
	} catch (err) {
		console.error("[UpcomingRacesWidget] Error fetching races:", err);
		error = err instanceof Error ? err.message : "An unknown error occurred.";
		// Use default zip for display purposes if geolocation failed
		zipCode = DEFAULT_ZIP_CODE;
	}

	return (
		<section className="py-12 md:py-16">
			<div className="container mx-auto px-4">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
					<h2 className="text-3xl font-bold tracking-tight mb-4 md:mb-0">
						Upcoming Races Near {zipCode}
					</h2>
					<Button asChild variant="outline">
						<Link href="/races">View All Races</Link>
					</Button>
				</div>

				{error && (
					<Alert variant="destructive" className="mb-8">
						<Terminal className="h-4 w-4" />
						<AlertTitle>Error Loading Races</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{!error && raceEntries.length === 0 && (
					<p className="text-center text-muted-foreground">
						No upcoming races found nearby.
					</p>
				)}

				{!error && raceEntries.length > 0 && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
						{raceEntries.map(({ race }) => (
							<RaceCard
								key={race.race_id}
								title={race.name}
								imageUrl={race.logo_url}
								location={`${race.address.city}, ${race.address.state}`}
								date={race.next_date} // Pass the raw date string
								isOpen={race.is_registration_open === "T"} // Correct field name
								raceId={race.race_id}
								// onClick={() => router.push(`/races/${race.race_id}`)} // Requires 'use client' and useRouter
							/>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
