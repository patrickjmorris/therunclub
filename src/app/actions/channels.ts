"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { channels } from "@/db/schema";
import { fetchChannelByIdentifier } from "@/lib/youtube-service";
import { requireRole, AuthError } from "@/lib/auth-utils";
import type { AddChannelState } from "./types";
import { processChannel } from "@/lib/services/video-service";

// Simple validation without zod
function validateChannelUrl(url: string): {
	isValid: boolean;
	message?: string;
} {
	if (!url || url.trim() === "") {
		return { isValid: false, message: "URL is required" };
	}

	// Basic pattern validation - accept handles directly
	const trimmed = url.trim();

	// If it's a direct handle (with @) or a channel ID (UC...)
	if (/^@[\w\.-]+$/.test(trimmed) || /^UC[\w-]{21,22}$/.test(trimmed)) {
		return { isValid: true };
	}

	// If it's a YouTube URL with handle or channel ID
	if (trimmed.includes("youtube.com")) {
		return { isValid: true };
	}

	// If it's just a username without @, we'll add it later, so it's valid
	if (/^[\w\.-]+$/.test(trimmed)) {
		return { isValid: true };
	}

	return {
		isValid: false,
		message:
			"Invalid YouTube channel URL or handle. Valid formats: https://youtube.com/@channelname, @channelname, or channelname",
	};
}

export const addChannel = requireRole(["admin", "editor"])(
	async (
		_prevState: AddChannelState,
		formData: FormData,
	): Promise<AddChannelState> => {
		// Get raw URL for debugging
		const rawUrl = formData.get("url") as string;

		// Handle empty form data (used for form reset)
		if (!rawUrl) {
			return {
				errors: {},
				message: undefined,
			};
		}

		console.log("Raw URL submitted:", rawUrl);

		// Simple validation
		const validation = validateChannelUrl(rawUrl);
		if (!validation.isValid) {
			return {
				errors: {
					url: [validation.message || "Invalid URL format"],
				},
				message: "Please provide a valid YouTube channel URL or handle",
			};
		}

		// Clean and normalize the input
		let processedInput = rawUrl.trim();

		// If it's a youtube URL with a handle
		if (processedInput.includes("youtube.com/@")) {
			const match = processedInput.match(/youtube\.com\/@([\w\.-]+)/i);
			if (match?.[1]) {
				processedInput = `@${match[1]}`;
				console.log("Extracted handle from URL:", processedInput);
			}
		}
		// If it's a YT URL with channel ID
		else if (processedInput.includes("youtube.com/channel/")) {
			const match = processedInput.match(
				/youtube\.com\/channel\/(UC[\w-]{21,22})/i,
			);
			if (match?.[1]) {
				processedInput = match[1];
				console.log("Extracted channel ID from URL:", processedInput);
			}
		}
		// If it's a simple username without @, add it
		else if (
			/^[\w\.-]+$/.test(processedInput) &&
			!processedInput.startsWith("UC") &&
			!processedInput.startsWith("@")
		) {
			processedInput = `@${processedInput}`;
			console.log("Added @ to username:", processedInput);
		}

		console.log("Processed input for API call:", processedInput);

		try {
			// Fetch channel data from YouTube using our identifer
			console.log("Fetching channel data for:", processedInput);
			const channelData = await fetchChannelByIdentifier(processedInput);

			if (!channelData) {
				return {
					errors: {
						_form: ["Channel not found on YouTube"],
					},
					message: "Channel not found",
				};
			}

			console.log("Channel data fetched successfully:", {
				id: channelData.id,
				title: channelData.snippet.title,
			});

			// Check if channel already exists
			const existingChannel = await db.query.channels.findFirst({
				where: (channels, { eq }) =>
					eq(channels.youtubeChannelId, channelData.id),
			});

			if (existingChannel) {
				console.log("Channel already exists:", existingChannel.id);

				// Update the channel and its videos using processChannel
				console.log("Refreshing videos for existing channel");
				console.log("Channel YouTube ID:", channelData.id);
				console.log("Channel database ID:", existingChannel.id);

				// processChannel takes YouTube channel ID
				const processResult = await processChannel(channelData.id, {
					forceUpdate: true,
					maxVideos: 15, // Limit to 15 most recent videos for the refresh
				});

				if (processResult.status === "error") {
					console.error("Error refreshing videos:", processResult.error);
					return {
						errors: {
							_form: ["Failed to refresh channel videos"],
						},
						message: "Channel already exists. Unable to refresh videos.",
					};
				}

				// Count actually updated videos
				const updatedCount =
					processResult.status === "success"
						? processResult.videos.filter((v) => v.status === "updated").length
						: 0;

				return {
					message: `Channel "${existingChannel.title}" already exists. ${updatedCount} videos refreshed successfully.`,
				};
			}

			// Insert channel to database
			const [newChannel] = await db
				.insert(channels)
				.values({
					youtubeChannelId: channelData.id,
					title: channelData.snippet.title,
					description: channelData.snippet.description,
					customUrl: channelData.snippet.customUrl,
					publishedAt: new Date(channelData.snippet.publishedAt),
					thumbnailUrl:
						channelData.snippet.thumbnails.high?.url ||
						channelData.snippet.thumbnails.medium?.url ||
						channelData.snippet.thumbnails.default?.url,
					subscriberCount: channelData.statistics.subscriberCount,
					videoCount: channelData.statistics.videoCount,
					viewCount: channelData.statistics.viewCount,
					country: channelData.snippet.country,
					uploadsPlaylistId:
						channelData.contentDetails.relatedPlaylists.uploads,
					importType: "full_channel", // Default to full channel import
				})
				.returning();

			console.log("New channel created:", newChannel.id);
			console.log("New channel YouTube ID:", channelData.id);

			// Process videos for the channel - use the YouTube channel ID, not the database ID
			console.log("Importing videos for new channel");
			const processResult = await processChannel(channelData.id, {
				maxVideos: 20, // Import up to 20 most recent videos for new channels
				forceUpdate: true, // Force update for new channels
			});

			let videoMessage = "";
			let videoCount = 0;

			if (processResult.status === "success") {
				videoCount = processResult.videos.filter(
					(v) => v.status === "updated",
				).length;
				videoMessage = `${videoCount} videos imported.`;
				console.log(`Imported ${videoCount} videos for the channel`);
				console.log(
					"Video results:",
					processResult.videos.map((v) => v.status),
				);
			} else if (processResult.status === "error") {
				console.error("Error importing videos:", processResult.error);
				videoMessage = "Could not import videos. Please try again later.";
			} else if (processResult.status === "cached") {
				videoMessage = "Channel information cached. No videos imported.";
				console.log("Using cached channel data - no videos imported");
			}

			// Revalidate cache
			revalidatePath("/videos");
			revalidatePath("/channels");
			revalidatePath("/dashboard/videos");

			return {
				message: `Channel "${newChannel.title}" added successfully! ${videoMessage}`,
			};
		} catch (error) {
			console.error("Error adding channel:", error);
			if (error instanceof AuthError) {
				return {
					errors: {
						_form: [error.message],
					},
					message: error.message,
				};
			}
			return {
				errors: {
					_form: ["An unexpected error occurred"],
				},
				message: "An unexpected error occurred",
			};
		}
	},
);
