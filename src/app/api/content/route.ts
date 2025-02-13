import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { updateVideos } from "@/lib/services/video-service";
import { updatePodcastData } from "@/lib/podcast-service";
import { updateChannelColors } from "../../../../scripts/update-channel-colors";
import {
	importAthleteData,
	processEpisodeAthletes,
	updateExistingAthletes,
} from "@/lib/services/athlete-service";
import { db } from "@/db/client";
import { episodes } from "@/db/schema";
import { and, sql, not, eq, desc } from "drizzle-orm";

type ContentType =
	| "videos"
	| "podcasts"
	| "channel-colors"
	| "channel-videos"
	| "athletes"
	| "athlete-detection";

const isUpdating = {
	videos: false,
	podcasts: false,
	"channel-colors": false,
	"channel-videos": false,
	athletes: false,
	"athlete-detection": false,
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
			try {
				const updateStrategy =
					request.nextUrl.searchParams.get("updateStrategy");
				const minHoursSinceUpdate = parseInt(
					request.nextUrl.searchParams.get("minHoursSinceUpdate") || "24",
					10,
				);
				const channelLimit = parseInt(
					request.nextUrl.searchParams.get("channelLimit") || "50",
					10,
				);
				const videosPerChannel = parseInt(
					request.nextUrl.searchParams.get("videosPerChannel") || "10",
					10,
				);
				const maxVideos = parseInt(
					request.nextUrl.searchParams.get("maxVideos") ||
						String(videosPerChannel),
					10,
				);
				const randomSample =
					request.nextUrl.searchParams.get("randomSample") === "true";

				console.log("API Request parameters:", {
					updateStrategy,
					minHoursSinceUpdate,
					channelLimit,
					videosPerChannel,
					maxVideos,
					randomSample,
				});

				const results = await updateVideos({
					forceUpdate: true,
					limit: channelLimit,
					videosPerChannel,
					maxVideos,
					updateByLastUpdated: updateStrategy === "lastUpdated",
					minHoursSinceUpdate,
					randomSample,
				});

				return NextResponse.json({
					message: "Videos updated successfully",
					results: {
						channels: {
							limit: channelLimit,
							processed:
								results.channels.updated +
								results.channels.cached +
								results.channels.failed,
						},
						videos: {
							perChannel: videosPerChannel,
							maxVideos,
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
			} catch (error) {
				console.error("Detailed error in video update:", error);

				const errorResponse = {
					message: "Error updating videos",
					error: {
						name: error instanceof Error ? error.name : "Unknown Error",
						message: error instanceof Error ? error.message : String(error),
						stack:
							error instanceof Error && process.env.NODE_ENV === "development"
								? error.stack
								: undefined,
					},
				};

				return NextResponse.json(errorResponse, { status: 500 });
			}
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
			const minHoursSinceUpdate = parseInt(
				request.nextUrl.searchParams.get("minHoursSinceUpdate") || "24",
				10,
			);
			const limit = parseInt(
				request.nextUrl.searchParams.get("limit") || "50",
				10,
			);
			const randomSample =
				request.nextUrl.searchParams.get("randomSample") === "true";

			console.log("Podcast update parameters:", {
				minHoursSinceUpdate,
				limit,
				randomSample,
			});

			const results = await updatePodcastData({
				minHoursSinceUpdate,
				limit,
				randomSample,
			});
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
					params: {
						minHoursSinceUpdate,
						limit,
						randomSample,
					},
				},
			});
		}

		if (type === "athletes") {
			try {
				const limit = parseInt(
					request.nextUrl.searchParams.get("limit") || "50",
					10,
				);
				const updateMode = request.nextUrl.searchParams.get("mode");

				const results =
					updateMode === "existing"
						? await updateExistingAthletes(limit)
						: await importAthleteData(limit);

				return NextResponse.json({
					message: "Athletes updated successfully",
					results,
				});
			} catch (error) {
				console.error("Error updating athletes:", error);
				return NextResponse.json(
					{
						message: "Error updating athletes",
						error: error instanceof Error ? error.message : String(error),
					},
					{ status: 500 },
				);
			}
		}

		if (type === "athlete-detection") {
			try {
				// Get episodes updated in the last 24 hours by default
				const minHoursSinceUpdate = parseInt(
					request.nextUrl.searchParams.get("minHoursSinceUpdate") || "24",
					10,
				);
				const batchSize = parseInt(
					request.nextUrl.searchParams.get("batchSize") || "10",
					10,
				);

				// Query for recently updated episodes
				const recentEpisodes = await db
					.select({ id: episodes.id })
					.from(episodes)
					.where(
						and(
							sql`${episodes.updatedAt} >= NOW() - (${minHoursSinceUpdate} * INTERVAL '1 hour')`,
							not(eq(episodes.athleteMentionsProcessed, true)),
						),
					)
					.orderBy(desc(episodes.updatedAt))
					.limit(batchSize);

				const results = {
					processed: 0,
					errors: 0,
					totalEpisodes: recentEpisodes.length,
				};

				// Process each episode
				for (const episode of recentEpisodes) {
					try {
						await processEpisodeAthletes(episode.id);
						results.processed++;
					} catch (error) {
						console.error(`Error processing episode ${episode.id}:`, error);
						results.errors++;
					}
				}

				return NextResponse.json({
					message: "Athlete detection completed successfully",
					results,
				});
			} catch (error) {
				console.error("Error in athlete detection:", error);
				return NextResponse.json(
					{
						message: "Error in athlete detection",
						error: error instanceof Error ? error.message : String(error),
					},
					{ status: 500 },
				);
			}
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
		![
			"videos",
			"podcasts",
			"channel-colors",
			"channel-videos",
			"athletes",
			"athlete-detection",
		].includes(type)
	) {
		return NextResponse.json(
			{
				message:
					"Invalid content type. Must be 'videos', 'podcasts', 'channel-colors', 'channel-videos', 'athletes', or 'athlete-detection'",
			},
			{ status: 400 },
		);
	}

	return handleUpdate(request, type);
}

export { GET as POST };
