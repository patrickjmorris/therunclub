import { db } from "@/db/client";
import {
	athleteHonors,
	athleteMentions,
	athleteResults,
	athletes,
	episodes,
	podcasts,
	athleteCategories,
	videos,
} from "@/db/schema";
import {
	desc,
	eq,
	sql,
	and,
	inArray,
	like,
	isNotNull,
	ilike,
	gte,
	or,
	notInArray,
	not,
	isNull,
} from "drizzle-orm";
import { gqlClient } from "@/lib/world-athletics";
import { countryCodeMap } from "@/lib/utils/country-codes";
import { slugify } from "@/lib/utils";
import { createFuzzyMatcher } from "@/lib/fuzzy-matcher";

// Types for World Athletics API responses
interface AthleteData {
	id: string;
	name: string;
	countryCode?: string;
	countryName?: string;
	dateOfBirth?: string;
	personalBests?: Array<{
		date: string;
		discipline: string;
		eventName: string;
		mark: string;
	}>;
	honours?: Array<{
		categoryName: string;
		results: Array<{
			competition: string;
			mark: string;
			place: string;
			discipline: string;
		}>;
	}>;
}

interface CompetitorResponse {
	getSingleCompetitor: {
		_id: string;
		basicData: {
			birthDate: string;
			countryCode: string;
			countryFullName: string;
			familyName: string;
			givenName: string;
		};
		personalBests?: {
			results: Array<{
				date: string;
				discipline: string;
				eventName: string;
				mark: string;
			}>;
		};
		honours?: Array<{
			categoryName: string;
			results: Array<{
				competition: string;
				mark: string;
				place: string;
				discipline: string;
			}>;
		}>;
	} | null;
}

// Helper function to get athlete data from World Athletics
async function getAthleteFromWorldAthletics(
	id: string,
): Promise<AthleteData | null> {
	const query = `
		query GetSingleCompetitor($id: Int!) {
			getSingleCompetitor(id: $id) {
				_id
				basicData {
					birthDate
					countryCode
					countryFullName
					familyName
					givenName
				}
				personalBests {
					results {
						date
						discipline
						eventName
						mark
					}
				}
				honours {
					categoryName
					results {
						competition
						mark
						place
						discipline
					}
				}
			}
		}
	`;

	try {
		const response = await gqlClient<CompetitorResponse>(query, {
			id: parseInt(id, 10),
		});
		const competitor = response.getSingleCompetitor;
		if (!competitor) return null;

		return {
			id: competitor._id,
			name: `${competitor.basicData.givenName} ${competitor.basicData.familyName}`,
			countryCode: competitor.basicData.countryCode,
			countryName: competitor.basicData.countryFullName,
			dateOfBirth: competitor.basicData.birthDate,
			personalBests: competitor.personalBests?.results || [],
			honours: competitor.honours || [],
		};
	} catch (error) {
		console.error(`Error fetching athlete ${id}:`, error);
		return null;
	}
}

// Get athlete from database by ID
export async function getAthleteById(athleteId: string) {
	return await db.query.athletes.findFirst({
		where: eq(athletes.worldAthleticsId, athleteId),
	});
}

// Helper functions from import-athletes.ts
async function getAthleteIds(): Promise<string[]> {
	const query = `
		query GetAthleteRepresentativeAthleteSearch {
			getAthleteRepresentativeAthleteSearch {
				athletes {
					children {
						athleteId
					}
				}
			}
		}
	`;

	try {
		const response = await gqlClient<AthleteSearchResponse>(query);
		return response.getAthleteRepresentativeAthleteSearch.athletes
			.flatMap((athlete: AthleteSearchAthlete) => athlete.children)
			.map((child: AthleteSearchChild) => child.athleteId.toString());
	} catch (error) {
		console.error("Error fetching athlete IDs:", error);
		return [];
	}
}

async function getAthleteIdsByCountry(countryCode: string): Promise<string[]> {
	const query = `
		query GetLeadingAthletes($all: Boolean, $preferredCountry: String) {
			getLeadingAthletes(all: $all, preferredCountry: $preferredCountry) {
				eventResults {
					results {
						competitor {
							id
						}
					}
				}
			}
		}
	`;

	try {
		const response = await gqlClient<LeadingAthletesResponse>(query, {
			all: true,
			preferredCountry: countryCode,
		});

		return response.getLeadingAthletes.eventResults
			.flatMap((event: LeadingAthletesEvent) => event.results)
			.map((result: { competitor: { id: number } }) =>
				result.competitor.id.toString(),
			);
	} catch (error) {
		console.error(`Error fetching athletes for country ${countryCode}:`, error);
		return [];
	}
}

// Types from import-athletes.ts
interface AthleteSearchResponse {
	getAthleteRepresentativeAthleteSearch: {
		athletes: Array<{
			children: Array<{
				athleteId: number;
			}>;
		}>;
	};
}

interface LeadingAthletesResponse {
	getLeadingAthletes: {
		eventResults: Array<{
			results: Array<{
				competitor: {
					id: number;
				};
			}>;
		}>;
	};
}

interface AthleteSearchChild {
	athleteId: number;
}

interface AthleteSearchAthlete {
	children: AthleteSearchChild[];
}

interface LeadingAthletesEvent {
	results: Array<{
		competitor: {
			id: number;
		};
	}>;
}

function parseBirthDate(dateStr: string | undefined | null): string | null {
	if (!dateStr) return null;

	// If it's just a year (4 digits)
	if (/^\d{4}$/.test(dateStr)) {
		return `${dateStr}-01-01`;
	}

	// Try parsing the full date
	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	return date.toISOString().split("T")[0];
}

// Define the exact type structure we're returning from the query
export type AthleteMention = {
	id: string;
	athleteId: string;
	contentId: string;
	contentType: "podcast" | "video";
	source: "title" | "description";
	confidence: string;
	context: string;
	createdAt: Date;
	episode?: {
		id: string;
		title: string;
		episodeSlug: string;
		content: string | null;
		pubDate: Date | null;
		episodeImage: string | null;
		duration: string | null;
		podcastSlug: string | null;
		podcastTitle: string | null;
		podcastImage: string | null;
		podcastId: string;
		podcastAuthor: string | null;
		enclosureUrl: string;
		explicit: string | null;
		link: string | null;
	};
	podcast?: {
		id: string;
		title: string;
		image: string | null;
		podcastSlug: string | null;
	};
	video?: {
		id: string;
		title: string;
		thumbnailUrl: string | null;
		channelTitle: string | null;
		publishedAt: Date | null;
		description: string | null;
		youtubeVideoId: string;
		duration: string | null;
		viewCount: string | null;
		likeCount: string | null;
	};
	publishedDate?: Date | null;
};

export async function getAthleteRecentMentions(athleteId: string, limit = 15) {
	// Get the highest confidence mention IDs for each content (episode or video)
	const mentionIds = await db.execute<{ id: string }>(sql`
		SELECT DISTINCT ON (content_id) id
		FROM athlete_mentions
		WHERE athlete_id = ${athleteId}
		ORDER BY content_id, confidence DESC
		LIMIT ${limit}
	`);

	// First fetch podcast mentions
	const podcastMentions = await db
		.select({
			// Top-level mention fields
			id: athleteMentions.id,
			athleteId: athleteMentions.athleteId,
			contentId: athleteMentions.contentId,
			contentType: athleteMentions.contentType,
			source: athleteMentions.source,
			confidence: athleteMentions.confidence,
			context: athleteMentions.context,
			createdAt: athleteMentions.createdAt,

			// Episode and Podcast fields
			episode: {
				id: episodes.id,
				title: episodes.title,
				episodeSlug: episodes.episodeSlug,
				content: episodes.content,
				pubDate: episodes.pubDate,
				episodeImage: episodes.episodeImage,
				duration: episodes.duration,
				podcastSlug: podcasts.podcastSlug,
				podcastTitle: podcasts.title,
				podcastImage: podcasts.podcastImage,
				podcastId: episodes.podcastId,
				podcastAuthor: podcasts.author,
				enclosureUrl: episodes.enclosureUrl,
				explicit: episodes.explicit,
				link: episodes.link,
			},
			podcast: {
				id: podcasts.id,
				title: podcasts.title,
				image: podcasts.image,
				podcastSlug: podcasts.podcastSlug,
			},
		})
		.from(athleteMentions)
		.innerJoin(episodes, eq(athleteMentions.contentId, episodes.id))
		.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
		.where(
			and(
				inArray(
					athleteMentions.id,
					mentionIds.map((m) => m.id),
				),
				eq(athleteMentions.contentType, "podcast"),
				like(podcasts.language, "en%"),
			),
		)
		.orderBy(desc(episodes.pubDate));

	// Then fetch video mentions
	const videoMentions = await db
		.select({
			// Top-level mention fields
			id: athleteMentions.id,
			athleteId: athleteMentions.athleteId,
			contentId: athleteMentions.contentId,
			contentType: athleteMentions.contentType,
			source: athleteMentions.source,
			confidence: athleteMentions.confidence,
			context: athleteMentions.context,
			createdAt: athleteMentions.createdAt,

			// Video fields
			video: {
				id: videos.id,
				title: videos.title,
				thumbnailUrl: videos.thumbnailUrl,
				channelTitle: videos.channelTitle,
				publishedAt: videos.publishedAt,
				description: videos.description,
				youtubeVideoId: videos.youtubeVideoId,
				duration: videos.duration,
				viewCount: videos.viewCount,
				likeCount: videos.likeCount,
			},
		})
		.from(athleteMentions)
		.innerJoin(videos, eq(athleteMentions.contentId, videos.id))
		.where(
			and(
				inArray(
					athleteMentions.id,
					mentionIds.map((m) => m.id),
				),
				eq(athleteMentions.contentType, "video"),
			),
		)
		.orderBy(desc(videos.publishedAt));

	// Combine the results and sort by date, with most recent first
	const combinedMentions = [
		...podcastMentions.map((mention) => ({
			...mention,
			video: undefined,
			publishedDate: mention.episode.pubDate,
			// Ensure createdAt is always a valid Date
			createdAt: mention.createdAt || new Date(),
		})),
		...videoMentions.map((mention) => ({
			...mention,
			episode: undefined,
			podcast: undefined,
			publishedDate: mention.video.publishedAt,
			// Ensure createdAt is always a valid Date
			createdAt: mention.createdAt || new Date(),
		})),
	].sort((a, b) => {
		if (!a.publishedDate) return 1;
		if (!b.publishedDate) return -1;
		return b.publishedDate.getTime() - a.publishedDate.getTime();
	});

	return combinedMentions.slice(0, limit);
}

export async function getEpisodeAthleteReferences(
	episodeId: string,
	limit = 5,
) {
	// Get the highest confidence mention IDs for each athlete
	const mentionIds = await db.execute<{ id: string }>(sql`
		SELECT DISTINCT ON (athlete_id) id
		FROM athlete_mentions
		WHERE episode_id = ${episodeId}
		ORDER BY athlete_id, confidence DESC
		LIMIT ${limit}
	`);

	// Fetch the full details for these mentions
	return await db.query.athleteMentions.findMany({
		where: inArray(
			athleteMentions.id,
			mentionIds.map((m) => m.id),
		),
		with: {
			athlete: {
				columns: {
					id: true,
					worldAthleticsId: true,
					name: true,
					imageUrl: true,
					slug: true,
					bio: true,
				},
			},
		},
		orderBy: [desc(athleteMentions.confidence)],
	});
}

export async function getAthleteBySlug(slug: string) {
	return await db.query.athletes.findFirst({
		where: eq(athletes.slug, slug),
		columns: {
			id: true,
			worldAthleticsId: true,
			name: true,
			slug: true,
			imageUrl: true,
			bio: true,
			countryName: true,
			countryCode: true,
		},
	});
}

export async function getAthleteData(slug: string) {
	const athlete = await db.query.athletes.findFirst({
		where: eq(athletes.slug, slug),
		with: {
			honors: true,
			results: true,
			sponsors: true,
			gear: true,
			events: true,
		},
	});

	if (!athlete) return null;
	return athlete;
}

export async function getAllAthletes() {
	return await db
		.select({ slug: athletes.slug })
		.from(athletes)
		.where(isNotNull(athletes.slug));
}

export async function getOlympicGoldMedalists() {
	return await db
		.select({
			id: athletes.worldAthleticsId,
		})
		.from(athletes)
		.innerJoin(
			athleteHonors,
			and(
				eq(athletes.worldAthleticsId, athleteHonors.athleteId),
				ilike(athleteHonors.categoryName, "%olympic%"),
				sql`${athleteHonors.categoryName} NOT ILIKE '%youth%'`,
				eq(athleteHonors.place, "1."),
			),
		)
		.orderBy(desc(athletes.name));
}

interface GetAthletesQueryParams {
	fromDate: string;
	limit: number;
	offset: number;
	goldMedalistIds: string[];
}

export async function getAllAthletesWithDisciplines({
	fromDate,
	limit,
	offset,
	goldMedalistIds,
}: GetAthletesQueryParams) {
	const query = db
		.select({
			athlete: athletes,
			disciplines: sql<
				string[]
			>`array_agg(DISTINCT ${athleteResults.discipline})`,
		})
		.from(athletes)
		.leftJoin(
			athleteResults,
			and(
				eq(athletes.worldAthleticsId, athleteResults.athleteId),
				gte(athleteResults.date, fromDate),
			),
		)
		.where(
			or(
				and(
					isNotNull(athletes.worldAthleticsId),
					inArray(athletes.worldAthleticsId, goldMedalistIds),
				),
				and(
					isNotNull(athletes.worldAthleticsId),
					notInArray(athletes.worldAthleticsId, goldMedalistIds),
				),
			),
		)
		.groupBy(athletes.id)
		.orderBy(desc(athletes.name))
		.limit(limit)
		.offset(offset);

	return await query;
}

export async function getAthleteCount() {
	const result = await db
		.select({ count: sql<number>`count(*)` })
		.from(athletes)
		.where(isNotNull(athletes.worldAthleticsId));
	return result[0].count;
}

// Search athletes with improved scoring
export async function searchAthletes(query: string, limit = 10) {
	const formattedQuery = query
		.trim()
		.split(/\s+/)
		.map((term) => `${term}:*`)
		.join(" & ");

	return db
		.select({
			athlete: {
				id: athletes.worldAthleticsId,
				name: athletes.name,
				imageUrl: athletes.imageUrl,
				slug: athletes.slug,
				bio: athletes.bio,
			},
			mentionCount: sql<number>`COUNT(DISTINCT ${athleteMentions.id})`,
			resultCount: sql<number>`COUNT(DISTINCT ${athleteResults.id})`,
			honorCount: sql<number>`COUNT(DISTINCT ${athleteHonors.id})`,
			searchRank: sql<number>`ts_rank(
				to_tsvector('english', 
					${athletes.name} || ' ' || 
					coalesce(${athletes.bio}, '')
				),
				to_tsquery('english', ${formattedQuery})
			)`,
		})
		.from(athletes)
		.leftJoin(
			athleteMentions,
			eq(athletes.worldAthleticsId, athleteMentions.athleteId),
		)
		.leftJoin(
			athleteResults,
			eq(athletes.worldAthleticsId, athleteResults.athleteId),
		)
		.leftJoin(
			athleteHonors,
			eq(athletes.worldAthleticsId, athleteHonors.athleteId),
		)
		.where(
			sql`to_tsvector('english', 
				${athletes.name} || ' ' || 
				coalesce(${athletes.bio}, '')
			) @@ to_tsquery('english', ${formattedQuery})`,
		)
		.groupBy(athletes.id)
		.orderBy(
			desc(
				sql`
					(${sql.raw("searchRank")} * 0.4) + 
					(log(COUNT(DISTINCT ${athleteMentions.id}) + 1) * 0.3) +
					(log(COUNT(DISTINCT ${athleteResults.id}) + COUNT(DISTINCT ${
						athleteHonors.id
					}) + 1) * 0.3)
				`,
			),
		)
		.limit(limit);
}

// Import the athlete data from World Athletics API
export async function importAthleteData(limit?: number) {
	const results = {
		processed: 0,
		errors: 0,
		updated: 0,
		skipped: 0,
		countryErrors: 0,
	};

	try {
		// Get athletes from representative search first
		console.log("[Athlete Import] Starting athlete representative search...");
		const athleteIds = await getAthleteIds();
		console.log(
			`[Athlete Import] Found ${athleteIds.length} athletes from representative search`,
		);

		// Process countries in batches
		const COUNTRY_BATCH_SIZE = 5;
		const countries = Object.entries(countryCodeMap);
		const countryAthleteIds = new Set<string>();
		const countryErrors = new Set<string>();

		console.log("[Athlete Import] Starting country-based athlete search...");
		for (let i = 0; i < countries.length; i += COUNTRY_BATCH_SIZE) {
			const countryBatch = countries.slice(i, i + COUNTRY_BATCH_SIZE);
			console.log(
				`[Athlete Import] Processing country batch ${
					Math.floor(i / COUNTRY_BATCH_SIZE) + 1
				}/${Math.ceil(countries.length / COUNTRY_BATCH_SIZE)}`,
			);

			// Process countries in parallel within the batch
			const batchResults = await Promise.allSettled(
				countryBatch.map(async ([code3]) => {
					try {
						console.log(`[Athlete Import] Processing country: ${code3}`);
						const ids = await getAthleteIdsByCountry(code3);
						return { code3, ids, success: true };
					} catch (error) {
						console.error(
							`[Athlete Import] Error processing country ${code3}:`,
							error,
						);
						return { code3, ids: [], success: false };
					}
				}),
			);

			// Process batch results
			// biome-ignore lint/complexity/noForEach: forEach is fine
			batchResults.forEach((result) => {
				if (result.status === "fulfilled") {
					const { code3, ids, success } = result.value;
					if (success) {
						if (ids.length > 0) {
							console.log(
								`[Athlete Import] Found ${ids.length} athletes from ${code3}`,
							);
							// biome-ignore lint/complexity/noForEach: forEach is fine
							ids.forEach((id) => countryAthleteIds.add(id));
						} else {
							console.log(`[Athlete Import] No athletes found for ${code3}`);
						}
					} else {
						countryErrors.add(code3);
						results.countryErrors++;
					}
				}
			});

			// Add delay between country batches
			if (i + COUNTRY_BATCH_SIZE < countries.length) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}

		console.log(
			"[Athlete Import] Country processing complete:",
			`\n- Successful: ${
				Object.keys(countryCodeMap).length - countryErrors.size
			}`,
			`\n- Failed: ${countryErrors.size}`,
			`\n- Failed Countries: ${Array.from(countryErrors).join(", ")}`,
			`\n- Total Athletes Found: ${countryAthleteIds.size}`,
		);

		// Combine and deduplicate athlete IDs
		const allAthleteIds = [...new Set([...athleteIds, ...countryAthleteIds])];
		console.log(
			`[Athlete Import] Total unique athletes to process: ${allAthleteIds.length}`,
		);

		// Apply limit if specified
		const athletesToProcess = limit
			? allAthleteIds.slice(0, limit)
			: allAthleteIds;
		console.log(
			`[Athlete Import] Processing ${athletesToProcess.length} athletes${
				limit ? ` (limited to ${limit})` : ""
			}`,
		);

		// Process athletes in parallel batches
		const ATHLETE_BATCH_SIZE = 10;
		for (let i = 0; i < athletesToProcess.length; i += ATHLETE_BATCH_SIZE) {
			const batch = athletesToProcess.slice(i, i + ATHLETE_BATCH_SIZE);
			console.log(
				`[Athlete Import] Processing athlete batch ${
					Math.floor(i / ATHLETE_BATCH_SIZE) + 1
				}/${Math.ceil(athletesToProcess.length / ATHLETE_BATCH_SIZE)}`,
			);

			const batchResults = await Promise.allSettled(
				batch.map(async (id) => {
					try {
						console.log(`[Athlete Import] Processing athlete ${id}...`);
						const athleteData = await getAthleteFromWorldAthletics(id);
						return { id, athleteData, success: true };
					} catch (error) {
						console.error(
							`[Athlete Import] Error processing athlete ${id}:`,
							error,
						);
						return { id, athleteData: null, success: false };
					}
				}),
			);

			// Process athlete batch results
			for (const result of batchResults) {
				if (result.status === "fulfilled") {
					const { id, athleteData, success } = result.value;

					if (!success || !athleteData) {
						console.error(`[Athlete Import] Failed to fetch athlete ${id}`);
						results.errors++;
						continue;
					}

					try {
						// Create unique slug
						const nameSlug = slugify(athleteData.name);
						const uniqueSlug = `${nameSlug}-${athleteData.id}`;

						// Insert or update athlete
						await db
							.insert(athletes)
							.values({
								id: athleteData.id,
								name: athleteData.name,
								slug: uniqueSlug,
								countryCode: athleteData.countryCode ?? null,
								countryName: athleteData.countryName ?? null,
								dateOfBirth: parseBirthDate(athleteData.dateOfBirth),
								verified: false,
							})
							.onConflictDoUpdate({
								target: athletes.id,
								set: {
									name: athleteData.name,
									slug: uniqueSlug,
									countryCode: athleteData.countryCode ?? null,
									countryName: athleteData.countryName ?? null,
									dateOfBirth: parseBirthDate(athleteData.dateOfBirth),
									updatedAt: sql`CURRENT_TIMESTAMP`,
								},
							});

						// Insert personal bests
						if (athleteData.personalBests && athleteData.id) {
							const worldAthleticsId = athleteData.id;
							await Promise.all(
								athleteData.personalBests.map(async (result) => {
									const resultId = `${worldAthleticsId}-${result.discipline}-${result.date}`;
									return db
										.insert(athleteResults)
										.values({
											id: resultId,
											athleteId: worldAthleticsId,
											competitionName: result.eventName,
											date: result.date,
											discipline: result.discipline,
											performance: result.mark,
											place: null,
											wind: null,
										})
										.onConflictDoNothing();
								}),
							);
						}

						// Insert honors
						if (athleteData.honours) {
							await Promise.all(
								athleteData.honours.flatMap((honor) =>
									honor.results.map(async (result) => {
										const honorId = `${athleteData.id}-${honor.categoryName}-${result.competition}-${result.discipline}`;
										return db
											.insert(athleteHonors)
											.values({
												id: honorId,
												athleteId: athleteData.id,
												categoryName: honor.categoryName,
												competition: result.competition,
												discipline: result.discipline,
												mark: result.mark,
												place: result.place,
											})
											.onConflictDoNothing();
									}),
								),
							);
						}

						results.processed++;
						results.updated++;
						console.log(
							`[Athlete Import] Successfully imported athlete ${athleteData.name}`,
						);
					} catch (error) {
						console.error(
							`[Athlete Import] Error saving athlete ${id}:`,
							error,
						);
						results.errors++;
					}
				}
			}

			// Add delay between athlete batches
			if (i + ATHLETE_BATCH_SIZE < athletesToProcess.length) {
				console.log("[Athlete Import] Waiting between batches...");
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}
	} catch (error) {
		console.error("[Athlete Import] Fatal error during import:", error);
		throw error;
	}

	console.log("[Athlete Import] Import complete:", results);
	return results;
}

// Make sure we're using the DetectedAthlete interface before processContentAthletes
interface DetectedAthlete {
	athleteId: string;
	confidence: number;
	context: string;
}

/**
 * Detects athlete mentions in text
 */
async function detectAthletes(text: string): Promise<DetectedAthlete[]> {
	console.time("detectAthletes");

	// Get all athletes
	const allAthletes = await db.query.athletes.findMany({
		columns: {
			worldAthleticsId: true,
			name: true,
		},
	});

	const detectedAthletes: DetectedAthlete[] = [];
	const athleteMap = new Map(
		allAthletes
			.filter((athlete) => athlete.worldAthleticsId !== null)
			.map((athlete) => [
				athlete.name.toLowerCase(),
				athlete.worldAthleticsId as string,
			]),
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

/**
 * Process content (podcast or video) to detect and store athlete mentions
 */
export async function processContentAthletes(
	contentId: string,
	contentType: "podcast" | "video",
) {
	console.time(`processContent:${contentId}`);

	// Get content data based on type
	let content: {
		id: string;
		title: string;
		content?: string;
		description?: string;
	} | null = null;

	if (contentType === "podcast") {
		const episode = await db.query.episodes.findFirst({
			where: eq(episodes.id, contentId),
			columns: {
				id: true,
				title: true,
				content: true,
			},
		});

		if (episode) {
			content = {
				id: episode.id,
				title: episode.title,
				content: episode.content || undefined,
			};
		}
	} else if (contentType === "video") {
		const video = await db.query.videos.findFirst({
			where: eq(videos.id, contentId),
			columns: {
				id: true,
				title: true,
				description: true,
			},
		});

		if (video) {
			content = {
				id: video.id,
				title: video.title,
				description: video.description || undefined,
			};

			// Map description to content for consistent processing
			if (content.description) {
				// Only use first 500 chars of video description
				content.content = content.description.slice(0, 500);
			}
		}
	}

	if (!content) {
		throw new Error(`Content not found: ${contentId} (type: ${contentType})`);
	}

	console.log(
		`[Athlete Detection] Processing ${contentType}: ${content.title}`,
	);

	// Process title
	console.log("[Athlete Detection] Processing title...");
	const titleAthletes = await detectAthletes(content.title);
	console.log(
		`[Athlete Detection] Found ${titleAthletes.length} athletes in title`,
	);

	for (const athlete of titleAthletes) {
		try {
			console.log(
				`[Athlete Detection] Inserting title mention for athlete ${athlete.athleteId}`,
			);
			await db
				.insert(athleteMentions)
				.values({
					athleteId: athlete.athleteId,
					contentId: content.id,
					contentType,
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
			console.error(
				"[Athlete Detection] Error upserting title mention:",
				error,
			);
		}
	}

	// Process description/content if available
	let contentAthletes: DetectedAthlete[] = [];
	if (content.content) {
		contentAthletes = await detectAthletes(content.content);
		console.log(
			`[Athlete Detection] Found ${contentAthletes.length} athletes in content`,
		);

		for (const athlete of contentAthletes) {
			try {
				console.log(
					`[Athlete Detection] Inserting content mention for athlete ${athlete.athleteId}`,
				);
				await db
					.insert(athleteMentions)
					.values({
						athleteId: athlete.athleteId,
						contentId: content.id,
						contentType,
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
				console.error(
					"[Athlete Detection] Error upserting content mention:",
					error,
				);
			}
		}
	}

	// Mark content as processed based on type
	if (contentType === "podcast") {
		await db
			.update(episodes)
			.set({
				athleteMentionsProcessed: true,
				updatedAt: sql`CURRENT_TIMESTAMP`, // Also update timestamp for processed episode
			})
			.where(eq(episodes.id, contentId));
	} else {
		// Update the athleteMentionsProcessed field and updatedAt for videos
		await db
			.update(videos)
			.set({
				athleteMentionsProcessed: true,
				updatedAt: sql`CURRENT_TIMESTAMP`, // Also update timestamp for processed video
			})
			.where(eq(videos.id, contentId));
	}

	console.timeEnd(`processContent:${contentId}`);
	return {
		titleMatches: titleAthletes.length,
		contentMatches: contentAthletes.length,
	};
}

/**
 * Process a batch of content (podcasts or videos) for athlete mentions
 */
export async function processContentBatch({
	contentType,
	limit = 100,
	maxAgeHours = 24, // Default to 24 hours
	debug = false,
}: {
	contentType: "podcast" | "video";
	limit?: number;
	minHoursSinceUpdate?: number; // Legacy parameter
	maxAgeHours?: number;
	debug?: boolean;
}) {
	// Use maxAgeHours as the primary time constraint
	const timeConstraint = maxAgeHours;

	console.log(
		`[Athlete Detection] Starting batch processing for ${contentType}s...`,
	);
	console.log(
		`[Athlete Detection] Using time constraint: ${timeConstraint} hours`,
	);

	// Get content items that need processing
	let contentItems: { id: string; title: string }[] = [];

	if (contentType === "podcast") {
		// For podcasts (episodes), filter by pubDate and check athleteMentionsProcessed
		contentItems = await db
			.select({
				id: episodes.id,
				title: episodes.title,
			})
			.from(episodes)
			.where(
				and(
					// Filter by pubDate using timeConstraint
					sql`${episodes.pubDate} >= NOW() - (${timeConstraint} * INTERVAL '1 hour')`,
					// Ensure not already processed
					or(
						isNull(episodes.athleteMentionsProcessed),
						eq(episodes.athleteMentionsProcessed, false),
					),
				),
			)
			// Order by publication date (most recent first)
			.orderBy(desc(episodes.pubDate))
			.limit(limit);
	} else if (contentType === "video") {
		// For videos, filter by createdAt and check athleteMentionsProcessed
		contentItems = await db
			.select({
				id: videos.id,
				title: videos.title,
			})
			.from(videos)
			.where(
				and(
					// Filter by createdAt using timeConstraint
					sql`${videos.createdAt} >= NOW() - (${timeConstraint} * INTERVAL '1 hour')`,
					// Ensure not already processed
					or(
						isNull(videos.athleteMentionsProcessed),
						eq(videos.athleteMentionsProcessed, false),
					),
				),
			)
			// Order by creation date (most recent first)
			.orderBy(desc(videos.createdAt))
			.limit(limit);

		if (debug) {
			console.log(
				`[Athlete Detection] Found ${contentItems.length} videos to process`,
			);

			// Get some sample video details for debugging
			if (contentItems.length > 0) {
				const sampleIds = contentItems
					.slice(0, Math.min(3, contentItems.length))
					.map((item) => item.id);
				const samples = await db
					.select({
						id: videos.id,
						title: videos.title,
						athleteMentionsProcessed: videos.athleteMentionsProcessed,
					})
					.from(videos)
					.where(inArray(videos.id, sampleIds));

				console.log("[Athlete Detection] Sample videos:", samples);
			}
		}
	}

	console.log(
		`[Athlete Detection] Found ${contentItems.length} ${contentType}s to process`,
	);

	const results = {
		processed: 0,
		errors: 0,
		total: contentItems.length,
		errorDetails: [] as { id: string; error: string }[],
		athleteMatches: {
			total: 0,
			title: 0,
			content: 0,
		},
	};

	// Process each content item
	for (const item of contentItems) {
		try {
			console.log(
				`[Athlete Detection] Processing ${contentType}: ${item.title} (${item.id})`,
			);
			const matches = await processContentAthletes(item.id, contentType);

			results.processed++;
			results.athleteMatches.title += matches.titleMatches;
			results.athleteMatches.content += matches.contentMatches;
			results.athleteMatches.total +=
				matches.titleMatches + matches.contentMatches;

			console.log(`[Athlete Detection] ${contentType} processed:`, {
				id: item.id,
				titleMatches: matches.titleMatches,
				contentMatches: matches.contentMatches,
			});
		} catch (error) {
			console.error(
				`[Athlete Detection] Error processing ${contentType} ${item.id}:`,
				error,
			);
			results.errors++;
			results.errorDetails.push({
				id: item.id,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	// Calculate success rate
	const successRate = results.processed
		? ((results.processed - results.errors) / results.processed) * 100
		: 0;

	console.log(`[Athlete Detection] ${contentType} batch processing complete:`, {
		processed: results.processed,
		errors: results.errors,
		successRate: `${successRate.toFixed(1)}%`,
		athleteMatches: results.athleteMatches,
	});

	return {
		...results,
		successRate: `${successRate.toFixed(1)}%`,
	};
}

// Helper function aliases for backward compatibility
export async function processEpisodeAthletes(episodeId: string) {
	return processContentAthletes(episodeId, "podcast");
}

export async function processVideoAthletes(videoId: string) {
	return processContentAthletes(videoId, "video");
}

export async function getAllCategories() {
	try {
		const result = await db
			.select({
				id: athleteCategories.id,
				name: athleteCategories.name,
				description: athleteCategories.description,
			})
			.from(athleteCategories)
			.orderBy(athleteCategories.name);
		return result;
	} catch (error) {
		console.error("Error fetching categories:", error);
		throw new Error("Failed to fetch categories");
	}
}

/**
 * Update existing athletes in the database
 */
export async function updateExistingAthletes(limit?: number) {
	const results = {
		processed: 0,
		errors: 0,
		updated: 0,
		skipped: 0,
	};

	try {
		// Get existing athletes ordered by last update
		const athletesToUpdate = await db
			.select({
				worldAthleticsId: athletes.worldAthleticsId,
				name: athletes.name,
				updatedAt: athletes.updatedAt,
			})
			.from(athletes)
			.where(isNotNull(athletes.worldAthleticsId))
			.orderBy(athletes.updatedAt)
			.limit(limit || 50);

		console.log(
			`[Athlete Update] Found ${athletesToUpdate.length} athletes to update`,
		);
		// Process athletes in batches of 10
		const BATCH_SIZE = 10;
		for (let i = 0; i < athletesToUpdate.length; i += BATCH_SIZE) {
			const batch = athletesToUpdate.slice(i, i + BATCH_SIZE);
			console.log(
				`[Athlete Update] Processing batch ${
					Math.floor(i / BATCH_SIZE) + 1
				}/${Math.ceil(athletesToUpdate.length / BATCH_SIZE)}`,
			);

			// Process batch concurrently
			const batchResults = await Promise.allSettled(
				batch.map(async (athlete) => {
					if (!athlete.worldAthleticsId) {
						console.log(
							`[Athlete Update] Skipping athlete ${athlete.name} - no World Athletics ID`,
						);
						results.skipped++;
						return;
					}

					try {
						console.log(
							`[Athlete Update] Processing ${athlete.name} (${athlete.worldAthleticsId})`,
						);
						const athleteData = await getAthleteFromWorldAthletics(
							athlete.worldAthleticsId,
						);

						if (!athleteData) {
							console.log(`[Athlete Update] No data found for ${athlete.name}`);
							results.skipped++;
							return;
						}

						// Update athlete basic info
						await db
							.update(athletes)
							.set({
								name: athleteData.name,
								countryCode: athleteData.countryCode ?? null,
								countryName: athleteData.countryName ?? null,
								dateOfBirth: parseBirthDate(athleteData.dateOfBirth),
								updatedAt: sql`CURRENT_TIMESTAMP`,
							})
							.where(eq(athletes.worldAthleticsId, athlete.worldAthleticsId));

						// Update personal bests
						if (athleteData.personalBests && athlete.worldAthleticsId) {
							await Promise.all(
								athleteData.personalBests.map(async (result) => {
									const resultId = `${athlete.worldAthleticsId}-${result.discipline}-${result.date}`;
									return db
										.insert(athleteResults)
										.values({
											id: resultId,
											athleteId: athlete.worldAthleticsId ?? "",
											competitionName: result.eventName,
											date: result.date,
											discipline: result.discipline,
											performance: result.mark,
											place: null,
											wind: null,
										})
										.onConflictDoNothing();
								}),
							);
						}

						// Update honors
						if (athleteData.honours) {
							await Promise.all(
								athleteData.honours.flatMap((honor) =>
									honor.results.map(async (result) => {
										const honorId = `${athlete.worldAthleticsId}-${honor.categoryName}-${result.competition}-${result.discipline}`;
										return db
											.insert(athleteHonors)
											.values({
												id: honorId,
												athleteId: athlete.worldAthleticsId ?? "",
												categoryName: honor.categoryName,
												competition: result.competition,
												discipline: result.discipline,
												mark: result.mark,
												place: result.place,
											})
											.onConflictDoNothing();
									}),
								),
							);
						}

						results.updated++;
						console.log(
							`[Athlete Update] Successfully updated ${athlete.name}`,
						);
					} catch (error) {
						console.error(
							`[Athlete Update] Error updating ${athlete.name}:`,
							error,
						);
						results.errors++;
					}
				}),
			);

			results.processed += batch.length;

			// Add delay between batches
			if (i + BATCH_SIZE < athletesToUpdate.length) {
				console.log("[Athlete Update] Waiting between batches...");
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}
	} catch (error) {
		console.error("[Athlete Update] Fatal error during update:", error);
		throw error;
	}

	console.log("[Athlete Update] Update complete:", results);
	return results;
}
