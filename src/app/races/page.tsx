// Main page for race discovery
import { Suspense } from "react"; // Import Suspense
import EventListView from "./components/race-list-view";
import { RaceFilters, COMMON_DISTANCES } from "./components/RaceFilters"; // Import RaceFilters and distance constants
import { fetchRaces } from "@/lib/runsignup-api";
import type { RunSignupRacesResponse, RunSignupRace } from "@/types/runsignup";
import { getUserZipFromHeaders } from "@/lib/geolocation";
import { headers } from "next/headers"; // Import headers for fallback zip
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@/components/ui/table";

// Helper function to get zip from headers (simpler than API call for this page)
async function getZipFromHeaders(): Promise<string | null> {
	const headerList = await headers();
	const relevantHeaders: Record<string, string | undefined> = {
		"x-vercel-ip-postal-code":
			headerList.get("x-vercel-ip-postal-code") ?? undefined,
		"x-vercel-ip-country-region":
			headerList.get("x-vercel-ip-country-region") ?? undefined,
		"cf-postal-code": headerList.get("cf-postal-code") ?? undefined,
	};
	return getUserZipFromHeaders(relevantHeaders);
}

// Define the structure for filters passed to client components
export interface AppliedFilters {
	zip?: string;
	radius?: string;
	startDate?: string;
	endDate?: string;
	eventType?: string;
	status?: string; // For client-side filtering
	minDistance?: string; // Add minDistance
	maxDistance?: string; // Add maxDistance
	distanceKey?: string; // Add distanceKey
	// Add distance units if needed later
}

// Component to handle data fetching and rendering - Modified to accept searchParams
async function RaceDataFetcher({
	searchParams,
}: { searchParams: Record<string, string | string[] | undefined> }) {
	// --- Read params for fetching --- START
	const queryZip =
		typeof searchParams?.zip === "string" ? searchParams.zip : undefined;
	const queryRadius =
		typeof searchParams?.radius === "string" ? searchParams.radius : "50";
	const queryStartDate =
		typeof searchParams?.startDate === "string"
			? searchParams.startDate
			: undefined;
	const queryEndDate =
		typeof searchParams?.endDate === "string"
			? searchParams.endDate
			: undefined;
	const queryEventType =
		typeof searchParams?.eventType === "string"
			? searchParams.eventType
			: undefined;
	const queryDistanceKey =
		typeof searchParams?.distanceKey === "string"
			? searchParams.distanceKey
			: "all";
	const queryPage = Number(searchParams?.page || "1");
	const queryPageSize = Number(searchParams?.pageSize || "50");
	// --- Read params for fetching --- END

	// --- Handle parameter specific logic --- START
	// If eventType is 'all', treat it as undefined for the API call
	const apiEventType = queryEventType === "all" ? undefined : queryEventType;
	// --- Handle parameter specific logic --- END

	// Determine ZIP for fetching
	let zip = queryZip;
	if (!zip) {
		try {
			zip = (await getZipFromHeaders()) || "10001"; // Use header or default
		} catch (e) {
			console.warn("[RaceDataFetcher] Error getting zip from headers:", e);
			zip = "10001"; // Fallback
		}
	}
	const radiusNum = Number(queryRadius) || 50;

	// Handle distanceKey for fetching
	let minDistance: string | undefined = undefined;
	let maxDistance: string | undefined = undefined;
	const selectedDist = COMMON_DISTANCES.find(
		(d: (typeof COMMON_DISTANCES)[number]) => d.key === queryDistanceKey,
	);
	if (selectedDist) {
		if (selectedDist.minMiles !== null) {
			minDistance = String(selectedDist.minMiles);
		}
		if (selectedDist.maxMiles !== null && selectedDist.maxMiles !== Infinity) {
			maxDistance = String(selectedDist.maxMiles);
		} else if (selectedDist.key === "ultra") {
			maxDistance = undefined;
		}
	}

	// Parse distance numbers safely before passing
	const minDistanceNum = minDistance ? parseFloat(minDistance) : NaN;
	const maxDistanceNum = maxDistance ? parseFloat(maxDistance) : NaN;
	const validMinDistance =
		!Number.isNaN(minDistanceNum) && minDistanceNum >= 0
			? minDistanceNum
			: undefined;
	const validMaxDistance =
		!Number.isNaN(maxDistanceNum) && maxDistanceNum >= 0
			? maxDistanceNum
			: undefined;

	let raceData: RunSignupRacesResponse | null = null;
	let fetchError: Error | null = null;

	try {
		raceData = await fetchRaces(
			zip,
			radiusNum,
			queryPage,
			queryPageSize,
			queryStartDate,
			queryEndDate,
			apiEventType,
			validMinDistance,
			validMaxDistance,
		);
		console.log("[FindRaces] API response received.");
	} catch (e) {
		fetchError =
			e instanceof Error ? e : new Error("Failed to fetch race data");
		console.error("[FindRaces] API fetch error", fetchError);
	}

	if (fetchError) {
		return (
			<div className="text-center text-red-600 py-8">
				Error loading races: {fetchError.message}. Please adjust filters or try
				again later.
			</div>
		);
	}

	const races: RunSignupRace[] = raceData?.races?.map((r) => r.race) ?? [];
	const totalRaces = raceData?.total_results ?? 0;
	const totalPages = Math.ceil(totalRaces / queryPageSize);

	// Construct filters object *for passing down to EventListView* based on fetch params
	const appliedFiltersForView: AppliedFilters = {
		zip: queryZip,
		radius: queryRadius,
		startDate: queryStartDate,
		endDate: queryEndDate,
		eventType: queryEventType,
		status:
			typeof searchParams?.status === "string"
				? searchParams.status
				: undefined,
		minDistance: minDistance,
		maxDistance: maxDistance,
		distanceKey: queryDistanceKey,
	};

	return (
		<EventListView
			races={races}
			currentPage={queryPage}
			totalPages={totalPages}
			totalRaces={totalRaces}
			appliedFilters={appliedFiltersForView}
		/>
	);
}

// Loading Skeleton for the table
function TableSkeleton() {
	return (
		<>
			{/* Skeleton for the filter input and page count */}
			<div className="flex justify-between items-center mb-4">
				<Skeleton className="h-10 w-64 max-w-sm" />
				<Skeleton className="h-5 w-48" />
			</div>
			{/* Skeleton mimicking the Table structure */}
			<div className="rounded-md border">
				<Table className="w-full table-fixed">
					<TableHeader>
						<TableRow>
							<TableHead className="w-[300px]">
								<Skeleton className="h-5 w-24" />
							</TableHead>
							<TableHead>
								<Skeleton className="h-5 w-16" />
							</TableHead>
							<TableHead className="hidden md:table-cell">
								<Skeleton className="h-5 w-20" />
							</TableHead>
							<TableHead className="hidden md:table-cell text-right">
								<Skeleton className="h-5 w-12" />
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{[...Array(5)].map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: Skeleton table
							<TableRow key={i}>
								<TableCell className="font-medium">
									<Skeleton className="h-5 w-full" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-5 w-full" />
								</TableCell>
								<TableCell className="hidden md:table-cell">
									<Skeleton className="h-5 w-full" />
								</TableCell>
								<TableCell className="hidden md:table-cell text-right">
									<Skeleton className="h-5 w-full" />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			{/* Skeleton for pagination controls */}
			<div className="flex items-center justify-end space-x-2 py-4">
				<Skeleton className="h-9 w-24" />
				<Skeleton className="h-9 w-24" />
			</div>
		</>
	);
}

// Next.js Server Component for /races - Make it async
export default async function RacesPage({
	searchParams: searchParamsPromise,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
	// Await searchParams if it's a promise
	const searchParams = searchParamsPromise ? await searchParamsPromise : {};

	// --- Read all needed searchParams upfront from the RESOLVED object --- START
	const queryZip =
		typeof searchParams?.zip === "string" ? searchParams.zip : undefined;
	const queryRadius =
		typeof searchParams?.radius === "string" ? searchParams.radius : "50";
	const queryStartDate =
		typeof searchParams?.startDate === "string"
			? searchParams.startDate
			: undefined;
	const queryEndDate =
		typeof searchParams?.endDate === "string"
			? searchParams.endDate
			: undefined;
	const queryEventType =
		typeof searchParams?.eventType === "string"
			? searchParams.eventType
			: undefined;
	const queryStatus =
		typeof searchParams?.status === "string" ? searchParams.status : undefined;
	const queryDistanceKey =
		typeof searchParams?.distanceKey === "string"
			? searchParams.distanceKey
			: "all";
	const queryPage = Number(searchParams?.page || "1");
	// --- Read all needed searchParams upfront --- END

	// Determine the initial ZIP code
	let initialZip = queryZip;
	if (!initialZip) {
		try {
			initialZip = (await getZipFromHeaders()) || "10001";
		} catch (e) {
			console.warn("[RacesPage] Error getting zip from headers:", e);
			initialZip = "10001";
		}
	}

	// Handle distanceKey
	const distanceKeyParam = queryDistanceKey;
	let minDistance: string | undefined = undefined;
	let maxDistance: string | undefined = undefined;

	const selectedDist = COMMON_DISTANCES.find(
		(d: (typeof COMMON_DISTANCES)[number]) => d.key === distanceKeyParam,
	);
	if (selectedDist) {
		if (selectedDist.minMiles !== null) {
			minDistance = String(selectedDist.minMiles);
		}
		if (selectedDist.maxMiles !== null && selectedDist.maxMiles !== Infinity) {
			maxDistance = String(selectedDist.maxMiles);
		} else if (selectedDist.key === "ultra") {
			maxDistance = undefined;
		}
	}

	const initialFilters: AppliedFilters = {
		zip: initialZip,
		radius: queryRadius,
		startDate: queryStartDate,
		endDate: queryEndDate,
		eventType: queryEventType,
		status: queryStatus,
		minDistance: minDistance,
		maxDistance: maxDistance,
		distanceKey: distanceKeyParam,
	};
	const currentPage = queryPage;

	return (
		<main className="max-w-7xl mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Find Races</h1>

			<RaceFilters initialFilters={initialFilters} />

			<Suspense fallback={<TableSkeleton />}>
				<RaceDataFetcher searchParams={searchParams} />
			</Suspense>
		</main>
	);
}
