import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { updateVideos } from "@/lib/services/video-service";
import { updatePodcastData } from "@/db";
import { updateChannelColors } from "@/scripts/update-channel-colors";

type ContentType = "videos" | "podcasts" | "channel-colors" | "channel-videos";

const isUpdating = {
	videos: false,
	podcasts: false,
	"channel-colors": false,
	"channel-videos": false,
};

const LOCK_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const lockTimeouts: { [key in ContentType]?: NodeJS.Timeout } = {};

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
	if (!(await isAuthorized(request))) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	if (isUpdating[type]) {
		return NextResponse.json(
			{ message: `${type} update already in progress` },
			{ status: 409 },
		);
	}

	try {
		isUpdating[type] = true;

		// Set a timeout to reset the lock
		lockTimeouts[type] = setTimeout(() => {
			isUpdating[type] = false;
		}, LOCK_TIMEOUT);

		if (type === "videos") {
			const updateStrategy = request.nextUrl.searchParams.get("updateStrategy");
			const minHoursSinceUpdate = parseInt(
				request.nextUrl.searchParams.get("minHoursSinceUpdate") || "24",
				10,
			);

			const results = await updateVideos({
				forceUpdate: true,
				videosPerChannel: Infinity,
				updateByLastUpdated: updateStrategy === "lastUpdated",
				minHoursSinceUpdate,
			});

			return NextResponse.json({
				message: "Videos updated successfully",
				results: {
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

		if (type === "channel-videos") {
			const channelId = request.nextUrl.searchParams.get("channelId");
			if (!channelId) {
				return NextResponse.json(
					{ message: "channelId parameter is required" },
					{ status: 400 },
				);
			}

			const results = await updateVideos({
				youtubeChannelId: channelId,
				forceUpdate: true,
				videosPerChannel: Infinity,
			});

			return NextResponse.json({
				message: "Channel videos updated successfully",
				results: {
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
			const results = await updateChannelColors();
			return NextResponse.json({
				message: "Channel colors updated successfully",
				results,
			});
		}

		if (type === "podcasts") {
			const results = await updatePodcastData();
			const successfulUpdates = results.filter(
				(result) => result.success,
			).length;
			const failedUpdates = results.filter((result) => !result.success).length;

			return NextResponse.json({
				message: "Podcasts updated successfully",
				results: {
					total: results.length,
					successful: successfulUpdates,
					failed: failedUpdates,
				},
			});
		}

		return NextResponse.json(
			{ message: "Invalid content type" },
			{ status: 400 },
		);
	} catch (error) {
		console.error(`Error updating ${type}:`, error);
		return NextResponse.json(
			{ message: `Error updating ${type}`, error },
			{ status: 500 },
		);
	} finally {
		isUpdating[type] = false;
		if (lockTimeouts[type]) {
			clearTimeout(lockTimeouts[type]);
			delete lockTimeouts[type];
		}
	}
}

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const type = searchParams.get("type") as ContentType;

	if (
		!type ||
		!["videos", "podcasts", "channel-colors", "channel-videos"].includes(type)
	) {
		return NextResponse.json(
			{
				message:
					"Invalid content type. Must be 'videos', 'podcasts', 'channel-colors', or 'channel-videos'",
			},
			{ status: 400 },
		);
	}

	return handleUpdate(request, type);
}

export { GET as POST };
