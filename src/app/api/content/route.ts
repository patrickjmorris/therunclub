import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { seedVideos } from "@/db/seed-videos";
import { seedPodcasts } from "@/db/seed";

type ContentType = "videos" | "podcasts";

const isUpdating = {
	videos: false,
	podcasts: false,
};
const LOCK_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const lockTimeouts: { [key in ContentType]?: NodeJS.Timeout } = {};

// Updated authorization check to handle both API key and cron secret
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

async function handleUpdate(request: NextRequest, type: ContentType) {
	if (isUpdating[type]) {
		return NextResponse.json(
			{ message: `${type} update already in progress` },
			{ status: 409 },
		);
	}

	if (!(await isAuthorized(request))) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	try {
		isUpdating[type] = true;

		// Clear any existing timeout
		if (lockTimeouts[type]) {
			clearTimeout(lockTimeouts[type]);
		}

		// Set a new timeout
		lockTimeouts[type] = setTimeout(() => {
			isUpdating[type] = false;
		}, LOCK_TIMEOUT);

		// Perform the update based on content type
		if (type === "videos") {
			await seedVideos({
				limit: 50,
				videosPerChannel: 10,
				forceUpdate: true,
			});
		} else if (type === "podcasts") {
			await seedPodcasts();
		}

		return NextResponse.json({ message: `${type} updated successfully` });
	} catch (error) {
		console.error(`Error updating ${type}:`, error);
		return NextResponse.json(
			{ message: `Error updating ${type}` },
			{ status: 500 },
		);
	} finally {
		isUpdating[type] = false;
		if (lockTimeouts[type]) {
			clearTimeout(lockTimeouts[type]);
		}
	}
}

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const type = searchParams.get("type") as ContentType;

	if (!type || !["videos", "podcasts"].includes(type)) {
		return NextResponse.json(
			{ message: "Invalid content type. Must be 'videos' or 'podcasts'" },
			{ status: 400 },
		);
	}

	return handleUpdate(request, type);
}

export async function POST(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const type = searchParams.get("type") as ContentType;

	if (!type || !["videos", "podcasts"].includes(type)) {
		return NextResponse.json(
			{ message: "Invalid content type. Must be 'videos' or 'podcasts'" },
			{ status: 400 },
		);
	}

	return handleUpdate(request, type);
}
