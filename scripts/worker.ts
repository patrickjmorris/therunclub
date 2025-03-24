import { Queue, Worker, Job } from "bullmq";
import { db } from "@/db/client";
import { episodes, athleteMentions, athletes } from "@/db/schema";
import { createFuzzyMatcher } from "@/lib/fuzzy-matcher";
import { eq } from "drizzle-orm";
import { Redis } from "ioredis";
import { processContentAthletes } from "../src/lib/services/athlete-service";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env" });

interface DetectedAthlete {
	athleteId: string;
	confidence: number;
	context: string;
}

interface AthleteDetectionJob {
	contentId: string;
	contentType: "podcast" | "video";
}

// Environment configuration
const isDevelopment = process.env.NODE_ENV !== "production";
// Always use local Redis for backfill jobs
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

console.log(
	"[Worker] Environment:",
	isDevelopment ? "development" : "production",
);
console.log("[Worker] Using local Redis for backfill job");
console.log(
	"[Worker] Redis URL:",
	REDIS_URL?.split("@")[1] || "localhost:6379",
);

// Parse Redis URL for host and port
const redisUrl = new URL(REDIS_URL);
const redisConfig = {
	host: redisUrl.hostname || "localhost",
	port: parseInt(redisUrl.port || "6379", 10),
	// No need for TLS or auth for local Redis
};

export const athleteDetectionQueue = new Queue<AthleteDetectionJob>(
	"athlete-detection",
	{
		connection: redisConfig,
		defaultJobOptions: {
			attempts: 3,
			backoff: {
				type: "exponential",
				delay: 1000,
			},
			removeOnComplete: true,
			removeOnFail: false,
		},
	},
);

async function detectAthletes(text: string): Promise<DetectedAthlete[]> {
	console.time("detectAthletes");

	// Get all athletes
	const allAthletes = await db
		.select({
			id: athletes.worldAthleticsId,
			name: athletes.name,
		})
		.from(athletes);

	const detectedAthletes: DetectedAthlete[] = [];
	const athleteMap = new Map(
		allAthletes
			.filter(
				(athlete): athlete is { id: string; name: string } =>
					athlete.id !== null,
			)
			.map((athlete) => [athlete.name.toLowerCase(), athlete.id]),
	);

	// First try exact matches (faster)
	console.time("exactMatches");
	for (const [name, id] of athleteMap.entries()) {
		const regex = new RegExp(`\\b${name}\\b`, "gi");
		const matches = Array.from(text.matchAll(regex));

		for (const match of matches) {
			if (match.index !== undefined) {
				const start = Math.max(0, match.index - 50);
				const end = Math.min(text.length, match.index + name.length + 50);
				const context = text.slice(start, end).toString();

				detectedAthletes.push({
					athleteId: id,
					confidence: 1.0,
					context,
				});
			}
		}
	}
	console.timeEnd("exactMatches");

	// Then try fuzzy matches
	console.time("fuzzyMatches");
	const fuzzyMatcher = createFuzzyMatcher(Array.from(athleteMap.keys()));
	const words = text.split(/\s+/);

	for (let i = 0; i < words.length; i++) {
		const phrase = words.slice(i, i + 3).join(" ");
		const matches = fuzzyMatcher.search(phrase);

		for (const match of matches) {
			if (match.score >= 0.8) {
				const athleteId = athleteMap.get(match.target.toLowerCase());
				if (athleteId) {
					const start = Math.max(0, text.indexOf(phrase) - 50);
					const end = Math.min(
						text.length,
						text.indexOf(phrase) + phrase.length + 50,
					);
					const context = text.slice(start, end).toString();

					detectedAthletes.push({
						athleteId,
						confidence: match.score,
						context,
					});
				}
			}
		}
	}
	console.timeEnd("fuzzyMatches");

	// Remove duplicates, keeping highest confidence match
	const uniqueAthletes = new Map<string, DetectedAthlete>();
	for (const athlete of detectedAthletes) {
		const existing = uniqueAthletes.get(athlete.athleteId);
		if (!existing || existing.confidence < athlete.confidence) {
			uniqueAthletes.set(athlete.athleteId, athlete);
		}
	}

	console.timeEnd("detectAthletes");
	return Array.from(uniqueAthletes.values());
}

// Create the worker
const worker = new Worker<AthleteDetectionJob>(
	"athlete-detection",
	async (job: Job<AthleteDetectionJob>) => {
		const { contentId, contentType } = job.data;
		console.log(
			`[Worker] Starting to process ${contentType} with ID: ${contentId}`,
		);

		try {
			await processContentAthletes(contentId, contentType);
			console.log(
				`[Worker] Successfully processed ${contentType} with ID: ${contentId}`,
			);
		} catch (error) {
			console.error(
				`[Worker] Error processing ${contentType} with ID: ${contentId}:`,
				error,
			);
			throw error;
		}
	},
	{
		connection: redisConfig,
		concurrency: 5,
		limiter: {
			max: 50,
			duration: 1000,
		},
	},
);

// Handle worker events
worker.on("completed", (job) => {
	console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on("failed", (job, error) => {
	console.error(`[Worker] Job ${job?.id} failed:`, error);
});

worker.on("error", (error) => {
	// Ignore lock-related errors as they're handled by the job retry mechanism
	if (!error.message?.includes("Missing lock")) {
		console.error("[Worker] Worker error:", error);
	}
});

worker.on("active", (job) => {
	console.log(`[Worker] Job ${job.id} has started processing`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
	console.log("[Worker] Received SIGTERM signal, shutting down...");
	await worker.close();
	await athleteDetectionQueue.close();
	process.exit(0);
});
