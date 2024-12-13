import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { updateVideos } from "@/lib/services/video-service";
import { updatePodcastData } from "@/db";
import { updateChannelColors } from "@/scripts/update-channel-colors";

type ContentType = "videos" | "podcasts" | "channel-colors";

const isUpdating = {
	videos: false,
	podcasts: false,
	"channel-colors": false,
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
			const results = await updateVideos({
				limit: 50,
				videosPerChannel: 10,
				forceUpdate: false,
			});

			return NextResponse.json({
				message: "Videos updated successfully",
				results: {
					channels: {
						total:
							results.channels.updated +
							results.channels.cached +
							results.channels.failed,
						updated: results.channels.updated,
						cached: results.channels.cached,
						failed: results.channels.failed,
					},
					videos: {
						total:
							results.videos.updated +
							results.videos.cached +
							results.videos.failed,
						updated: results.videos.updated,
						cached: results.videos.cached,
						failed: results.videos.failed,
					},
				},
			});
		}

		if (type === "channel-colors") {
			await updateChannelColors();
			return NextResponse.json({
				message: "Channel colors updated successfully",
			});
		}

		// Handle podcast updates
		const results = await updatePodcastData();
		const successfulUpdates = results.filter(
			(r) => r.success && (r.episodesUpdated ?? 0) > 0,
		).length;
		const skippedUpdates = results.filter(
			(r) => r.success && r.skippedReason,
		).length;
		const failedUpdates = results.filter((r) => !r.success).length;

		return NextResponse.json({
			message: "Podcasts updated successfully",
			results: {
				total: results.length,
				updated: successfulUpdates,
				skipped: skippedUpdates,
				failed: failedUpdates,
			},
		});
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

	if (!type || !["videos", "podcasts", "channel-colors"].includes(type)) {
		return NextResponse.json(
			{
				message:
					"Invalid content type. Must be 'videos', 'podcasts', or 'channel-colors'",
			},
			{ status: 400 },
		);
	}

	return handleUpdate(request, type);
}

export async function POST(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const type = searchParams.get("type") as ContentType;

	if (!type || !["videos", "podcasts", "channel-colors"].includes(type)) {
		return NextResponse.json(
			{
				message:
					"Invalid content type. Must be 'videos', 'podcasts', or 'channel-colors'",
			},
			{ status: 400 },
		);
	}

	return handleUpdate(request, type);
}
