import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { videos, podcasts, episodes, contentTags } from "@/db/schema";
import { eq, and, gte, desc, sql, not } from "drizzle-orm";
import { openai } from "@/lib/openai";
import { format, subHours } from "date-fns";

// Define content types
type ContentType = "video" | "podcast" | "episode" | "all";

// Helper function to check authorization
async function isAuthorized(request: NextRequest): Promise<boolean> {
	const headersList = await headers();
	const apiKeyFromHeaders = headersList.get("x-api-key");
	const apiKeyFromRequest = request.headers.get("x-api-key");
	const validApiKey = process.env.UPDATE_API_KEY;

	// Check for cron secret
	const authHeader = headersList.get("authorization");
	const validCronSecret = process.env.CRON_SECRET;
	const isCronRequest = authHeader === `Bearer ${validCronSecret}`;

	if (!validApiKey && !validCronSecret) {
		console.error(
			"Neither API key nor CRON_SECRET configured in environment variables",
		);
		return false;
	}

	return (
		apiKeyFromHeaders === validApiKey ||
		apiKeyFromRequest === validApiKey ||
		isCronRequest
	);
}

// Add a list of common tag prefixes that should be preserved
const COMMON_PREFIXES = [
	"u18",
	"u20",
	"u23", // Age categories
	"5k",
	"10k",
	"half",
	"marathon", // Race distances
	"pre",
	"post", // Timing prefixes
];

// Add a list of common running-related tags for fuzzy matching
const COMMON_TAGS = [
	// Running disciplines
	"track",
	"field",
	"road",
	"trail",
	"cross country",
	"ultramarathon",
	"marathon",
	"half marathon",
	"5k",
	"10k",
	"sprinting",
	"middle distance",
	"long distance",
	"relay",

	// Training concepts
	"training",
	"workout",
	"recovery",
	"interval",
	"tempo",
	"easy run",
	"long run",
	"speed work",
	"strength",
	"conditioning",
	"stretching",
	"mobility",
	"warm up",
	"cool down",

	// Equipment
	"shoes",
	"gear",
	"apparel",
	"watch",
	"gps",
	"hydration",
	"nutrition",

	// Athlete categories
	"elite",
	"professional",
	"amateur",
	"recreational",
	"beginner",
	"advanced",
	"youth",
	"masters",
	"u18",
	"u20",
	"u23",
	"senior",

	// Events and competitions
	"olympics",
	"world championships",
	"diamond league",
	"race",
	"competition",
	"championship",

	// Running concepts
	"form",
	"technique",
	"cadence",
	"stride",
	"pacing",
	"endurance",
	"speed",
	"power",
	"vo2max",
	"lactate threshold",
	"aerobic",
	"anaerobic",

	// Injuries and health
	"injury",
	"prevention",
	"rehabilitation",
	"health",
	"fitness",
	"wellness",

	// Running community
	"community",
	"club",
	"team",
	"coach",
	"coaching",
	"runner",
];

// Content item interface
interface ContentItem {
	id: string;
	title: string;
	description?: string | null;
	content?: string | null;
	type: string;
}

// Extract tags from completion string with improved normalization
function extractTags(completion: string): string[] {
	// Try to parse as JSON array first
	try {
		const jsonTags = JSON.parse(completion);
		if (Array.isArray(jsonTags)) {
			return normalizeTags(
				jsonTags
					.filter((tag) => typeof tag === "string" && tag.trim().length > 0)
					.map((tag) => tag.trim().toLowerCase()),
			);
		}
	} catch (e) {
		// Not JSON, continue with other formats
	}

	// Try to extract from numbered list (e.g., "1. tag1 2. tag2")
	const numberedListRegex = /\d+\.\s*([^0-9\n]+)/g;
	const numberedMatches = [...completion.matchAll(numberedListRegex)];
	if (numberedMatches.length > 0) {
		return normalizeTags(
			numberedMatches
				.map((match) => match[1].trim().toLowerCase())
				.filter((tag) => tag.length > 0),
		);
	}

	// Try to extract from comma-separated list
	if (completion.includes(",")) {
		return normalizeTags(
			completion
				.split(",")
				.map((tag) => tag.trim().toLowerCase())
				.filter((tag) => tag.length > 0),
		);
	}

	// Try to extract from line-separated list
	return normalizeTags(
		completion
			.split("\n")
			.map((tag) => tag.trim().toLowerCase())
			.filter((tag) => tag.length > 0),
	);
}

// Normalize tags to ensure quality and consistency
function normalizeTags(tags: string[]): string[] {
	// Step 1: Basic normalization (lowercase, trim, remove special characters)
	let normalizedTags = tags.map((tag) => {
		// Convert to lowercase and trim
		let normalized = tag.toLowerCase().trim();

		// Remove special characters except hyphens and spaces
		normalized = normalized.replace(/[^\w\s-]/g, "");

		// Replace multiple spaces with a single space
		normalized = normalized.replace(/\s+/g, " ");

		return normalized;
	});

	// Step 2: Filter out tags that are too short (unless they're common prefixes)
	normalizedTags = normalizedTags.filter((tag) => {
		// Keep tags that are in the common prefixes list
		if (COMMON_PREFIXES.some((prefix) => tag === prefix)) {
			return true;
		}

		// Filter out tags that are too short
		return tag.length >= 3;
	});

	// Step 3: Expand abbreviated tags
	normalizedTags = normalizedTags.map((tag) => {
		// Expand common abbreviations
		if (tag === "u") return "u18";
		if (tag === "xc") return "cross country";
		if (tag === "cc") return "cross country";
		if (tag === "tr") return "trail running";
		if (tag === "mar") return "marathon";
		if (tag === "hm") return "half marathon";

		return tag;
	});

	// Step 4: Fuzzy matching to standardize similar tags
	normalizedTags = normalizedTags.map((tag) => {
		// Find the closest match in common tags if similarity is high
		const match = findClosestMatch(tag, COMMON_TAGS);
		return match || tag;
	});

	// Step 5: Remove duplicates
	normalizedTags = Array.from(new Set(normalizedTags));

	// Step 6: Score and prioritize tags
	const scoredTags = normalizedTags.map((tag) => {
		let score = 0;

		// Prioritize common tags
		if (COMMON_TAGS.includes(tag)) {
			score += 2;
		}

		// Prioritize specific categories
		if (tag.includes("marathon") || tag.includes("5k") || tag.includes("10k")) {
			score += 2; // Distance-specific tags are valuable
		}

		if (tag.includes("championship") || tag.includes("olympics")) {
			score += 2; // Competition tags are valuable
		}

		if (
			tag.includes("u18") ||
			tag.includes("elite") ||
			tag.includes("masters")
		) {
			score += 1; // Athlete category tags are somewhat valuable
		}

		// Penalize very generic tags
		if (tag === "running" || tag === "runner" || tag === "athletics") {
			score -= 2;
		}

		return { tag, score };
	});

	// Sort by score (descending)
	scoredTags.sort((a, b) => b.score - a.score);

	// Step 7: Limit to 3-5 tags
	// If we have more than 5 tags, take the top 5
	// If we have less than 3 tags, we'll just return what we have
	const minTags = 3;
	const maxTags = 5;

	const finalTags = scoredTags.slice(0, maxTags).map((item) => item.tag);

	// If we have less than minTags, we'll just return what we have
	return finalTags.length >= minTags ? finalTags : finalTags;
}

// Find the closest match for a tag using Levenshtein distance
function findClosestMatch(tag: string, commonTags: string[]): string | null {
	// If the tag is already in the common tags list, return it
	if (commonTags.includes(tag)) {
		return tag;
	}

	let bestMatch: string | null = null;
	let bestScore = Infinity;

	for (const commonTag of commonTags) {
		// Skip if lengths are too different
		if (Math.abs(tag.length - commonTag.length) > 2) {
			continue;
		}

		// Calculate Levenshtein distance
		const distance = levenshteinDistance(tag, commonTag);

		// Calculate a normalized score based on the tag length
		const score = distance / Math.max(tag.length, commonTag.length);

		// If the score is below threshold and better than previous matches
		if (score < 0.3 && score < bestScore) {
			bestScore = score;
			bestMatch = commonTag;
		}
	}

	return bestMatch;
}

// Calculate Levenshtein distance between two strings
function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = [];

	// Initialize the matrix
	for (let i = 0; i <= a.length; i++) {
		matrix[i] = [i];
	}

	for (let j = 0; j <= b.length; j++) {
		matrix[0][j] = j;
	}

	// Fill the matrix
	for (let i = 1; i <= a.length; i++) {
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			matrix[i][j] = Math.min(
				matrix[i - 1][j] + 1, // deletion
				matrix[i][j - 1] + 1, // insertion
				matrix[i - 1][j - 1] + cost, // substitution
			);
		}
	}

	return matrix[a.length][b.length];
}

// Save tags to database
async function saveTags(
	contentId: string,
	contentType: string,
	tags: string[],
): Promise<boolean> {
	try {
		// Delete existing tags first
		await db
			.delete(contentTags)
			.where(
				and(
					eq(contentTags.contentId, contentId),
					eq(contentTags.contentType, contentType),
				),
			);

		// Insert new tags
		if (tags.length > 0) {
			const tagsToInsert = tags.map((tag) => ({
				contentId,
				contentType,
				tag,
			}));

			await db.insert(contentTags).values(tagsToInsert);
		}

		return true;
	} catch (error) {
		console.error(`Error saving tags for ${contentType} ${contentId}:`, error);
		return false;
	}
}

// Generate tags for a content item
async function generateTags(
	item: ContentItem,
	model = "gpt-4o-mini",
): Promise<string[]> {
	// Enhanced system prompt for tag generation
	const system = `You are a content tagging specialist for a running and athletics website. Your task is to generate relevant tags for content based on its title and description.

Generate 3-5 tags that accurately represent the content's topic, themes, and key elements.
Tags should be lowercase, single words or short phrases (1-3 words maximum).
Focus on creating tags that would be useful for content discovery and categorization.

Important guidelines:
1. Use standard running terminology (e.g., "marathon", "track", "cross country", "training")
2. Include specific event distances when mentioned (e.g., "5k", "10k", "half marathon")
3. Include athlete categories when relevant (e.g., "elite", "masters", "u20")
4. Include specific competitions or events when mentioned (e.g., "olympics", "world championships")
5. Avoid overly generic tags (e.g., "running", "sports")
6. Avoid creating new abbreviations - use full terms
7. Prioritize quality over quantity - 3-5 highly relevant tags are better than many generic ones`;

	// Create prompt based on content type and available fields
	let contentText = "";
	if (item.description) contentText += `\nDescription: ${item.description}`;
	if (item.content)
		contentText += `\nContent: ${item.content.substring(0, 1000)}...`; // Limit content length

	const prompt = `Generate 3-5 tags for the following ${item.type} about running/athletics:
Title: ${item.title}${contentText}

Return the tags in one of these formats:
1. A JSON array: ["tag1", "tag2", "tag3"]
2. A numbered list: 1. tag1 2. tag2 3. tag3
3. Comma-separated: tag1, tag2, tag3

The tags should be specific to running and athletics topics, focusing on disciplines, events, training concepts, or athlete categories mentioned in the content.

Remember: Quality over quantity. Provide only 3-5 highly relevant tags.`;

	try {
		const response = await openai.chat.completions.create({
			model,
			messages: [
				{ role: "system", content: system },
				{ role: "user", content: prompt },
			],
			temperature: 0.7,
		});

		const completion = response.choices[0].message.content || "";
		return extractTags(completion);
	} catch (error) {
		console.error("Error generating tags:", error);
		return [];
	}
}

// Get content items from database
async function getContentItems(
	contentType: ContentType,
	hours: number,
	skipTagged: boolean,
	batchSize: number,
) {
	const cutoffDate = subHours(new Date(), hours);
	const formattedDate = format(cutoffDate, "yyyy-MM-dd HH:mm:ss");

	const results: ContentItem[] = [];

	if (contentType === "all" || contentType === "video") {
		// Build the query conditions for videos
		const videoConditions = [
			gte(videos.updatedAt, sql`${formattedDate}::timestamp`),
		];

		// Create a base query for videos
		const videoQuery = db
			.select({
				id: videos.id,
				title: videos.title,
				description: videos.description,
			})
			.from(videos);

		// If we should skip already tagged content, add the join and condition
		if (skipTagged) {
			const videoQueryWithJoin = videoQuery.leftJoin(
				contentTags,
				and(
					eq(videos.id, contentTags.contentId),
					eq(contentTags.contentType, "video"),
				),
			);
			videoConditions.push(sql`${contentTags.id} IS NULL`);

			// Add conditions and execute
			const finalVideoQuery = videoQueryWithJoin
				.where(and(...videoConditions))
				.orderBy(desc(videos.updatedAt))
				.limit(batchSize);

			const videoResults = await finalVideoQuery;

			// Map to ContentItem format
			results.push(
				...videoResults.map((item) => ({
					id: item.id,
					title: item.title,
					description: item.description,
					type: "video",
				})),
			);
		} else {
			// Add conditions and execute without join
			const finalVideoQuery = videoQuery
				.where(and(...videoConditions))
				.orderBy(desc(videos.updatedAt))
				.limit(batchSize);

			const videoResults = await finalVideoQuery;

			// Map to ContentItem format
			results.push(
				...videoResults.map((item) => ({
					id: item.id,
					title: item.title,
					description: item.description,
					type: "video",
				})),
			);
		}
	}

	if (contentType === "all" || contentType === "podcast") {
		// Build the query conditions for podcasts
		const podcastConditions = [
			gte(podcasts.updatedAt, sql`${formattedDate}::timestamp`),
		];

		// Create a base query for podcasts
		const podcastQuery = db
			.select({
				id: podcasts.id,
				title: podcasts.title,
				description: podcasts.description,
			})
			.from(podcasts);

		// If we should skip already tagged content, add the join and condition
		if (skipTagged) {
			const podcastQueryWithJoin = podcastQuery.leftJoin(
				contentTags,
				and(
					eq(podcasts.id, contentTags.contentId),
					eq(contentTags.contentType, "podcast"),
				),
			);
			podcastConditions.push(sql`${contentTags.id} IS NULL`);

			// Add conditions and execute
			const finalPodcastQuery = podcastQueryWithJoin
				.where(and(...podcastConditions))
				.orderBy(desc(podcasts.updatedAt))
				.limit(batchSize);

			const podcastResults = await finalPodcastQuery;

			// Map to ContentItem format
			results.push(
				...podcastResults.map((item) => ({
					id: item.id,
					title: item.title,
					description: item.description,
					type: "podcast",
				})),
			);
		} else {
			// Add conditions and execute without join
			const finalPodcastQuery = podcastQuery
				.where(and(...podcastConditions))
				.orderBy(desc(podcasts.updatedAt))
				.limit(batchSize);

			const podcastResults = await finalPodcastQuery;

			// Map to ContentItem format
			results.push(
				...podcastResults.map((item) => ({
					id: item.id,
					title: item.title,
					description: item.description,
					type: "podcast",
				})),
			);
		}
	}

	if (contentType === "all" || contentType === "episode") {
		// Build the query conditions for episodes
		const episodeConditions = [
			gte(episodes.updatedAt, sql`${formattedDate}::timestamp`),
		];

		// Create a base query for episodes
		const episodeQuery = db
			.select({
				id: episodes.id,
				title: episodes.title,
				content: episodes.content,
			})
			.from(episodes);

		// If we should skip already tagged content, add the join and condition
		if (skipTagged) {
			const episodeQueryWithJoin = episodeQuery.leftJoin(
				contentTags,
				and(
					eq(episodes.id, contentTags.contentId),
					eq(contentTags.contentType, "episode"),
				),
			);
			episodeConditions.push(sql`${contentTags.id} IS NULL`);

			// Add conditions and execute
			const finalEpisodeQuery = episodeQueryWithJoin
				.where(and(...episodeConditions))
				.orderBy(desc(episodes.updatedAt))
				.limit(batchSize);

			const episodeResults = await finalEpisodeQuery;

			// Map to ContentItem format
			results.push(
				...episodeResults.map((item) => ({
					id: item.id,
					title: item.title,
					content: item.content,
					type: "episode",
				})),
			);
		} else {
			// Add conditions and execute without join
			const finalEpisodeQuery = episodeQuery
				.where(and(...episodeConditions))
				.orderBy(desc(episodes.updatedAt))
				.limit(batchSize);

			const episodeResults = await finalEpisodeQuery;

			// Map to ContentItem format
			results.push(
				...episodeResults.map((item) => ({
					id: item.id,
					title: item.title,
					content: item.content,
					type: "episode",
				})),
			);
		}
	}

	return results;
}

// Process content items and generate tags
async function processContentItems(
	items: ContentItem[],
	model: string,
	forceTag: boolean,
): Promise<{ processed: number; success: number; failed: number }> {
	let processed = 0;
	let success = 0;
	let failed = 0;

	for (const item of items) {
		processed++;

		try {
			// Generate tags
			const tags = await generateTags(item, model);

			if (tags.length === 0) {
				console.warn(`No tags generated for ${item.type} ${item.id}`);
				failed++;
				continue;
			}

			// Save tags to database
			const saveSuccess = await saveTags(item.id, item.type, tags);

			if (saveSuccess) {
				success++;
				console.log(
					`Successfully tagged ${item.type} ${item.id} with [${tags.join(
						", ",
					)}]`,
				);
			} else {
				failed++;
				console.error(`Failed to save tags for ${item.type} ${item.id}`);
			}
		} catch (error) {
			failed++;
			console.error(`Error processing ${item.type} ${item.id}:`, error);
		}
	}

	return { processed, success, failed };
}

// Main handler function
export async function GET(request: NextRequest) {
	// Check authorization
	if (!(await isAuthorized(request))) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	// Parse query parameters
	const searchParams = request.nextUrl.searchParams;
	const contentType = (searchParams.get("type") || "all") as ContentType;
	const hours = parseInt(searchParams.get("hours") || "24", 10);
	const batchSize = parseInt(searchParams.get("batchSize") || "50", 10);
	const skipTagged = searchParams.get("skipTagged") !== "false"; // Default to true
	const forceTag = searchParams.get("forceTag") === "true"; // Default to false
	const model = searchParams.get("model") || "gpt-4o-mini";

	try {
		console.log(
			`Starting tagging process for ${contentType} content from the last ${hours} hours`,
		);

		// Get content items
		const items = await getContentItems(
			contentType,
			hours,
			skipTagged,
			batchSize,
		);
		console.log(`Found ${items.length} items to process`);

		if (items.length === 0) {
			return NextResponse.json({
				message: "No content items found to tag",
				params: {
					contentType,
					hours,
					batchSize,
					skipTagged,
					forceTag,
					model,
				},
			});
		}

		// Process content items
		const results = await processContentItems(items, model, forceTag);

		// Return results
		return NextResponse.json({
			message: "Tagging process completed",
			results: {
				total: results.processed,
				success: results.success,
				failed: results.failed,
			},
			params: {
				contentType,
				hours,
				batchSize,
				skipTagged,
				forceTag,
				model,
			},
		});
	} catch (error) {
		console.error("Error in tagging process:", error);
		return NextResponse.json(
			{
				message: "Error in tagging process",
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

// Support POST method as well
export { GET as POST };
