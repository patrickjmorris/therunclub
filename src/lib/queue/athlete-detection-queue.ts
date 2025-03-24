import Queue from "bull";
import { createFuzzyMatcher } from "../fuzzy-matcher";
import { config } from "dotenv";
import { db } from "@/db/client";
import { athletes, episodes, athleteMentions } from "@/db/schema";
import { eq, gt, desc, and, isNull, gte } from "drizzle-orm";

// Load environment variables
config();

// Create a new queue instance with better error handling
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
console.log("[Athlete Detection] Using Redis URL:", REDIS_URL);

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
		lockDuration: 30000, // 30 seconds
		stalledInterval: 30000, // Check for stalled jobs every 30 seconds
		maxStalledCount: 1, // Only try to process a stalled job once
	},
});

interface DetectedAthlete {
	athleteId: string;
	confidence: number;
	context: string;
}

// Cache for athlete data and compiled regex patterns
interface CachedAthlete {
	id: string;
	name: string;
	pattern: RegExp;
}

let athleteCache: Map<string, CachedAthlete> | null = null;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
let lastCacheUpdate = 0;

// Maximum text length to process (100KB)
const MAX_TEXT_LENGTH = 1024;

// Chunk size for fuzzy matching
const FUZZY_CHUNK_SIZE = 1000;

async function getAthletes() {
	const now = Date.now();

	// Return cached data if valid
	if (athleteCache && now - lastCacheUpdate < CACHE_TTL) {
		return athleteCache;
	}

	console.log("[Athlete Detection] Refreshing athlete cache...");

	// Fetch all athletes in batches to reduce memory usage
	const BATCH_SIZE = 1000;
	const athletesMap = new Map<string, CachedAthlete>();

	let hasMore = true;
	let lastId = "";

	while (hasMore) {
		const batch = await db
			.select({
				id: athletes.worldAthleticsId,
				name: athletes.name,
			})
			.from(athletes)
			.where(gt(athletes.worldAthleticsId, lastId))
			.orderBy(athletes.worldAthleticsId)
			.limit(BATCH_SIZE);

		if (!batch || batch.length === 0) {
			hasMore = false;
			break;
		}

		for (const athlete of batch) {
			if (athlete.id) {
				const nameLower = athlete.name.toLowerCase();
				// Pre-compile regex pattern for each athlete
				athletesMap.set(nameLower, {
					id: athlete.id,
					name: athlete.name,
					pattern: new RegExp(
						`\\b${athlete.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
						"gi",
					),
				});
			}
		}

		lastId = batch[batch.length - 1].id || "";

		if (batch.length < BATCH_SIZE) {
			hasMore = false;
		}
	}

	athleteCache = athletesMap;
	lastCacheUpdate = now;

	console.log(
		`[Athlete Detection] Cached ${athletesMap.size} athletes with compiled patterns`,
	);
	return athletesMap;
}

function extractContext(
	text: string,
	matchIndex: number,
	matchLength: number,
): string {
	const start = Math.max(0, matchIndex - 50);
	const end = Math.min(text.length, matchIndex + matchLength + 50);
	return text.slice(start, end).toString();
}

async function detectAthletes(inputText: string): Promise<DetectedAthlete[]> {
	console.time("detectAthletes");

	try {
		// Early return for empty or very long text
		if (!inputText || inputText.length === 0) {
			return [];
		}

		// Truncate very long text
		const text =
			inputText.length > MAX_TEXT_LENGTH
				? inputText.slice(0, MAX_TEXT_LENGTH)
				: inputText;

		if (inputText.length > MAX_TEXT_LENGTH) {
			console.log(
				`[Athlete Detection] Truncating text from ${inputText.length} to ${MAX_TEXT_LENGTH} characters`,
			);
		}

		// Get athletes from cache
		const athleteMap = await getAthletes();
		const detectedAthletes: DetectedAthlete[] = [];

		// First try exact matches using pre-compiled patterns (faster)
		console.time("exactMatches");
		for (const athlete of athleteMap.values()) {
			const matches = Array.from(text.matchAll(athlete.pattern));

			if (matches.length > 0) {
				// Take only first 5 matches per athlete to avoid overloading
				const limitedMatches = matches.slice(0, 5);
				for (const match of limitedMatches) {
					if (match.index !== undefined) {
						detectedAthletes.push({
							athleteId: athlete.id,
							confidence: 1.0,
							context: extractContext(text, match.index, match[0].length),
						});
					}
				}
			}
		}
		console.timeEnd("exactMatches");

		// If we have exact matches, skip fuzzy matching
		if (detectedAthletes.length > 0) {
			console.log(
				`[Athlete Detection] Found ${detectedAthletes.length} exact matches, skipping fuzzy matching`,
			);
			return Array.from(
				new Map(detectedAthletes.map((a) => [a.athleteId, a])).values(),
			);
		}

		// Then try fuzzy matches in chunks
		console.time("fuzzyMatches");
		const fuzzyMatcher = createFuzzyMatcher(Array.from(athleteMap.keys()));
		const words = text.split(/\s+/);

		// Process in chunks of 3 words at a time, with overlap
		for (let i = 0; i < words.length; i += 2) {
			const phrase = words.slice(i, i + 3).join(" ");
			const matches = fuzzyMatcher.search(phrase);

			for (const match of matches) {
				if (match.score >= 0.85) {
					// Increased threshold for better accuracy
					const athlete = athleteMap.get(match.target.toLowerCase());
					if (athlete) {
						const phraseIndex = text.indexOf(phrase);
						if (phraseIndex !== -1) {
							detectedAthletes.push({
								athleteId: athlete.id,
								confidence: match.score,
								context: extractContext(text, phraseIndex, phrase.length),
							});
						}
					}
				}
			}

			// Early return if we've found enough matches
			if (detectedAthletes.length >= 50) {
				console.log(
					"[Athlete Detection] Reached maximum matches, stopping early",
				);
				break;
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
	} catch (error) {
		console.error("[Athlete Detection] Error detecting athletes:", error);
		throw error;
	}
}

// Process jobs with batched database operations
athleteDetectionQueue.process(async (job) => {
	const { episodeId } = job.data;
	console.time(`processEpisode:${episodeId}`);

	try {
		console.log(`[Athlete Detection] Processing episode: ${episodeId}`);

		// Get episode data using Drizzle
		const episode = await db.query.episodes.findFirst({
			where: eq(episodes.id, episodeId),
			columns: {
				id: true,
				title: true,
				content: true,
			},
		});

		if (!episode) {
			console.error("[Athlete Detection] Episode not found in database:", {
				episodeId,
			});
			throw new Error(`Episode not found: ${episodeId}`);
		}

		console.log("[Athlete Detection] Successfully fetched episode:", {
			id: episode.id,
			titleLength: episode.title?.length || 0,
			hasContent: !!episode.content,
		});

		// Process title and content
		const titleAthletes = await detectAthletes(episode.title);
		const contentAthletes = episode.content
			? await detectAthletes(episode.content)
			: [];

		// Batch insert all mentions with proper typing
		const mentions = [
			...titleAthletes.map((athlete) => ({
				athleteId: athlete.athleteId,
				contentId: episode.id,
				contentType: "podcast" as const,
				source: "title" as const,
				confidence: athlete.confidence.toString(),
				context: athlete.context,
			})),
			...contentAthletes.map((athlete) => ({
				athleteId: athlete.athleteId,
				contentId: episode.id,
				contentType: "podcast" as const,
				source: "description" as const,
				confidence: athlete.confidence.toString(),
				context: athlete.context,
			})),
		];

		if (mentions.length > 0) {
			console.log("[Athlete Detection] Batch inserting mentions:", {
				count: mentions.length,
				firstMention: mentions[0],
			});
			await db.insert(athleteMentions).values(mentions);
		}

		// Mark episode as processed
		await db
			.update(episodes)
			.set({ athleteMentionsProcessed: true })
			.where(eq(episodes.id, episodeId));

		console.timeEnd(`processEpisode:${episodeId}`);
		return {
			success: true,
			titleMatches: titleAthletes.length,
			contentMatches: contentAthletes.length,
		};
	} catch (error) {
		console.error(`Error processing episode ${episodeId}:`, error);
		throw error;
	}
});

// Add more detailed queue event handlers
athleteDetectionQueue.on("error", (error) => {
	console.error("[Athlete Detection] Queue error:", error);
});

athleteDetectionQueue.on("waiting", (jobId) => {
	console.log(`[Athlete Detection] Job ${jobId} is waiting`);
});

athleteDetectionQueue.on("active", (job) => {
	console.log(
		`[Athlete Detection] Processing job ${job.id} for episode ${job.data.episodeId}`,
	);
});

athleteDetectionQueue.on("stalled", (job) => {
	console.warn(`[Athlete Detection] Job ${job.id} has stalled`);
});

athleteDetectionQueue.on("completed", (job, result) => {
	console.log(`[Athlete Detection] ✅ Job ${job.id} completed:`, result);
});

athleteDetectionQueue.on("failed", (job, error) => {
	console.error(`[Athlete Detection] ❌ Job ${job.id} failed:`, {
		episodeId: job.data.episodeId,
		error: error.message,
		stack: error.stack,
	});
});

/**
 * Queue all unprocessed episodes for processing
 */
export async function queueUnprocessedEpisodes() {
	console.log("\nQueuing unprocessed episodes...");

	// Calculate date 2 weeks ago
	const twoWeeksAgo = new Date();
	twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

	const MAX_QUEUE_SIZE = 100; // Limit number of episodes to process

	// Get recent unprocessed episodes using Drizzle
	const unprocessedEpisodes = await db.query.episodes.findMany({
		columns: {
			id: true,
			title: true,
			pubDate: true,
		},
		where: and(
			isNull(episodes.athleteMentionsProcessed),
			gte(episodes.pubDate, twoWeeksAgo),
		),
		orderBy: desc(episodes.pubDate),
		limit: MAX_QUEUE_SIZE,
	});

	console.log(
		`Found ${unprocessedEpisodes?.length || 0} recent episodes to process\n`,
		`(Limited to last 2 weeks, max ${MAX_QUEUE_SIZE} episodes)`,
	);

	// Add episodes to the queue with priority based on publish date
	let queued = 0;
	for (const episode of unprocessedEpisodes) {
		const priority = episode.pubDate
			? new Date(episode.pubDate).getTime()
			: Date.now();

		await athleteDetectionQueue.add(
			{ episodeId: episode.id },
			{
				priority,
				attempts: 3,
				backoff: {
					type: "exponential",
					delay: 1000,
				},
				removeOnComplete: true,
				removeOnFail: false,
			},
		);
		queued++;
	}

	return {
		queued,
		maxAge: "2 weeks",
		maxQueueSize: MAX_QUEUE_SIZE,
		totalFound: unprocessedEpisodes?.length || 0,
	};
}

/**
 * Get current queue status
 */
export async function getQueueStatus() {
	const [waiting, active, completed, failed, delayed] = await Promise.all([
		athleteDetectionQueue.getWaitingCount(),
		athleteDetectionQueue.getActiveCount(),
		athleteDetectionQueue.getCompletedCount(),
		athleteDetectionQueue.getFailedCount(),
		athleteDetectionQueue.getDelayedCount(),
	]);

	// Get processing stats using Drizzle
	const [processed, total] = await Promise.all([
		db
			.select({ count: episodes.id })
			.from(episodes)
			.where(eq(episodes.athleteMentionsProcessed, true))
			.execute(),
		db.select({ count: episodes.id }).from(episodes).execute(),
	]);

	return {
		queue: {
			waiting,
			active,
			completed,
			failed,
			delayed,
			total: waiting + active + completed + failed + delayed,
		},
		processing: {
			total: total.length,
			processed: processed.length,
			remaining: total.length - processed.length,
		},
	};
}

export default athleteDetectionQueue;
