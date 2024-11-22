import { NextRequest, NextResponse } from "next/server";
import {
	updatePodcastData,
	updateAllPodcastColors,
	updatePodcastByFeedUrl,
} from "@/db";
import { headers } from "next/headers";

let isUpdating = false;
const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
let lockTimeout: NodeJS.Timeout;

// Validate the API key from the request
async function isAuthorized(request: NextRequest): Promise<boolean> {
	// Try both methods of getting the header
	const headersList = await headers();
	const apiKeyFromHeaders = headersList.get("x-api-key");
	const apiKeyFromRequest = request.headers.get("x-api-key");
	const validApiKey = process.env.UPDATE_API_KEY;

	// Debug logs
	// console.log("API Key from headers():", apiKeyFromHeaders);
	// console.log("API Key from request:", apiKeyFromRequest);
	// console.log("Expected API Key:", validApiKey);

	if (!validApiKey) {
		console.error("API key not configured in environment variables");
		return false;
	}

	// Check both possible sources of the API key
	const isValid =
		apiKeyFromHeaders === validApiKey || apiKeyFromRequest === validApiKey;
	console.log("Is Valid:", isValid);
	return isValid;
}

async function handleUpdate(feedUrl?: string) {
	if (isUpdating) {
		return NextResponse.json(
			{ message: "Update already in progress" },
			{ status: 409 },
		);
	}

	isUpdating = true;
	clearTimeout(lockTimeout);

	// Set a timeout to release the lock in case of unexpected errors
	lockTimeout = setTimeout(() => {
		isUpdating = false;
	}, LOCK_TIMEOUT);

	try {
		if (feedUrl) {
			// Update single podcast
			const result = await updatePodcastByFeedUrl(feedUrl);
			await updateAllPodcastColors();

			return NextResponse.json(
				{
					message: "Single podcast update completed",
					result,
				},
				{ status: 200 },
			);
			// biome-ignore lint/style/noUselessElse: <explanation>
		} else {
			// Update all podcasts
			const results = await updatePodcastData();
			await updateAllPodcastColors();

			return NextResponse.json(
				{
					message: "Podcast data and colors updated successfully",
					results,
				},
				{ status: 200 },
			);
		}
	} catch (error) {
		console.error("Error updating podcast data or colors:", error);
		return NextResponse.json(
			{
				message: "Error updating podcast data or colors",
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	} finally {
		clearTimeout(lockTimeout);
		isUpdating = false;
	}
}

export async function GET(request: NextRequest) {
	if (!(await isAuthorized(request))) {
		return new Response("Unauthorized", { status: 401 });
	}

	// Get feedUrl from searchParams
	const feedUrl = request.nextUrl.searchParams.get("feedUrl");
	return handleUpdate(feedUrl || undefined);
}

export async function POST(request: NextRequest) {
	if (!(await isAuthorized(request))) {
		return new Response("Unauthorized", { status: 401 });
	}

	// Get feedUrl from searchParams
	const feedUrl = request.nextUrl.searchParams.get("feedUrl");
	return handleUpdate(feedUrl || undefined);
}
