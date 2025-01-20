import Queue from "bull";
import { db } from "@/db/client";
import { episodes, athleteMentions } from "@/db/schema";
import { createFuzzyMatcher } from "@/lib/fuzzy-matcher";
import { eq } from "drizzle-orm";

interface DetectedAthlete {
	athleteId: string;
	confidence: number;
	context: string;
}

// Create a new queue instance with Redis configuration
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
console.log("Connecting to Redis at:", REDIS_URL);

const athleteDetectionQueue = new Queue("athlete-detection", REDIS_URL, {
	defaultJobOptions: {
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 1000,
		},
		removeOnComplete: true,
		removeOnFail: false,
	},
	settings: {
		stalledInterval: 30000, // Check for stalled jobs every 30 seconds
		maxStalledCount: 1, // Only try to process a stalled job once
	},
});

async function detectAthletes(text: string): Promise<DetectedAthlete[]> {
	console.time("detectAthletes");

	// Get all athletes
	const allAthletes = await db.query.athletes.findMany({
		columns: {
			id: true,
			name: true,
		},
	});

	const detectedAthletes: DetectedAthlete[] = [];
	const athleteMap = new Map(
		allAthletes.map((athlete) => [athlete.name.toLowerCase(), athlete.id]),
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

// Configure the worker to process jobs with concurrency
athleteDetectionQueue.process(1, async (job) => {
	const { episodeId } = job.data;
	console.log(`Starting to process episode: ${episodeId}`);
	console.time(`processEpisode:${episodeId}`);

	try {
		// Get episode data
		const episode = await db.query.episodes.findFirst({
			where: eq(episodes.id, episodeId),
			columns: {
				id: true,
				title: true,
				content: true,
			},
		});

		if (!episode) {
			throw new Error(`Episode not found: ${episodeId}`);
		}

		console.log(`Processing episode: ${episode.title}`);

		// Process title
		const titleAthletes = await detectAthletes(episode.title);
		console.log(`Found ${titleAthletes.length} athletes in title`);

		for (const athlete of titleAthletes) {
			try {
				await db
					.insert(athleteMentions)
					.values({
						athleteId: athlete.athleteId,
						episodeId: episode.id,
						source: "title",
						confidence: athlete.confidence.toString(),
						context: athlete.context,
					})
					.onConflictDoUpdate({
						target: [
							athleteMentions.athleteId,
							athleteMentions.episodeId,
							athleteMentions.source,
						],
						set: {
							confidence: athlete.confidence.toString(),
							context: athlete.context,
						},
					});
			} catch (error) {
				console.error("Error upserting title mention:", error);
			}
		}

		// Process description/content if available
		let contentAthletes: DetectedAthlete[] = [];
		if (episode.content) {
			contentAthletes = await detectAthletes(episode.content);
			console.log(`Found ${contentAthletes.length} athletes in content`);

			for (const athlete of contentAthletes) {
				try {
					await db
						.insert(athleteMentions)
						.values({
							athleteId: athlete.athleteId,
							episodeId: episode.id,
							source: "description",
							confidence: athlete.confidence.toString(),
							context: athlete.context,
						})
						.onConflictDoUpdate({
							target: [
								athleteMentions.athleteId,
								athleteMentions.episodeId,
								athleteMentions.source,
							],
							set: {
								confidence: athlete.confidence.toString(),
								context: athlete.context,
							},
						});
				} catch (error) {
					console.error("Error upserting content mention:", error);
				}
			}
		}

		// Mark episode as processed
		await db
			.update(episodes)
			.set({ athleteMentionsProcessed: true })
			.where(eq(episodes.id, episodeId));

		console.timeEnd(`processEpisode:${episodeId}`);
		console.log(`Completed processing episode: ${episodeId}`);

		return {
			success: true,
			titleMatches: titleAthletes.length,
			contentMatches: contentAthletes.length,
		};
	} catch (error) {
		console.error(`Error processing episode ${episodeId}:`, error);
		throw error; // Re-throw to mark job as failed
	}
});

// Add event handlers for monitoring
athleteDetectionQueue.on("ready", () => {
	console.log("Worker connected to Redis and ready to process jobs");
});

athleteDetectionQueue.on("active", (job) => {
	console.log(`Started processing episode: ${job.data.episodeId}`);
});

athleteDetectionQueue.on("completed", (job, result) => {
	console.log(`✅ Processed episode ${job.data.episodeId}:`, result);
});

athleteDetectionQueue.on("failed", (job, error) => {
	console.error(`❌ Failed to process episode ${job.data.episodeId}:`, error);
});

athleteDetectionQueue.on("error", (error) => {
	console.error("Queue error:", error);
});

athleteDetectionQueue.on("stalled", (job) => {
	console.warn(`Job ${job.id} has stalled`);
});

// Export the queue for use in other files
export default athleteDetectionQueue;
