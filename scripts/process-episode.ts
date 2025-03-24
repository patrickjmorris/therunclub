import { db } from "@/db/client";
import { episodes, athleteMentions } from "@/db/schema";
import { createFuzzyMatcher } from "@/lib/fuzzy-matcher";
import { eq } from "drizzle-orm";

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
	console.log(`Processing athlete mentions for episode: ${episodeId}`);

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

		console.log(`Episode title: ${episode.title}`);
		console.time("detectAthletes");

		// Process title
		const titleAthletes = await detectAthletes(episode.title);
		for (const athlete of titleAthletes) {
			try {
				await db
					.insert(athleteMentions)
					.values({
						athleteId: athlete.athleteId,
						contentId: episode.id,
						contentType: "podcast" as const,
						source: "title" as const,
						confidence: athlete.confidence.toString(),
						context: athlete.context,
					})
					.onConflictDoUpdate({
						target: [
							athleteMentions.athleteId,
							athleteMentions.contentId,
							athleteMentions.contentType,
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
							contentId: episode.id,
							contentType: "podcast" as const,
							source: "description" as const,
							confidence: athlete.confidence.toString(),
							context: athlete.context,
						})
						.onConflictDoUpdate({
							target: [
								athleteMentions.athleteId,
								athleteMentions.contentId,
								athleteMentions.contentType,
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
		console.log("\nProcessing complete!");
		console.log(`- Title matches: ${titleAthletes.length}`);
		console.log(`- Content matches: ${contentAthletes.length}`);

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
}

// Get episode ID from command line argument
const episodeId = process.argv[2];

if (!episodeId) {
	console.error("Please provide an episode ID as an argument");
	console.error("Usage: bun run scripts/process-episode.ts <episodeId>");
	process.exit(1);
}

// Run the processor
processEpisode(episodeId).catch((error) => {
	console.error("Error:", error);
	process.exit(1);
});
