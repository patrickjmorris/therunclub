#!/usr/bin/env bun
/**
 * Test Tagging API Script
 *
 * This script tests the tagging API by making a request to it.
 *
 * Usage:
 *   bun run scripts/test-tagging-api.ts           # Process all content types with default parameters
 *   bun run scripts/test-tagging-api.ts --type video # Process only videos
 *   bun run scripts/test-tagging-api.ts --hours 48 # Process content from the last 48 hours
 *   bun run scripts/test-tagging-api.ts --batch-size 10 # Process 10 items at a time
 *   bun run scripts/test-tagging-api.ts --force-tag # Force tag content that already has tags
 *   bun run scripts/test-tagging-api.ts --model gpt-4o # Use GPT-4o model for tagging
 */

import { parseArgs } from "util";

// Parse command line arguments
const args = parseArgs({
	options: {
		type: { type: "string" },
		hours: { type: "string" },
		"batch-size": { type: "string" },
		"force-tag": { type: "boolean" },
		model: { type: "string" },
		"skip-tagged": { type: "boolean" },
	},
	strict: false,
});

// Configuration
const API_URL =
	process.env.NODE_ENV === "production"
		? "https://therunclub.vercel.app/api/tagging"
		: "http://localhost:3000/api/tagging";

const API_KEY = process.env.UPDATE_API_KEY;

if (!API_KEY) {
	console.error("UPDATE_API_KEY environment variable is not set");
	process.exit(1);
}

// Build query parameters
const params = new URLSearchParams();

if (args.values.type && typeof args.values.type === "string") {
	params.append("type", args.values.type);
}

if (args.values.hours && typeof args.values.hours === "string") {
	params.append("hours", args.values.hours);
}

if (
	args.values["batch-size"] &&
	typeof args.values["batch-size"] === "string"
) {
	params.append("batchSize", args.values["batch-size"]);
}

if (args.values["force-tag"] === true) {
	params.append("forceTag", "true");
}

if (args.values.model && typeof args.values.model === "string") {
	params.append("model", args.values.model);
}

if (args.values["skip-tagged"] === false) {
	params.append("skipTagged", "false");
}

// Make the request
async function testTaggingApi() {
	console.log(`Testing tagging API at ${API_URL}?${params.toString()}`);

	try {
		const response = await fetch(`${API_URL}?${params.toString()}`, {
			method: "GET",
			headers: {
				"x-api-key": API_KEY as string,
			},
		});

		if (!response.ok) {
			console.error(`Error: ${response.status} ${response.statusText}`);
			const errorText = await response.text();
			console.error(errorText);
			return;
		}

		const data = await response.json();
		console.log("Response:", JSON.stringify(data, null, 2));
	} catch (error) {
		console.error("Error making request:", error);
	}
}

testTaggingApi();
