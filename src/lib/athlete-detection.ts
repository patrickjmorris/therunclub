import { db } from "@/db/client";
import { athletes, athleteMentions, episodes, type Episode } from "@/db/schema";
import { eq, isNull, desc, and, sql, not } from "drizzle-orm";
import { createFuzzyMatcher } from "./fuzzy-matcher";

interface DetectedAthlete {
	athleteId: string;
	confidence: number;
	context: string;
}

interface AthleteRecord {
	id: string | null;
	name: string;
}

/**
 * Detects athlete mentions in text using a combination of exact and fuzzy matching
 */
async function detectAthletes(text: string): Promise<DetectedAthlete[]> {
	console.time("detectAthletes");

	// Cache athletes in memory for faster lookups
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

	// Then try fuzzy matches for remaining text
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

/**
 * Process an episode to detect and store athlete mentions
 */
export async function processEpisodeAthletes(episodeId: string) {
	console.time(`processEpisode:${episodeId}`);
	console.log("[Athlete Detection] Processing episode:", episodeId);

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

	console.log("[Athlete Detection] Found episode:", {
		id: episode.id,
		titleLength: episode.title?.length || 0,
		hasContent: !!episode.content,
	});

	// Process title
	const titleAthletes = await detectAthletes(episode.title);
	console.log("[Athlete Detection] Title matches:", titleAthletes.length);

	for (const athlete of titleAthletes) {
		try {
			console.log("[Athlete Detection] Inserting title mention:", {
				athleteId: athlete.athleteId,
				contentId: episode.id,
				contentType: "podcast",
				source: "title",
				confidence: athlete.confidence.toString(),
				context: athlete.context,
			});

			await db.insert(athleteMentions).values({
				athleteId: athlete.athleteId,
				contentId: episode.id,
				contentType: "podcast",
				source: "title",
				confidence: athlete.confidence.toString(),
				context: athlete.context,
			});
		} catch (error) {
			console.error(
				"[Athlete Detection] Error inserting title mention:",
				error,
			);
		}
	}

	// Process description/content if available
	let contentAthletes: DetectedAthlete[] = [];
	if (episode.content) {
		contentAthletes = await detectAthletes(episode.content);
		console.log("[Athlete Detection] Content matches:", contentAthletes.length);

		for (const athlete of contentAthletes) {
			try {
				console.log("[Athlete Detection] Inserting content mention:", {
					athleteId: athlete.athleteId,
					contentId: episode.id,
					contentType: "podcast",
					source: "description",
					confidence: athlete.confidence.toString(),
					context: athlete.context,
				});

				await db.insert(athleteMentions).values({
					athleteId: athlete.athleteId,
					contentId: episode.id,
					contentType: "podcast",
					source: "description",
					confidence: athlete.confidence.toString(),
					context: athlete.context,
				});
			} catch (error) {
				console.error(
					"[Athlete Detection] Error inserting content mention:",
					error,
				);
			}
		}
	}

	// Mark episode as processed
	await db
		.update(episodes)
		.set({ athleteMentionsProcessed: true })
		.where(eq(episodes.id, episodeId));

	console.timeEnd(`processEpisode:${episodeId}`);
	return {
		titleMatches: titleAthletes.length,
		contentMatches: contentAthletes.length,
	};
}

/**
 * Process episodes in batches for better throughput
 */
async function processBatch(episodeBatch: { id: string }[], batchSize: number) {
	console.time(`processBatch:${batchSize}`);

	const results = await Promise.all(
		episodeBatch.map(async (episode) => {
			try {
				return await processEpisodeAthletes(episode.id);
			} catch (error) {
				console.error(`Error processing episode ${episode.id}:`, error);
				return null;
			}
		}),
	);

	const succeeded = results.filter(Boolean).length;
	const failed = results.filter((r) => r === null).length;

	console.timeEnd(`processBatch:${batchSize}`);
	return { succeeded, failed };
}

/**
 * Get processing statistics for athlete mention detection
 */
export async function getProcessingStats() {
	const [totalCount] = await db
		.select({ count: sql<number>`count(*)` })
		.from(episodes)
		.where(sql`${episodes.pubDate} IS NOT NULL`);

	const [processedCount] = await db
		.select({ count: sql<number>`count(*)` })
		.from(episodes)
		.where(
			and(
				sql`${episodes.pubDate} IS NOT NULL`,
				eq(episodes.athleteMentionsProcessed, true),
			),
		);

	const [unprocessedCount] = await db
		.select({ count: sql<number>`count(*)` })
		.from(episodes)
		.where(
			and(
				sql`${episodes.pubDate} IS NOT NULL`,
				not(eq(episodes.athleteMentionsProcessed, true)),
			),
		);

	const [mentionsCount] = await db
		.select({ count: sql<number>`count(*)` })
		.from(athleteMentions);

	return {
		total: totalCount?.count || 0,
		processed: processedCount?.count || 0,
		unprocessed: unprocessedCount?.count || 0,
		totalMentions: mentionsCount?.count || 0,
	};
}

/**
 * Process all episodes that haven't been processed yet, prioritizing newest episodes
 */
export async function processAllEpisodes(batchSize = 10) {
	console.log("\nStarting athlete mention detection...");

	// Get initial stats
	const initialStats = await getProcessingStats();
	console.log("\nInitial Status:");
	console.log(`- Total episodes: ${initialStats.total}`);
	console.log(`- Previously processed: ${initialStats.processed}`);
	console.log(`- Remaining to process: ${initialStats.unprocessed}`);
	console.log(`- Total athlete mentions: ${initialStats.totalMentions}\n`);

	// Get all unprocessed episodes, ordered by publish date
	const unprocessedEpisodes = await db
		.select({ id: episodes.id })
		.from(episodes)
		.where(
			and(
				not(eq(episodes.athleteMentionsProcessed, true)),
				sql`${episodes.pubDate} IS NOT NULL`,
			),
		)
		.orderBy(desc(episodes.pubDate));

	console.log(`Found ${unprocessedEpisodes.length} episodes to process\n`);

	let totalProcessed = 0;
	let totalErrors = 0;
	const startTime = Date.now();

	// Process in batches
	for (let i = 0; i < unprocessedEpisodes.length; i += batchSize) {
		const batch = unprocessedEpisodes.slice(i, i + batchSize);
		const { succeeded, failed } = await processBatch(batch, batchSize);

		totalProcessed += succeeded;
		totalErrors += failed;

		// Calculate progress percentage and elapsed time
		const progress = ((i + batch.length) / unprocessedEpisodes.length) * 100;
		const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;

		console.log(
			`Batch ${
				Math.floor(i / batchSize) + 1
			}: ${succeeded} processed, ${failed} errors`,
			`(Progress: ${progress.toFixed(1)}%, Time: ${elapsedMinutes.toFixed(
				1,
			)}m)`,
		);
	}

	// Get final stats
	const finalStats = await getProcessingStats();
	const totalTime = (Date.now() - startTime) / 1000 / 60;

	console.log("\nProcessing complete:");
	console.log(`- Time taken: ${totalTime.toFixed(1)} minutes`);
	console.log(`- Episodes processed: ${totalProcessed}`);
	console.log(`- Errors encountered: ${totalErrors}`);
	console.log(
		`- New athlete mentions: ${
			finalStats.totalMentions - initialStats.totalMentions
		}`,
	);
	console.log("\nFinal Status:");
	console.log(`- Total episodes processed: ${finalStats.processed}`);
	console.log(`- Episodes remaining: ${finalStats.unprocessed}`);
	console.log(`- Total athlete mentions: ${finalStats.totalMentions}`);

	return {
		processed: totalProcessed,
		errors: totalErrors,
		stats: finalStats,
	};
}
