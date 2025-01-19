import Queue from "bull";
import { createClient } from "@supabase/supabase-js";
import { createFuzzyMatcher } from "../fuzzy-matcher";
import { config } from "dotenv";

// Load environment variables
config();

// Check required environment variables
if (
	!process.env.NEXT_PUBLIC_SUPABASE_URL ||
	!process.env.SUPABASE_SERVICE_ROLE_KEY
) {
	throw new Error("Missing required Supabase environment variables");
}

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	},
);

// Test the connection
async function testSupabaseConnection() {
	try {
		console.log("Testing connection to Supabase...");
		const { data, error } = await supabase
			.from("episodes")
			.select("id")
			.limit(1);
		if (error) {
			console.error("Supabase connection test failed:", error);
			console.error("Error details:", {
				code: error.code,
				message: error.message,
				details: error.details,
				hint: error.hint,
			});
			return false;
		}
		console.log("✅ Supabase connection test successful");
		return true;
	} catch (error) {
		console.error("Supabase connection test threw an error:", error);
		return false;
	}
}

// Create a new queue instance
const athleteDetectionQueue = new Queue(
	"athlete-detection",
	process.env.REDIS_URL || "redis://localhost:6379",
);

interface DetectedAthlete {
	athleteId: string;
	confidence: number;
	context: string;
}

async function detectAthletes(text: string): Promise<DetectedAthlete[]> {
	console.time("detectAthletes");

	// Get all athletes from Supabase
	const { data: allAthletes, error } = await supabase
		.from("athletes")
		.select("id, name");

	if (error || !allAthletes) {
		console.error("Error fetching athletes:", error);
		return [];
	}

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

// Process jobs one at a time
athleteDetectionQueue.process(async (job) => {
	const { episodeId } = job.data;
	console.time(`processEpisode:${episodeId}`);

	try {
		// Get episode data from Supabase
		const { data: episode, error: episodeError } = await supabase
			.from("episodes")
			.select("id, title, content")
			.eq("id", episodeId)
			.single();

		if (episodeError || !episode) {
			throw new Error(`Episode not found: ${episodeId}`);
		}

		// Process title
		const titleAthletes = await detectAthletes(episode.title);
		for (const athlete of titleAthletes) {
			const { error } = await supabase.from("athlete_mentions").upsert({
				athleteId: athlete.athleteId,
				episodeId: episode.id,
				source: "title",
				confidence: athlete.confidence.toString(),
				context: athlete.context,
			});

			if (error) {
				console.error("Error inserting title mention:", error);
			}
		}

		// Process description/content if available
		let contentAthletes: DetectedAthlete[] = [];
		if (episode.content) {
			contentAthletes = await detectAthletes(episode.content);
			for (const athlete of contentAthletes) {
				const { error } = await supabase.from("athlete_mentions").upsert({
					athleteId: athlete.athleteId,
					episodeId: episode.id,
					source: "description",
					confidence: athlete.confidence.toString(),
					context: athlete.context,
				});

				if (error) {
					console.error("Error inserting content mention:", error);
				}
			}
		}

		// Mark episode as processed
		await supabase
			.from("episodes")
			.update({ athleteMentionsProcessed: true })
			.eq("id", episodeId);

		console.timeEnd(`processEpisode:${episodeId}`);
		return {
			success: true,
			titleMatches: titleAthletes.length,
			contentMatches: contentAthletes.length,
		};
	} catch (error) {
		console.error(`Error processing episode ${episodeId}:`, error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
});

// Add monitoring
athleteDetectionQueue.on("completed", (job, result) => {
	console.log(`✅ Processed episode ${job.data.episodeId}:`, result);
});

athleteDetectionQueue.on("failed", (job, error) => {
	console.error(`❌ Failed to process episode ${job.data.episodeId}:`, error);
});

/**
 * Queue all unprocessed episodes for processing
 */
export async function queueUnprocessedEpisodes() {
	console.log("\nQueuing unprocessed episodes...");

	// Test connection first
	const isConnected = await testSupabaseConnection();
	if (!isConnected) {
		console.error("Cannot proceed: Supabase connection test failed");
		return { queued: 0 };
	}

	// Get all unprocessed episodes from Supabase
	const { data: unprocessedEpisodes, error } = await supabase
		.from("episodes")
		.select("id, title")
		.is("athleteMentionsProcessed", null)
		.order("pubDate", { ascending: false });

	if (error) {
		console.error("Error fetching unprocessed episodes:", error);
		console.error("Error details:", {
			code: error.code,
			message: error.message,
			details: error.details,
			hint: error.hint,
		});
		return { queued: 0 };
	}

	console.log(
		`Found ${unprocessedEpisodes?.length || 0} episodes to process\n`,
	);

	// Add each episode to the queue
	let queued = 0;
	for (const episode of unprocessedEpisodes || []) {
		await athleteDetectionQueue.add(
			{ episodeId: episode.id },
			{
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

	return { queued };
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

	// Get processing stats from Supabase
	const { data: stats, error } = await supabase
		.from("episodes")
		.select("athleteMentionsProcessed", { count: "exact" })
		.or("athleteMentionsProcessed.is.true,athleteMentionsProcessed.is.null");

	const processed =
		stats?.filter((e) => e.athleteMentionsProcessed)?.length || 0;
	const total = stats?.length || 0;

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
			total,
			processed,
			remaining: total - processed,
		},
	};
}

export default athleteDetectionQueue;
