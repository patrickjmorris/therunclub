#!/usr/bin/env bun
/**
 * Backfill Tags Script
 *
 * This script processes all existing videos, podcasts, and episodes
 * and generates tags for them using OpenAI's batch API for cost efficiency.
 *
 * Usage:
 *   bun run scripts/backfill-tags.ts           # Process all content (development environment)
 *   bun run scripts/backfill-tags.ts --days 30 # Process content from the last 30 days
 *   bun run scripts/backfill-tags.ts --type video --days 7 # Process only videos from the last 7 days
 *   bun run scripts/backfill-tags.ts --after 2023-01-01 # Process content published after Jan 1, 2023
 *   bun run scripts/backfill-tags.ts --debug   # Enable debug logging
 *   NODE_ENV=production bun run scripts/backfill-tags.ts # Run against production database
 */

import fs from "fs";
import path from "path";
import { db } from "../src/db/client";
import {
	videos,
	podcasts,
	episodes,
	contentTags,
	Video,
	Podcast,
	Episode,
} from "../src/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import OpenAI from "openai";
import { parseArgs } from "util";
import { format } from "date-fns";

// Parse command line arguments
const args = parseArgs({
	options: {
		days: { type: "string" },
		after: { type: "string" },
		type: { type: "string" },
		debug: { type: "boolean" },
		"batch-size": { type: "string" },
		limit: { type: "string" },
		"skip-tagged": { type: "boolean" },
	},
	strict: false,
});

// Set up OpenAI client
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Configuration
const DEBUG = args.values.debug === true;
const CONTENT_TYPE = args.values.type || "all"; // 'all', 'video', 'podcast', 'episode'
const BATCH_SIZE =
	args.values["batch-size"] && typeof args.values["batch-size"] === "string"
		? parseInt(args.values["batch-size"])
		: 50; // Default to 50 items per batch
const LIMIT =
	args.values.limit && typeof args.values.limit === "string"
		? parseInt(args.values.limit)
		: undefined;
const SKIP_TAGGED = args.values["skip-tagged"] !== false; // Default to true
const TMP_DIR = path.join(process.cwd(), "tmp");

// Ensure tmp directory exists
if (!fs.existsSync(TMP_DIR)) {
	fs.mkdirSync(TMP_DIR, { recursive: true });
}

// Calculate date filter
let dateFilter: Date | null = null;
if (args.values.days && typeof args.values.days === "string") {
	const daysAgo = parseInt(args.values.days);
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	dateFilter = date;
} else if (args.values.after && typeof args.values.after === "string") {
	dateFilter = new Date(args.values.after);
}

// Environment info
const isProduction = process.env.NODE_ENV === "production";
console.log(
	`Running in ${isProduction ? "production" : "development"} environment`,
);
if (DEBUG) console.log("Debug mode enabled");

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

// Helper function to ask a question to the OpenAI API
function question(query: string): Promise<string> {
	return openai.chat.completions
		.create({
			model: "gpt-4o-mini",
			messages: [{ role: "user", content: query }],
		})
		.then((response) => response.choices[0].message.content || "");
}

// Check database connection
async function checkConnection() {
	try {
		const result = await db.execute(
			sql`SELECT current_database(), current_user, version()`,
		);
		console.log(
			`Connected to database ${result[0].current_database} as ${result[0].current_user}`,
		);
		return true;
	} catch (error) {
		console.error("Database connection failed:", error);
		return false;
	}
}

// Sleep function for polling
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Debug logging helper
function debugLog(...args: unknown[]) {
	if (DEBUG) {
		console.log(...args);
	}
}

// Content item interface
interface ContentItem {
	id: string;
	title: string;
	description?: string | null;
	content?: string | null;
	type: string;
}

// Generate a batch file for OpenAI processing
async function generateBatchFile(contentItems: ContentItem[]) {
	// Create a timestamp for the batch file
	const timestamp = new Date().toISOString().replace(/:/g, "-");
	const batchFilePath = path.join(TMP_DIR, `content-batch-${timestamp}.jsonl`);

	// Delete existing batch file if it exists
	if (fs.existsSync(batchFilePath)) {
		fs.unlinkSync(batchFilePath);
	}

	// Enhanced system prompt for tag generation with updated tag count
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

	// Create batch entries
	for (const item of contentItems) {
		// Generate a unique custom_id
		const custom_id = `${item.type}_${item.id}`;
		const method = "POST";
		const url = "/v1/chat/completions";

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

		// Create the request body
		const body = {
			model: "gpt-4o-mini",
			messages: [
				{ role: "system", content: system },
				{ role: "user", content: prompt },
			],
			temperature: 0.7,
		};

		// Create the batch entry
		const line = `{"custom_id": "${custom_id}", "method": "${method}", "url": "${url}", "body": ${JSON.stringify(
			body,
		)}}`;
		fs.appendFileSync(batchFilePath, `${line}\n`);
	}

	return batchFilePath;
}

// Process batch results from a file
async function processBatchResults(filePath: string) {
	debugLog("Reading results file...");
	if (!fs.existsSync(filePath)) {
		throw new Error(`Results file not found at path: ${filePath}`);
	}

	const fileContents = fs.readFileSync(filePath, "utf-8");
	const lines = fileContents.trim().split("\n");
	debugLog(`Found ${lines.length} results to process`);

	let successCount = 0;
	let errorCount = 0;

	for (const line of lines) {
		try {
			const result = JSON.parse(line);

			// Extract content ID and type from custom_id
			const [type, id] = result.custom_id.split("_");

			if (!id || !type) {
				console.error("Invalid custom_id format:", result.custom_id);
				errorCount++;
				continue;
			}

			// Check if there was an error in the response
			if (result.error) {
				console.error(`Error in response for ${type} ${id}:`, result.error);
				errorCount++;
				continue;
			}

			// Check if we have a valid response structure
			if (!result.response?.body?.choices?.[0]?.message?.content) {
				console.error(`Invalid response structure for ${type} ${id}`);
				errorCount++;
				continue;
			}

			// Extract the completion text
			const completion = result.response.body.choices[0].message.content;

			// Extract tags from the completion
			const tags = extractTags(completion);

			// Save tags to database
			const success = await saveTags(id, type, tags);

			if (success) {
				successCount++;
				debugLog(`Successfully tagged ${type} ${id} with [${tags.join(", ")}]`);
			} else {
				errorCount++;
				console.error(`Failed to save tags for ${type} ${id}`);
			}
		} catch (error) {
			console.error("Error processing batch result:", error);
			errorCount++;
		}
	}

	console.log(
		`Batch processing complete: ${successCount} successful, ${errorCount} failed`,
	);
	return { successCount, errorCount };
}

// Process videos
async function processVideos(dateFilter: Date | null) {
	console.log("Processing videos...");

	try {
		const items = await getContentItems("video", dateFilter);
		console.log(`Found ${items.length} videos to process`);

		if (items.length === 0) {
			console.log("No videos to process");
			return { processed: 0, success: 0, failed: 0 };
		}

		// Process in batches
		const results = await processContentBatches(items as Video[], "video");
		return results;
	} catch (error) {
		console.error("Error processing videos:", error);
		return { processed: 0, success: 0, failed: 0 };
	}
}

// Process podcasts
async function processPodcasts(dateFilter: Date | null) {
	console.log("Processing podcasts...");

	try {
		const items = await getContentItems("podcast", dateFilter);
		console.log(`Found ${items.length} podcasts to process`);

		if (items.length === 0) {
			console.log("No podcasts to process");
			return { processed: 0, success: 0, failed: 0 };
		}

		// Process in batches
		const results = await processContentBatches(items as Podcast[], "podcast");
		return results;
	} catch (error) {
		console.error("Error processing podcasts:", error);
		return { processed: 0, success: 0, failed: 0 };
	}
}

// Process episodes
async function processEpisodes(dateFilter: Date | null) {
	console.log("Processing episodes...");

	try {
		const items = await getContentItems("episode", dateFilter);
		console.log(`Found ${items.length} episodes to process`);

		if (items.length === 0) {
			console.log("No episodes to process");
			return { processed: 0, success: 0, failed: 0 };
		}

		// Process in batches
		const results = await processContentBatches(items as Episode[], "episode");
		return results;
	} catch (error) {
		console.error("Error processing episodes:", error);
		return { processed: 0, success: 0, failed: 0 };
	}
}

// Process content items in batches
async function processContentBatches<
	T extends {
		id: string;
		title: string;
		description?: string | null;
		content?: string | null;
	},
>(items: T[], type: string) {
	let processed = 0;
	let success = 0;
	let failed = 0;

	// Process in smaller batches
	for (let i = 0; i < items.length; i += BATCH_SIZE) {
		const batchItems = items.slice(i, i + BATCH_SIZE);
		console.log(
			`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(
				items.length / BATCH_SIZE,
			)} (${batchItems.length} items)`,
		);

		// Convert to ContentItem format
		const contentItems: ContentItem[] = batchItems.map((item) => ({
			id: item.id,
			title: item.title,
			description: item.description,
			content: item.content,
			type,
		}));

		try {
			// Generate batch file
			const batchFilePath = await generateBatchFile(contentItems);
			console.log(`Batch file created at ${batchFilePath}`);

			// Process with OpenAI
			const batchResults = await processBatchWithOpenAI(
				openai,
				batchFilePath,
				contentItems,
			);

			// Update counters
			processed += contentItems.length;
			success += batchResults.success;
			failed += batchResults.failed;

			// Add a small delay between batches to avoid rate limits
			if (i + BATCH_SIZE < items.length) {
				console.log("Waiting 5 seconds before processing next batch...");
				await sleep(5000);
			}
		} catch (error) {
			console.error(`Error processing batch: ${error}`);
			failed += contentItems.length;
		}
	}

	return { processed, success, failed };
}

// Main function to backfill tags
async function backfillTags() {
	console.log("Starting tag backfill process...");

	// Check database connection
	const isConnected = await checkConnection();
	if (!isConnected) {
		console.error("Failed to connect to database. Exiting.");
		process.exit(1);
	}

	// Track results
	const results = {
		videos: { processed: 0, success: 0, failed: 0 },
		podcasts: { processed: 0, success: 0, failed: 0 },
		episodes: { processed: 0, success: 0, failed: 0 },
	};

	// Process content based on type
	if (CONTENT_TYPE === "all" || CONTENT_TYPE === "video") {
		results.videos = await processVideos(dateFilter);
	}

	if (CONTENT_TYPE === "all" || CONTENT_TYPE === "podcast") {
		results.podcasts = await processPodcasts(dateFilter);
	}

	if (CONTENT_TYPE === "all" || CONTENT_TYPE === "episode") {
		results.episodes = await processEpisodes(dateFilter);
	}

	// Print summary
	console.log("\nTag backfill process completed:");
	console.log("Videos:", results.videos);
	console.log("Podcasts:", results.podcasts);
	console.log("Episodes:", results.episodes);

	const totalProcessed =
		results.videos.processed +
		results.podcasts.processed +
		results.episodes.processed;
	const totalSuccess =
		results.videos.success +
		results.podcasts.success +
		results.episodes.success;
	const totalFailed =
		results.videos.failed + results.podcasts.failed + results.episodes.failed;

	console.log(
		`\nTotal: ${totalProcessed} processed, ${totalSuccess} successful, ${totalFailed} failed`,
	);

	return {
		videos: results.videos,
		podcasts: results.podcasts,
		episodes: results.episodes,
		total: {
			processed: totalProcessed,
			success: totalSuccess,
			failed: totalFailed,
		},
	};
}

// Get content items from database
async function getContentItems(contentType: string, dateFilter: Date | null) {
	let formattedDate = null;
	if (dateFilter) {
		formattedDate = dateFilter.toISOString().split("T")[0];
		debugLog(`Using date filter: ${formattedDate}`);
	}

	if (contentType === "video") {
		// Build the query conditions
		const conditions = [];
		if (dateFilter && formattedDate) {
			conditions.push(gte(videos.publishedAt, sql`${formattedDate}::date`));
		}

		// Create a base query
		const query = db
			.select({
				id: videos.id,
				title: videos.title,
				description: videos.description,
				// Include other fields needed for Video type
				youtubeVideoId: videos.youtubeVideoId,
				channelId: videos.channelId,
				channelTitle: videos.channelTitle,
				thumbnailUrl: videos.thumbnailUrl,
				publishedAt: videos.publishedAt,
				viewCount: videos.viewCount,
				likeCount: videos.likeCount,
				commentCount: videos.commentCount,
				tags: videos.tags,
				duration: videos.duration,
				createdAt: videos.createdAt,
				updatedAt: videos.updatedAt,
			})
			.from(videos);

		// If we should skip already tagged content, add the join and condition
		if (SKIP_TAGGED) {
			const queryWithJoin = query.leftJoin(
				contentTags,
				and(
					eq(videos.id, contentTags.contentId),
					eq(contentTags.contentType, "video"),
				),
			);
			conditions.push(sql`${contentTags.id} IS NULL`);

			// Add conditions and execute
			const finalQuery = queryWithJoin
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(videos.publishedAt));

			// Apply limit if specified
			const limitedQuery =
				LIMIT !== undefined ? finalQuery.limit(LIMIT) : finalQuery;

			const results = await limitedQuery;
			return results as Video[];
		}

		// Add conditions and execute without join
		const finalQuery = query
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(videos.publishedAt));

		// Apply limit if specified
		const limitedQuery =
			LIMIT !== undefined ? finalQuery.limit(LIMIT) : finalQuery;

		const results = await limitedQuery;
		return results as Video[];
	}

	if (contentType === "podcast") {
		// Build the query conditions
		const conditions = [];
		if (dateFilter && formattedDate) {
			conditions.push(gte(podcasts.updatedAt, sql`${formattedDate}::date`));
		}

		// Create a base query
		const query = db
			.select({
				id: podcasts.id,
				title: podcasts.title,
				description: podcasts.description,
				// Include other fields needed for Podcast type
				podcastSlug: podcasts.podcastSlug,
				feedUrl: podcasts.feedUrl,
				image: podcasts.image,
				vibrantColor: podcasts.vibrantColor,
				author: podcasts.author,
				link: podcasts.link,
				language: podcasts.language,
				lastBuildDate: podcasts.lastBuildDate,
				itunesOwnerName: podcasts.itunesOwnerName,
				itunesOwnerEmail: podcasts.itunesOwnerEmail,
				itunesImage: podcasts.itunesImage,
				itunesAuthor: podcasts.itunesAuthor,
				itunesSummary: podcasts.itunesSummary,
				itunesExplicit: podcasts.itunesExplicit,
				episodeCount: podcasts.episodeCount,
				isDead: podcasts.isDead,
				hasParseErrors: podcasts.hasParseErrors,
				iTunesId: podcasts.iTunesId,
				updatedAt: podcasts.updatedAt,
			})
			.from(podcasts);

		// If we should skip already tagged content, add the join and condition
		if (SKIP_TAGGED) {
			const queryWithJoin = query.leftJoin(
				contentTags,
				and(
					eq(podcasts.id, contentTags.contentId),
					eq(contentTags.contentType, "podcast"),
				),
			);
			conditions.push(sql`${contentTags.id} IS NULL`);

			// Add conditions and execute
			const finalQuery = queryWithJoin
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(podcasts.updatedAt));

			// Apply limit if specified
			const limitedQuery =
				LIMIT !== undefined ? finalQuery.limit(LIMIT) : finalQuery;

			const results = await limitedQuery;
			return results as Podcast[];
		}

		// Add conditions and execute without join
		const finalQuery = query
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(podcasts.updatedAt));

		// Apply limit if specified
		const limitedQuery =
			LIMIT !== undefined ? finalQuery.limit(LIMIT) : finalQuery;

		const results = await limitedQuery;
		return results as Podcast[];
	}

	if (contentType === "episode") {
		// Build the query conditions
		const conditions = [];
		if (dateFilter && formattedDate) {
			conditions.push(gte(episodes.pubDate, sql`${formattedDate}::date`));
		}

		// Create a base query
		const query = db
			.select({
				id: episodes.id,
				title: episodes.title,
				content: episodes.content,
				// Include other fields needed for Episode type
				podcastId: episodes.podcastId,
				episodeSlug: episodes.episodeSlug,
				pubDate: episodes.pubDate,
				link: episodes.link,
				enclosureUrl: episodes.enclosureUrl,
				duration: episodes.duration,
				explicit: episodes.explicit,
				image: episodes.image,
				athleteMentionsProcessed: episodes.athleteMentionsProcessed,
				updatedAt: episodes.updatedAt,
			})
			.from(episodes);

		// If we should skip already tagged content, add the join and condition
		if (SKIP_TAGGED) {
			const queryWithJoin = query.leftJoin(
				contentTags,
				and(
					eq(episodes.id, contentTags.contentId),
					eq(contentTags.contentType, "episode"),
				),
			);
			conditions.push(sql`${contentTags.id} IS NULL`);

			// Add conditions and execute
			const finalQuery = queryWithJoin
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(episodes.pubDate));

			// Apply limit if specified
			const limitedQuery =
				LIMIT !== undefined ? finalQuery.limit(LIMIT) : finalQuery;

			const results = await limitedQuery;
			return results as Episode[];
		}

		// Add conditions and execute without join
		const finalQuery = query
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(episodes.pubDate));

		// Apply limit if specified
		const limitedQuery =
			LIMIT !== undefined ? finalQuery.limit(LIMIT) : finalQuery;

		const results = await limitedQuery;
		return results as Episode[];
	}

	throw new Error(`Unknown content type: ${contentType}`);
}

// Process a batch with OpenAI
async function processBatchWithOpenAI(
	openai: OpenAI,
	batchFilePath: string,
	contentItems: ContentItem[],
) {
	try {
		// Upload batch file
		console.log("Uploading batch file to OpenAI...");
		const file = await openai.files.create({
			file: fs.createReadStream(batchFilePath),
			purpose: "batch",
		});
		console.log(`File uploaded with ID: ${file.id}`);

		// Create batch job
		console.log("Creating batch job...");
		const batch = await openai.batches.create({
			input_file_id: file.id,
			endpoint: "/v1/chat/completions",
			completion_window: "24h",
		});
		console.log(`Batch job created with ID: ${batch.id}`);

		// Poll for completion
		console.log("Waiting for batch completion...");
		let batchStatus = await openai.batches.retrieve(batch.id);
		let attempts = 0;
		const maxAttempts = 1200; // 60 minutes max wait time

		while (batchStatus.status !== "completed" && attempts < maxAttempts) {
			await sleep(30000); // Wait 30 seconds between checks
			batchStatus = await openai.batches.retrieve(batch.id);
			console.log(
				`Batch status: ${batchStatus.status} (attempt ${
					attempts + 1
				}/${maxAttempts})`,
			);
			attempts++;
		}

		if (batchStatus.status !== "completed") {
			throw new Error(`Batch job timed out after ${maxAttempts} attempts`);
		}

		// Check for output file ID
		if (!batchStatus.output_file_id) {
			// Retry a few times to see if the output file ID becomes available
			let retryAttempts = 0;
			const maxRetryAttempts = 5;

			while (!batchStatus.output_file_id && retryAttempts < maxRetryAttempts) {
				console.log(
					`Output file ID not found, retrying in 10 seconds (attempt ${
						retryAttempts + 1
					}/${maxRetryAttempts})...`,
				);
				await sleep(10000);
				batchStatus = await openai.batches.retrieve(batch.id);
				retryAttempts++;
			}

			if (!batchStatus.output_file_id) {
				throw new Error(
					"No output file ID found in batch response after retries",
				);
			}
		}

		// Download results
		console.log(
			`Downloading results from file ${batchStatus.output_file_id}...`,
		);
		const fileResponse = await openai.files.content(batchStatus.output_file_id);
		const outputPath = path.join(TMP_DIR, `batch-results-${batch.id}.jsonl`);
		fs.writeFileSync(outputPath, await fileResponse.text());

		// Process results
		console.log("Processing batch results...");
		const results = await processBatchResults(outputPath);

		// Cleanup
		try {
			fs.unlinkSync(batchFilePath);
			fs.unlinkSync(outputPath);
		} catch (error) {
			console.error("Error cleaning up files:", error);
		}

		return { success: results.successCount, failed: results.errorCount };
	} catch (error) {
		console.error("Error processing batch with OpenAI:", error);
		return { success: 0, failed: contentItems.length };
	}
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

// Run the backfill process
backfillTags()
	.then(() => {
		console.log("Tag backfill process completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		console.error("Error during tag backfill process:", error);
		process.exit(1);
	});
