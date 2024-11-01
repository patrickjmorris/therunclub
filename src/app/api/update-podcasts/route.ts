import { NextRequest, NextResponse } from "next/server";
import { updatePodcastData } from "@/db";
import { headers } from "next/headers";

let isUpdating = false;
const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
let lockTimeout: NodeJS.Timeout;

// Validate the API key from the request
async function isAuthorized(request: NextRequest): Promise<boolean> {
	const headersList = await headers();
	const apiKey = request.headers.get("x-api-key");
	
	// Get the API key from environment variable
	const validApiKey = process.env.UPDATE_PODCASTS_API_KEY;
	
	if (!validApiKey) {
		console.error("API key not configured in environment variables");
		return false;
	}

	return apiKey === validApiKey;
}

async function handleUpdate() {
	if (!isUpdating) {
		isUpdating = true;
		clearTimeout(lockTimeout);
		
		// Set a timeout to release the lock in case of unexpected errors
		lockTimeout = setTimeout(() => {
			isUpdating = false;
		}, LOCK_TIMEOUT);

		try {
			const results = await updatePodcastData();
			return NextResponse.json(
				{ 
					message: "Podcast data updated successfully",
					results 
				},
				{ status: 200 }
			);
		} catch (error) {
			console.error("Error updating podcast data:", error);
			return NextResponse.json(
				{ 
					message: "Error updating podcast data",
					error: error instanceof Error ? error.message : "Unknown error"
				},
				{ status: 500 }
			);
		} finally {
			clearTimeout(lockTimeout);
			isUpdating = false;
		}
	} else {
		return NextResponse.json(
			{ message: "Update already in progress" },
			{ status: 409 }
		);
	}
}

export async function GET(request: NextRequest) {
	// Check authorization before proceeding
	if (!isAuthorized(request)) {
		return new Response("Unauthorized", { status: 401 });
	}
	return handleUpdate();
}

export async function POST(request: NextRequest) {
	// Check authorization before proceeding
	if (!isAuthorized(request)) {
		return new Response("Unauthorized", { status: 401 });
	}
	return handleUpdate();
}
