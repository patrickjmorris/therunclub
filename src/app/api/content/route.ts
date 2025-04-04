import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { updateVideos } from "@/lib/services/video-service";
import { updatePodcastData } from "@/lib/podcast-service";
import { updateChannelColors } from "@/lib/server/channel-colors";
import {
	importAthleteData,
	processEpisodeAthletes,
	updateExistingAthletes,
} from "@/lib/services/athlete-service";
import { db } from "@/db/client";
import { episodes, podcasts, videos, channels, athletes } from "@/db/schema";
import { and, sql, not, eq, desc } from "drizzle-orm";

type ContentType =
	| "videos"
	| "podcasts"
	| "channel-colors"
	| "channel-videos"
	| "athletes"
	| "athlete-detection"
	| "tagging";

const isUpdating = {
	videos: false,
	podcasts: false,
	"channel-colors": false,
	"channel-videos": false,
	athletes: false,
	"athlete-detection": false,
	tagging: false,
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

// Helper function to update the updated_at column for a specific table
async function updateTimestamp(type: ContentType) {
	try {
		switch (type) {
			case "podcasts":
				// Update all podcasts' updated_at column
				await db.execute(
					sql`UPDATE ${podcasts} SET updated_at = NOW() WHERE TRUE`,
				);
				break;
			case "videos":
			case "channel-videos":
				// Update all videos' updated_at column
				await db.execute(
					sql`UPDATE ${videos} SET updated_at = NOW() WHERE TRUE`,
				);
				break;
			case "channel-colors":
				// Update all channels' updated_at column
				await db.execute(
					sql`UPDATE ${channels} SET updated_at = NOW() WHERE TRUE`,
				);
				break;
			case "athletes":
				// Update all athletes' updated_at column
				await db.execute(
					sql`UPDATE ${athletes} SET updated_at = NOW() WHERE TRUE`,
				);
				break;
			case "athlete-detection":
				// Update all episodes' updated_at column
				await db.execute(
					sql`UPDATE ${episodes} SET updated_at = NOW() WHERE TRUE`,
				);
				break;
			default:
				break;
		}
	} catch (error) {
		console.error(`Error updating timestamp for ${type}:`, error);
	}
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

		// Update the updated_at column for the corresponding table
		await updateTimestamp(type);

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
				const importTypeFilter = request.nextUrl.searchParams.get(
					"importType",
				) as "full_channel" | "selected_videos" | "none" | undefined;

				console.log("API Request parameters:", {
					updateStrategy,
					minHoursSinceUpdate,
					channelLimit,
					videosPerChannel,
					maxVideos,
					randomSample,
					importTypeFilter,
				});

				const results = await updateVideos({
					forceUpdate: true,
					limit: channelLimit,
					videosPerChannel,
					maxVideos,
					updateByLastUpdated: updateStrategy === "lastUpdated",
					minHoursSinceUpdate,
					randomSample,
					importTypeFilter: importTypeFilter || "full_channel", // Default to full_channel if not specified
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
						importType: importTypeFilter || "full_channel",
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

				console.log("[Athlete Detection] Starting detection with params:", {
					minHoursSinceUpdate,
					batchSize,
				});

				// Get total count of unprocessed episodes
				const [totalCount] = await db
					.select({ count: sql<number>`count(*)` })
					.from(episodes)
					.where(
						and(
							sql`${episodes.updatedAt} >= NOW() - (${minHoursSinceUpdate} * INTERVAL '1 hour')`,
							not(eq(episodes.athleteMentionsProcessed, true)),
						),
					);

				// Query for recently updated episodes
				const recentEpisodes = await db
					.select({
						id: episodes.id,
						title: episodes.title,
					})
					.from(episodes)
					.where(
						and(
							sql`${episodes.updatedAt} >= NOW() - (${minHoursSinceUpdate} * INTERVAL '1 hour')`,
							not(eq(episodes.athleteMentionsProcessed, true)),
						),
					)
					.orderBy(desc(episodes.updatedAt))
					.limit(batchSize);

				console.log("[Athlete Detection] Found episodes:", {
					total: totalCount.count,
					processing: recentEpisodes.length,
				});

				const results = {
					processed: 0,
					errors: 0,
					totalEpisodes: recentEpisodes.length,
					remainingEpisodes: totalCount.count - recentEpisodes.length,
					errorDetails: [] as { id: string; error: string }[],
					athleteMatches: {
						total: 0,
						title: 0,
						content: 0,
					},
				};

				// Process each episode
				for (const episode of recentEpisodes) {
					try {
						console.log(
							`[Athlete Detection] Processing episode: ${episode.title} (${episode.id})`,
						);
						const matches = await processEpisodeAthletes(episode.id);

						results.processed++;
						results.athleteMatches.title += matches.titleMatches;
						results.athleteMatches.content += matches.contentMatches;
						results.athleteMatches.total +=
							matches.titleMatches + matches.contentMatches;

						console.log("[Athlete Detection] Episode processed:", {
							id: episode.id,
							titleMatches: matches.titleMatches,
							contentMatches: matches.contentMatches,
						});
					} catch (error) {
						console.error(
							`[Athlete Detection] Error processing episode ${episode.id}:`,
							error,
						);
						results.errors++;
						results.errorDetails.push({
							id: episode.id,
							error: error instanceof Error ? error.message : String(error),
						});
					}
				}

				// Calculate success rate
				const successRate = results.processed
					? ((results.processed - results.errors) / results.processed) * 100
					: 0;

				console.log("[Athlete Detection] Processing complete:", {
					processed: results.processed,
					errors: results.errors,
					successRate: `${successRate.toFixed(1)}%`,
					athleteMatches: results.athleteMatches,
				});

				return NextResponse.json({
					message: "Athlete detection completed successfully",
					results: {
						...results,
						successRate: `${successRate.toFixed(1)}%`,
					},
				});
			} catch (error) {
				console.error("[Athlete Detection] Error in batch processing:", error);
				return NextResponse.json(
					{
						message: "Error in athlete detection",
						error: error instanceof Error ? error.message : String(error),
					},
					{ status: 500 },
				);
			}
		} else if (type === "tagging") {
			// This is handled by the dedicated /api/content/video endpoint
			return NextResponse.json(
				{
					message:
						"For tagging imports, use the /api/content/video endpoint with a POST request",
					example: {
						method: "POST",
						url: "/api/content/video",
						body: {
							videoUrl: "https://www.youtube.com/watch?v=VIDEO_ID",
							forceUpdate: false,
						},
					},
				},
				{ status: 400 },
			);
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
			"tagging",
		].includes(type)
	) {
		return NextResponse.json(
			{
				message:
					"Invalid content type. Must be 'videos', 'podcasts', 'channel-colors', 'channel-videos', 'athletes', 'athlete-detection', 'individual-video', or 'tagging'",
			},
			{ status: 400 },
		);
	}

	return handleUpdate(request, type);
}

export { GET as POST };
