import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { seedVideos } from "@/db/seed-videos";

let isUpdating = false;
const LOCK_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
let lockTimeout: NodeJS.Timeout;

// Validate the API key from the request
async function isAuthorized(request: NextRequest): Promise<boolean> {
	const headersList = await headers();
	const apiKeyFromHeaders = headersList.get("x-api-key");
	const apiKeyFromRequest = request.headers.get("x-api-key");
	const validApiKey = process.env.UPDATE_API_KEY;

	if (!validApiKey) {
		console.error("API key not configured in environment variables");
		return false;
	}

	// Check both possible sources of the API key
	return apiKeyFromHeaders === validApiKey || apiKeyFromRequest === validApiKey;
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
			const results = await seedVideos();
			return NextResponse.json(
				{
					message: "Video and channel data updated successfully",
					results,
				},
				{ status: 200 },
			);
		} catch (error) {
			console.error("Error updating video data:", error);
			return NextResponse.json(
				{
					message: "Error updating video data",
					error: error instanceof Error ? error.message : "Unknown error",
				},
				{ status: 500 },
			);
		} finally {
			clearTimeout(lockTimeout);
			isUpdating = false;
		}
	} else {
		return NextResponse.json(
			{ message: "Update already in progress" },
			{ status: 409 },
		);
	}
}

export async function GET(request: NextRequest) {
	// Check authorization before proceeding
	if (!(await isAuthorized(request))) {
		return new Response("Unauthorized", { status: 401 });
	}
	return handleUpdate();
}

export async function POST(request: NextRequest) {
	// Check authorization before proceeding
	if (!(await isAuthorized(request))) {
		return new Response("Unauthorized", { status: 401 });
	}
	return handleUpdate();
}
