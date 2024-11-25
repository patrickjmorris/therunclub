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

async function handleUpdate(request: NextRequest) {
	if (isUpdating) {
		return NextResponse.json(
			{ message: "Update already in progress" },
			{ status: 409 },
		);
	}

	isUpdating = true;
	clearTimeout(lockTimeout);

	// Set a timeout to release the lock
	lockTimeout = setTimeout(() => {
		isUpdating = false;
	}, LOCK_TIMEOUT);

	try {
		// Get channelId from query parameters
		const searchParams = request.nextUrl.searchParams;
		const channelId = searchParams.get("channelId");
		const force = searchParams.get("force") === "true";

		const results = await seedVideos({
			...(channelId ? { youtubeChannelId: channelId } : {}),
			forceUpdate: force,
		});

		return NextResponse.json(
			{
				message: channelId
					? `Channel ${channelId} updated successfully`
					: "Video and channel data updated successfully",
				forced: force,
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
}

export async function GET(request: NextRequest) {
	if (!(await isAuthorized(request))) {
		return new Response("Unauthorized", { status: 401 });
	}
	return handleUpdate(request);
}

export async function POST(request: NextRequest) {
	if (!(await isAuthorized(request))) {
		return new Response("Unauthorized", { status: 401 });
	}
	return handleUpdate(request);
}
