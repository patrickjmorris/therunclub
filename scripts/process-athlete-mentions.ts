import { db } from "@/db/client";
import { episodes, athleteMentions } from "@/db/schema";
import { createFuzzyMatcher } from "@/lib/fuzzy-matcher";
import { eq, sql, desc, isNull } from "drizzle-orm";

interface DetectedAthlete {
	athleteId: string;
	confidence: number;
	context: string;
}

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

async function processEpisode(episodeId: string) {
	console.time(`processEpisode:${episodeId}`);

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

	// Process title
	const titleAthletes = await detectAthletes(episode.title);
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
	return {
		titleMatches: titleAthletes.length,
		contentMatches: contentAthletes.length,
	};
}

async function processAllEpisodes() {
	console.log("Starting athlete mention detection...");

	// First check total episodes
	const totalEpisodes = await db
		.select({ count: sql<number>`count(*)` })
		.from(episodes);

	console.log(`Total episodes in database: ${totalEpisodes[0].count}`);

	// Check processed status
	const processedStatus = await db
		.select({
			status: episodes.athleteMentionsProcessed,
			count: sql<number>`count(*)`,
		})
		.from(episodes)
		.groupBy(episodes.athleteMentionsProcessed);

	console.log("\nCurrent processing status:");
	for (const { status, count } of processedStatus) {
		console.log(`- ${status === true ? "Processed" : "Unprocessed"}: ${count}`);
	}

	// Get all unprocessed episodes - treat both null and false as unprocessed
	const unprocessedEpisodes = await db
		.select({
			id: episodes.id,
			title: episodes.title,
		})
		.from(episodes)
		.where(sql`${episodes.athleteMentionsProcessed} IS NOT true`)
		.orderBy(desc(episodes.pubDate))
		.limit(100); // Process in batches of 100 to avoid overwhelming the system

	console.log(
		`\nFound ${unprocessedEpisodes.length} episodes to process in this batch`,
	);

	let processed = 0;
	let errors = 0;

	for (const episode of unprocessedEpisodes) {
		try {
			const result = await processEpisode(episode.id);
			console.log(
				`Processed episode ${episode.id} (${episode.title}): ${result.titleMatches} title matches, ${result.contentMatches} content matches`,
			);
			processed++;
		} catch (error) {
			console.error(`Error processing episode ${episode.id}:`, error);
			errors++;
		}
	}

	console.log("\nBatch processing complete!");
	console.log(`- Episodes processed: ${processed}`);
	console.log(`- Errors encountered: ${errors}`);

	// Check if there are more episodes to process
	const remainingCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(episodes)
		.where(sql`${episodes.athleteMentionsProcessed} IS NOT true`);

	if (remainingCount[0].count > 0) {
		console.log(`\nRemaining episodes to process: ${remainingCount[0].count}`);
		console.log("Run the script again to process the next batch.");
	}
}

// Run the processor
processAllEpisodes().catch(console.error);
