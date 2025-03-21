import { db } from "../src/db/client";
import { athletes, athleteResults, athleteHonors } from "@/db/schema";
import { getAthleteById, gqlClient } from "@/lib/world-athletics";
import { countryCodeMap } from "@/lib/utils/country-codes";
import { like, or, sql, and, eq, isNotNull } from "drizzle-orm";
import { openai } from "../src/lib/openai";
import fs from "fs";
import path from "path";
import { slugify } from "@/lib/utils";

interface AthleteInfo {
	bio: string;
	socialMedia: {
		twitter?: string;
		instagram?: string;
		facebook?: string;
		website?: string;
	};
}

interface CompetitorBasicData {
	birthDate: string;
	countryCode: string;
	countryFullName: string;
	familyName: string;
	givenName: string;
}

interface PersonalBest {
	date: string;
	discipline: string;
	eventName: string;
	records: string[];
	mark: string;
	venue: string;
}

interface Honor {
	categoryName: string;
	results: Array<{
		competition: string;
		mark: string;
		place: string;
		discipline: string;
	}>;
}

interface Athlete {
	id: string;
	name: string;
	countryCode?: string;
	countryName?: string;
	dateOfBirth?: string;
	personalBests?: PersonalBest[];
	honours?: Honor[];
}

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

interface AthleteData {
	athlete: {
		id: string;
		name: string;
		countryName: string | null;
		dateOfBirth: string | null;
	};
	personalBests: Array<{
		discipline: string;
		mark: string;
	}>;
}

interface CompetitorResponse {
	getSingleCompetitor: {
		_id: string;
		basicData: CompetitorBasicData;
		personalBests: {
			results: PersonalBest[];
			withRecords: boolean;
		};
		honours: Honor[];
	} | null;
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
		// Flatten the nested structure and convert numbers to strings
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

		// Flatten the nested structure and convert numbers to strings
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

async function importAthleteData(limit?: number) {
	// Get athletes from the first method
	const athleteIds = await getAthleteIds();
	console.log(`Found ${athleteIds.length} athletes from representative search`);

	// Get athletes from each country
	const countryAthleteIds = new Set<string>();
	for (const [code3] of Object.entries(countryCodeMap)) {
		console.log(`Fetching athletes from country: ${code3}`);
		const ids = await getAthleteIdsByCountry(code3);
		for (const id of ids) {
			countryAthleteIds.add(id);
		}

		// Add delay between country requests
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	console.log(
		`Found ${countryAthleteIds.size} additional athletes from countries`,
	);

	// Combine and deduplicate athlete IDs
	const allAthleteIds = [...new Set([...athleteIds, ...countryAthleteIds])];
	console.log(`Total unique athletes to process: ${allAthleteIds.length}`);

	// Apply limit if specified
	const athletesToProcess = limit
		? allAthleteIds.slice(0, limit)
		: allAthleteIds;
	console.log(
		`Processing ${athletesToProcess.length} athletes${
			limit ? ` (limited to ${limit})` : ""
		}`,
	);

	for (const id of athletesToProcess) {
		console.log(`Importing athlete ${id}...`);
		const athleteData = await getAthleteById(id);

		// Add delay to avoid rate limiting
		await new Promise((resolve) => setTimeout(resolve, 200));

		if (!athleteData) {
			console.error(`Failed to fetch athlete ${id}`);
			continue;
		}

		// Create unique slug by combining name and ID
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

		// Insert personal bests as results
		if (athleteData.personalBests) {
			for (const result of athleteData.personalBests) {
				const resultId = `${athleteData.id}-${result.discipline}-${result.date}`;

				await db
					.insert(athleteResults)
					.values({
						id: resultId,
						athleteId: athleteData.id,
						competitionName: result.eventName,
						date: result.date,
						discipline: result.discipline,
						performance: result.mark,
						place: null,
						wind: null,
					})
					.onConflictDoNothing();
			}
		}

		// Insert honors
		if (athleteData.honours) {
			for (const honor of athleteData.honours) {
				for (const result of honor.results) {
					const honorId = `${athleteData.id}-${honor.categoryName}-${result.competition}-${result.discipline}`;

					await db
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
				}
			}
		}

		console.log(`Successfully imported athlete ${athleteData.name}`);
	}
}

async function generateBatchFile(athletesData: AthleteData[]) {
	// Delete existing batch file if it exists
	const batchFilePath = path.join(process.cwd(), "scripts/athlete_bios.jsonl");
	if (fs.existsSync(batchFilePath)) {
		fs.unlinkSync(batchFilePath);
	}

	const system = `You are a sports journalist who specializes in track and field athletics. Your task is to generate accurate social media handles for athletes:

Only include social media links that would likely exist based on the athlete's profile and achievements.
For less prominent athletes, include fewer social media links.
For athletes from non-English speaking countries, they may not have social media handles and you should omit them.`;

	for (const { athlete } of athletesData) {
		// Generate a unique custom_id using athlete ID and timestamp
		const timestamp = Date.now();
		const custom_id = `${athlete.id}_${timestamp}`;
		const method = "POST";
		const url = "/v1/chat/completions";

		const prompt = `Generate a JSON response with a bio and known social media links for the track and field athlete ${
			athlete.name
		}
${athlete.countryName ? `from ${athlete.countryName}` : ""}

Important:
- Do not include the notation of "json" in the response
- Only include social media handles that would exist
- Omit any social media link if you're not confident it would exist
- If you're not sure about the social media link, omit it
The response should be in this format:
{
  "bio": "A short biography of ${athlete.name} that highlights their main events and achievements",
  "socialMedia": {
    "twitter": "handle for track and field athlete ${athlete.name} ${
			athlete.countryName ? `from ${athlete.countryName}` : ""
		}",
    "instagram": "handle for track and field athlete ${athlete.name} ${
			athlete.countryName ? `from ${athlete.countryName}` : ""
		}",
    "facebook": "URL for track and field athlete ${athlete.name} ${
			athlete.countryName ? `from ${athlete.countryName}` : ""
		}",
    "website": "URL for track and field athlete ${athlete.name} ${
			athlete.countryName ? `from ${athlete.countryName}` : ""
		}"
  }
}`;

		const body = {
			model: "gpt-4o",
			messages: [
				{ role: "system", content: system },
				{ role: "user", content: prompt },
			],
			temperature: 0.85,
		};

		const line = `{"custom_id": "${custom_id}", "method": "${method}", "url": "${url}", "body": ${JSON.stringify(
			body,
		)}}`;

		fs.appendFileSync(batchFilePath, `${line}\n`);
	}
}

interface BatchResponse {
	id: string;
	custom_id: string;
	response: {
		status_code: number;
		request_id: string;
		body: {
			choices: Array<{
				message: {
					content: string;
				};
			}>;
		};
	};
	error: string | null;
}

async function processBatchResults(filePath: string) {
	console.log("Reading results file...");
	if (!fs.existsSync(filePath)) {
		throw new Error(`Results file not found at path: ${filePath}`);
	}

	const fileContents = fs.readFileSync(filePath, "utf-8");
	const lines = fileContents.trim().split("\n");
	console.log("Found", lines.length, "results to process");

	let successCount = 0;
	let errorCount = 0;

	for (const [index, line] of lines.entries()) {
		console.log(`\nProcessing result ${index + 1}/${lines.length}`);

		try {
			let result: BatchResponse;
			try {
				result = JSON.parse(line);
				console.log("Result structure:", JSON.stringify(result, null, 2));
			} catch (parseError) {
				console.error("Failed to parse JSON for line:", line);
				console.error("Parse error:", parseError);
				errorCount++;
				continue;
			}

			// Extract the athlete ID from the custom_id by removing the timestamp
			const athleteId = result.custom_id.split("_")[0];
			if (!athleteId) {
				console.error("Invalid custom_id format:", result.custom_id);
				errorCount++;
				continue;
			}

			console.log("Processing athlete ID:", athleteId);

			// Check if there was an error in the response
			if (result.error) {
				console.error(
					`Error in response for athlete ${athleteId}:`,
					result.error,
				);
				errorCount++;
				continue;
			}

			// Check if we have a valid response structure
			if (!result.response?.body?.choices?.[0]?.message?.content) {
				console.error(`Invalid response structure for athlete ${athleteId}`);
				console.error("Response:", result.response);
				errorCount++;
				continue;
			}

			// Parse the content as AthleteInfo
			let content: AthleteInfo;
			try {
				content = JSON.parse(
					result.response.body.choices[0].message.content,
				) as AthleteInfo;
				console.log(`Parsed content for ${athleteId}:`, content);
			} catch (contentParseError) {
				console.error(
					`Failed to parse content as JSON for athlete ${athleteId}`,
				);
				console.error(
					"Content:",
					result.response.body.choices[0].message.content,
				);
				console.error("Parse error:", contentParseError);
				errorCount++;
				continue;
			}

			// Validate content structure
			if (!content.bio || typeof content.bio !== "string") {
				console.error(`Invalid bio format for athlete ${athleteId}`);
				errorCount++;
				continue;
			}

			if (!content.socialMedia || typeof content.socialMedia !== "object") {
				console.error(`Invalid socialMedia format for athlete ${athleteId}`);
				errorCount++;
				continue;
			}

			// Update the database
			try {
				await db
					.update(athletes)
					.set({
						bio: content.bio,
						socialMedia: content.socialMedia,
						updatedAt: sql`CURRENT_TIMESTAMP`,
					})
					.where(eq(athletes.id, athleteId));

				console.log(`Successfully updated bio for athlete ${athleteId}`);
				successCount++;
			} catch (dbError) {
				console.error(`Database error for athlete ${athleteId}:`, dbError);
				errorCount++;
			}
		} catch (error) {
			console.error("Unexpected error processing line:", line);
			console.error("Error:", error);
			errorCount++;
		}
	}

	console.log("\nProcessing complete:");
	console.log("- Total results:", lines.length);
	console.log("- Successful updates:", successCount);
	console.log("- Failed updates:", errorCount);

	if (errorCount > 0) {
		console.warn("\nWarning:", errorCount, "results failed to process");
	}
}

async function generateAthleteBios(limit?: number) {
	const athletesWithoutBios = await db
		.select({
			id: athletes.id,
			worldAthleticsId: athletes.worldAthleticsId,
			name: athletes.name,
			countryName: athletes.countryName,
			dateOfBirth: athletes.dateOfBirth,
		})
		.from(athletes)
		.innerJoin(
			athleteHonors,
			eq(athletes.worldAthleticsId, athleteHonors.athleteId),
		)
		.where(
			and(
				sql`bio IS NULL`,
				isNotNull(athletes.worldAthleticsId),
				or(
					like(athleteHonors.competition, "%World Championships%"),
					like(athleteHonors.competition, "%Olympic%"),
				),
			),
		)
		.groupBy(athletes.id, athletes.worldAthleticsId)
		.orderBy(athletes.name)
		.limit(limit || 100);

	console.log(
		`Found ${athletesWithoutBios.length} athletes${
			limit ? ` (limited to ${limit})` : ""
		}`,
	);

	// Prepare athlete data
	const athleteDataPromises = athletesWithoutBios.map(async (athlete) => {
		if (!athlete.worldAthleticsId) {
			console.log(`Skipping athlete ${athlete.name} - no World Athletics ID`);
			return null;
		}

		const results = await db
			.select()
			.from(athleteResults)
			.where(eq(athleteResults.athleteId, athlete.worldAthleticsId));

		const personalBests = results.map((r) => ({
			discipline: r.discipline,
			mark: r.performance,
		}));

		return {
			athlete,
			personalBests,
		};
	});

	const athleteData = (await Promise.all(athleteDataPromises)).filter(
		(data): data is NonNullable<typeof data> => data !== null,
	);

	// Generate batch file
	console.log("Generating batch file...");
	await generateBatchFile(athleteData);

	// Upload batch file
	console.log("Uploading batch file...");
	const file = await openai.files.create({
		file: fs.createReadStream(
			path.join(process.cwd(), "scripts/athlete_bios.jsonl"),
		),
		purpose: "batch",
	});

	// Create batch job
	console.log("Creating batch job...");
	const batch = await openai.batches.create({
		input_file_id: file.id,
		endpoint: "/v1/chat/completions",
		completion_window: "24h",
	});

	console.log(`Batch job created with ID: ${batch.id}`);
	console.log("Waiting for batch completion...");

	// Poll for completion
	let status = await openai.batches.retrieve(batch.id);
	while (status.status !== "completed") {
		await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds
		status = await openai.batches.retrieve(batch.id);
		console.log(`Current status: ${status.status}`);
	}

	// Download results
	console.log("Downloading results...");
	const outputFile = status.output_file_id;
	if (!outputFile) {
		throw new Error("No output file ID provided in batch status");
	}
	const fileResponse = await openai.files.content(outputFile);
	const outputPath = path.join(
		process.cwd(),
		"scripts/athlete_bios_results.jsonl",
	);
	fs.writeFileSync(outputPath, await fileResponse.text());

	// Process results
	console.log("Processing results...");
	await processBatchResults(outputPath);

	// Cleanup
	try {
		fs.unlinkSync(path.join(process.cwd(), "scripts/athlete_bios.jsonl"));
		fs.unlinkSync(outputPath);
	} catch (error) {
		console.error("Error cleaning up files:", error);
	}
}

// Choose which operation to run based on command line argument
const operation = process.argv[2];
const resultsFile = process.argv[3]; // Optional file path argument
const limit = process.argv[4] ? parseInt(process.argv[4]) : undefined; // Optional limit argument

if (operation === "import") {
	importAthleteData(limit)
		.then(() => {
			console.log("✅ Import completed successfully");
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Import failed:", error);
			process.exit(1);
		});
} else if (operation === "generate-bios") {
	generateAthleteBios(limit)
		.then(() => {
			console.log("✅ Bio generation completed successfully");
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Bio generation failed:", error);
			process.exit(1);
		});
} else if (operation === "test-bios") {
	generateAthleteBios(98)
		.then(() => {
			console.log("✅ Test bio generation completed successfully");
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Test bio generation failed:", error);
			process.exit(1);
		});
} else if (operation === "process-results") {
	if (!resultsFile) {
		console.error("Please provide the path to the results file");
		process.exit(1);
	}

	processBatchResults(resultsFile)
		.then(() => {
			console.log("✅ Results processing completed successfully");
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Results processing failed:", error);
			process.exit(1);
		});
} else {
	console.log(
		"Please specify an operation: 'import [limit]', 'generate-bios [limit]', 'test-bios', or 'process-results <file>'",
	);
	process.exit(1);
}
