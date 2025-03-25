import { db } from "@/db/client";
import { episodes, athleteMentions, athletes } from "@/db/schema";
import { eq, sql, desc, and } from "drizzle-orm";

interface DetectedAthlete {
	athleteId: string;
	confidence: number;
	context: string;
}

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

	// Only use exact matches
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

	// Delete existing mentions for this episode
	await db
		.delete(athleteMentions)
		.where(
			and(
				eq(athleteMentions.contentId, episodeId),
				eq(athleteMentions.contentType, "podcast"),
			),
		);

	// Process title
	const titleAthletes = await detectAthletes(episode.title);
	for (const athlete of titleAthletes) {
		try {
			await db.insert(athleteMentions).values({
				athleteId: athlete.athleteId,
				contentId: episode.id,
				contentType: "podcast" as const,
				source: "title" as const,
				confidence: athlete.confidence.toString(),
				context: athlete.context,
			});
		} catch (error) {
			console.error("Error inserting title mention:", error);
		}
	}

	// Process description/content if available
	let contentAthletes: DetectedAthlete[] = [];
	if (episode.content) {
		contentAthletes = await detectAthletes(episode.content);
		for (const athlete of contentAthletes) {
			try {
				await db.insert(athleteMentions).values({
					athleteId: athlete.athleteId,
					contentId: episode.id,
					contentType: "podcast" as const,
					source: "description" as const,
					confidence: athlete.confidence.toString(),
					context: athlete.context,
				});
			} catch (error) {
				console.error("Error inserting content mention:", error);
			}
		}
	}

	console.timeEnd(`processEpisode:${episodeId}`);
	return {
		titleMatches: titleAthletes.length,
		contentMatches: contentAthletes.length,
	};
}

async function reprocessEpisodes(episodeIds?: string[], podcastId?: string) {
	console.log("Starting athlete mention reprocessing...");

	if (episodeIds && episodeIds.length > 0) {
		// Process specific episodes
		console.log(`Reprocessing ${episodeIds.length} specific episodes...`);
		let processed = 0;
		let errors = 0;

		for (const episodeId of episodeIds) {
			try {
				const result = await processEpisode(episodeId);
				console.log(
					`Reprocessed episode ${episodeId}: ${result.titleMatches} title matches, ${result.contentMatches} content matches`,
				);
				processed++;
			} catch (error) {
				console.error(`Error reprocessing episode ${episodeId}:`, error);
				errors++;
			}
		}

		console.log("\nReprocessing complete!");
		console.log(`- Episodes processed: ${processed}`);
		console.log(`- Errors encountered: ${errors}`);
	} else {
		// Process all episodes
		console.log("Reprocessing all episodes...");

		// Build query based on podcast ID if provided
		const totalEpisodes = await db
			.select({ count: sql<number>`count(*)` })
			.from(episodes)
			.where(podcastId ? eq(episodes.podcastId, podcastId) : undefined);

		console.log(`Total episodes in database: ${totalEpisodes[0].count}`);

		// Process in batches of 100
		const batchSize = 100;
		let processed = 0;
		let errors = 0;

		while (true) {
			const batch = await db
				.select({
					id: episodes.id,
					title: episodes.title,
				})
				.from(episodes)
				.where(podcastId ? eq(episodes.podcastId, podcastId) : undefined)
				.orderBy(desc(episodes.pubDate))
				.limit(batchSize)
				.offset(processed);

			if (batch.length === 0) break;

			console.log(
				`\nProcessing batch of ${batch.length} episodes (${processed + 1} to ${
					processed + batch.length
				})`,
			);

			for (const episode of batch) {
				try {
					const result = await processEpisode(episode.id);
					console.log(
						`Reprocessed episode ${episode.id} (${episode.title}): ${result.titleMatches} title matches, ${result.contentMatches} content matches`,
					);
					processed++;
				} catch (error) {
					console.error(`Error reprocessing episode ${episode.id}:`, error);
					errors++;
				}
			}
		}

		console.log("\nReprocessing complete!");
		console.log(`- Total episodes processed: ${processed}`);
		console.log(`- Total errors encountered: ${errors}`);
	}
}

// Get episode IDs and podcast ID from command line arguments
const args = process.argv.slice(2);
const podcastId = args[0]?.startsWith("--podcast=")
	? args[0].split("=")[1]
	: undefined;
const episodeIds = podcastId ? args.slice(1) : args;

// Run the reprocessing
reprocessEpisodes(
	episodeIds.length > 0 ? episodeIds : undefined,
	podcastId,
).catch(console.error);
