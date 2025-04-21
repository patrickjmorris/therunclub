import { fetchRaces } from "../src/lib/runsignup-api";
import { parseDistanceToMiles } from "../src/lib/utils/event-helpers";
import type { EventDetails } from "../src/types/runsignup";

// --- Configuration ---
const ZIP_CODE = "10001"; // Sample ZIP code
const RADIUS = 100; // Sample radius
const SAMPLE_SIZE = 1000; // Number of races to fetch (max 1000 per API docs)

// --- Distance Buckets (Approximate Miles) ---
type RangedBucket = { min: number; max: number; count: number };
type CountOnlyBucket = { count: number };
type AnyBucket = RangedBucket | CountOnlyBucket;

const BUCKETS: Record<string, AnyBucket> = {
	"5k": { min: 2.9, max: 3.3, count: 0 },
	"10k": { min: 6.0, max: 6.4, count: 0 },
	"15k": { min: 9.1, max: 9.5, count: 0 },
	half: { min: 12.9, max: 13.3, count: 0 },
	marathon: { min: 26.0, max: 26.4, count: 0 },
	ultra: { min: 26.41, max: Infinity, count: 0 },
	other: { count: 0 },
	unparseable: { count: 0 },
};
type BucketKey = keyof typeof BUCKETS;

// Store detailed counts for uncategorized items
const unparseableCounts: Map<string, number> = new Map();
const otherCounts: Map<string, { miles: number; count: number }> = new Map();

// Type guard to check if a bucket has min/max
function isRangedBucket(bucket: AnyBucket): bucket is RangedBucket {
	return (
		typeof (bucket as RangedBucket).min === "number" &&
		typeof (bucket as RangedBucket).max === "number"
	);
}

// --- Main Analysis Function ---
async function analyzeDistances() {
	console.log(
		`Fetching ${SAMPLE_SIZE} races near ${ZIP_CODE} (radius: ${RADIUS} miles)...`,
	);

	// biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
	let racesResponse;
	try {
		racesResponse = await fetchRaces(ZIP_CODE, RADIUS, 1, SAMPLE_SIZE);
		if (!racesResponse || !racesResponse.races) {
			console.error("Invalid API response structure.");
			return;
		}
	} catch (error) {
		console.error("Error fetching races:", error);
		return;
	}

	console.log(
		`Analyzing distances from ${racesResponse.races.length} races found...`,
	);
	let eventCount = 0;

	for (const { race } of racesResponse.races) {
		if (!race.events || race.events.length === 0) continue;

		for (const event of race.events as EventDetails[]) {
			eventCount++;
			const rawDistance = event.distance || ""; // Handle null/undefined distance string
			const distanceMiles = parseDistanceToMiles(rawDistance);

			if (distanceMiles === null) {
				BUCKETS.unparseable.count++;
				// Increment count for the specific unparseable string
				unparseableCounts.set(
					rawDistance,
					(unparseableCounts.get(rawDistance) || 0) + 1,
				);
				continue;
			}

			let foundBucket = false;
			const bucketKeys = Object.keys(BUCKETS) as BucketKey[];
			for (const key of bucketKeys) {
				const bucket = BUCKETS[key];
				if (isRangedBucket(bucket)) {
					if (distanceMiles >= bucket.min && distanceMiles <= bucket.max) {
						bucket.count++;
						foundBucket = true;
						break;
					}
				}
			}

			if (!foundBucket) {
				BUCKETS.other.count++;
				// Increment count for the specific 'other' string and store miles
				const existing = otherCounts.get(rawDistance);
				otherCounts.set(rawDistance, {
					miles: distanceMiles,
					count: (existing?.count || 0) + 1,
				});
			}
		}
	}

	console.log("\n--- Distance Analysis Results ---");
	console.log(`Total events analyzed: ${eventCount}`);
	console.log("Counts per Bucket:");
	const resultKeys = Object.keys(BUCKETS) as BucketKey[];
	for (const key of resultKeys) {
		const bucket = BUCKETS[key];
		let range = "";
		if (isRangedBucket(bucket)) {
			range = ` (${bucket.min}-${
				bucket.max === Infinity ? "inf" : bucket.max
			} miles)`;
		}
		console.log(`  ${key.padEnd(12)}: ${bucket.count}${range}`);
	}

	// --- Print Top Unparseable Strings ---
	console.log("\n--- Top Unparseable Distance Strings ---");
	const sortedUnparseable = Array.from(unparseableCounts.entries()).sort(
		(a, b) => b[1] - a[1],
	);
	for (const [str, count] of sortedUnparseable.slice(0, 15)) {
		console.log(`  ${count}x: "${str}"`);
	}
	if (sortedUnparseable.length > 15) console.log("  ...");

	// --- Print Top Other Strings ---
	console.log(
		"\n--- Top 'Other' Distance Strings (Successfully Parsed Miles) ---",
	);
	const sortedOther = Array.from(otherCounts.entries()).sort(
		(a, b) => b[1].count - a[1].count,
	);
	for (const [str, { miles, count }] of sortedOther.slice(0, 15)) {
		console.log(`  ${count}x: "${str}" (${miles.toFixed(2)} miles)`);
	}
	if (sortedOther.length > 15) console.log("  ...");

	console.log(
		"\nNote: 'other' includes parseable distances not fitting standard buckets.",
	);
}

// --- Run the script ---

analyzeDistances().catch((err) => {
	console.error("Script failed:", err);
	process.exit(1);
});
