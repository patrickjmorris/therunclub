import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Updated schema with proper optional handling
const clubSchema = z.object({
	clubName: z.string(),
	description: z.string().nullable(),
	city: z.string(),
	location: z.object({
		city: z.string(),
		state: z.string().nullable(),
		country: z.string(),
		coordinates: z
			.object({
				latitude: z.number().nullish(),
				longitude: z.number().nullish(),
			})
			.nullish(),
	}),
	website: z.string().url().nullable(),
	socialMedia: z.object({
		facebook: z.string().url().nullish(),
		instagram: z.string().url().nullish(),
		twitter: z.string().url().nullish(),
		strava: z.string().url().nullish(),
	}),
	metadata: z.object({
		foundedYear: z.number().nullish(),
		memberCount: z.number().nullish(),
		meetupSchedule: z.string().nullish(),
		difficultyLevel: z
			.enum(["Beginner", "Intermediate", "Advanced", "All Levels"])
			.nullish(),
		tags: z.array(z.string()).nullish(),
		amenities: z.array(z.string()).nullish(),
		events: z
			.array(
				z.object({
					name: z.string(),
					date: z.string().nullish(),
					description: z.string().nullish(),
				}),
			)
			.nullish(),
	}),
	lastUpdated: z.string().datetime(),
});

export type ExtractedClubInfo = z.infer<typeof clubSchema>;

const SYSTEM_PROMPT = `
You are a specialized AI assistant focused on extracting and enriching running club information.
Your goal is to:
1. Extract core information about running clubs from provided text
2. Enrich the data with additional metadata where possible
3. Ensure all data is accurate and properly formatted
4. Add relevant tags and categorization
5. Include any regular meetup schedules or notable events

YOU MUST OUTPUT IN ONLY JSON.

When extracting location data:
- Always include city and country
- Add state/province for applicable countries
- Add coordinates if they can be reasonably inferred

For social media:
- Verify and format all URLs correctly
- Only include active, official accounts

For metadata:
- Include founding year if mentioned
- Estimate member count if indicated
- Note regular meetup schedules
- Categorize difficulty level
- List relevant amenities (e.g., bag storage, showers)
- Add appropriate tags (e.g., trail running, road running, competitive)
Your task is to extract information and return it as a JSON object with the following structure:

{
		clubName: "New York Road Runners (NYRR)",
		description:
			"The world's premier community running organization, serving runners of all abilities through races, community runs, walks, training, and more.",
		location: {
			city: "New York",
			state: "NY",
			country: "United States",
			coordinates: {
				latitude: 40.7829,
				longitude: -73.9654,
			},
		},
		website: "https://www.nyrr.org",
		socialMedia: {
			facebook: "https://www.facebook.com/NYRR",
			instagram: "https://www.instagram.com/nyrr",
			twitter: "https://twitter.com/nyrr",
			strava: "https://www.strava.com/clubs/nyrr",
		},
		metadata: {
			foundedYear: 1958,
			memberCount: 60000,
			difficultyLevel: "All Levels",
			tags: ["Road Running", "Marathon Training", "Community"],
			meetupSchedule: "Multiple weekly runs",
			amenities: ["Bag Storage", "Showers", "Training Programs"],
			events: [
				{
					name: "New York City Marathon",
					date: "2024-11-03",
					description: "The world's largest marathon",
				},
			],
		},
`;

export async function extractClubInfo(
	text: string,
): Promise<ExtractedClubInfo> {
	const completion = await openai.chat.completions.create({
		model: "gpt-4o-mini",
		temperature: 0.1,
		messages: [
			{
				role: "system",
				content: SYSTEM_PROMPT,
			},
			{
				role: "user",
				content: `Extract the running club information and return it as a JSON object. Here's the text to process: ${text}`,
			},
		],
		response_format: {
			type: "json_object",
		},
	});

	const content = completion.choices[0].message.content;
	if (!content) throw new Error("No content received from OpenAI");

	const extractedData = JSON.parse(content);
	return clubSchema.parse({
		...extractedData,
		lastUpdated: new Date().toISOString(),
	});
}

// Helper function to batch process club information
export async function batchExtractClubInfo(
	texts: string[],
	batchSize = 3,
): Promise<ExtractedClubInfo[]> {
	const results: ExtractedClubInfo[] = [];

	for (let i = 0; i < texts.length; i += batchSize) {
		const batch = texts.slice(i, i + batchSize);
		const promises = batch.map((text) => extractClubInfo(text));

		try {
			const batchResults = await Promise.all(promises);
			results.push(...batchResults);
		} catch (error) {
			console.error(`Error processing batch ${i / batchSize + 1}:`, error);
		}

		// Rate limiting pause between batches
		if (i + batchSize < texts.length) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	return results;
}

// Utility function to enhance existing club data
export async function enhanceClubMetadata(
	club: Partial<ExtractedClubInfo>,
): Promise<ExtractedClubInfo> {
	const prompt = `
    Enhance the following running club information with additional metadata:
    ${JSON.stringify(club, null, 2)}
    
    Please add or update:
    - More detailed description
    - Relevant tags
    - Amenities if applicable
    - Regular meetup schedule if known
    - Difficulty level categorization
    - Any known events
  `;

	return extractClubInfo(prompt);
}
