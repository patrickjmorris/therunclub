"use server";

import { z } from "zod";
import { addNewChannel } from "@/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AddChannelState } from "./types";
import { addChannelSchema } from "./validation";
import { requireRole, AuthError } from "@/lib/auth-utils";

// YouTube URL parsing patterns
const YOUTUBE_URL_PATTERNS = {
	CHANNEL_ID: /^UC[\w-]{21}[AQgw]$/,
	CHANNEL_URL:
		/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel|c)\/([^\/\n\s]+)/,
	CUSTOM_URL: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(@[^\/\n\s]+)/,
	LEGACY_USER: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/user\/([^\/\n\s]+)/,
};

async function getChannelId(url: string): Promise<string | null> {
	// If it's already a channel ID, return it
	if (YOUTUBE_URL_PATTERNS.CHANNEL_ID.test(url)) {
		return url;
	}

	// Extract channel identifier from URL
	let channelIdentifier: string | null = null;
	let apiEndpoint: string | null = null;

	if (YOUTUBE_URL_PATTERNS.CHANNEL_URL.test(url)) {
		channelIdentifier =
			url.match(YOUTUBE_URL_PATTERNS.CHANNEL_URL)?.[1] ?? null;
		if (channelIdentifier) return channelIdentifier;
	}

	if (YOUTUBE_URL_PATTERNS.CUSTOM_URL.test(url)) {
		channelIdentifier = url.match(YOUTUBE_URL_PATTERNS.CUSTOM_URL)?.[1] ?? null;
		if (channelIdentifier) {
			apiEndpoint = `channels?part=id&forHandle=${channelIdentifier.substring(
				1,
			)}`;
		}
	}

	if (YOUTUBE_URL_PATTERNS.LEGACY_USER.test(url)) {
		channelIdentifier =
			url.match(YOUTUBE_URL_PATTERNS.LEGACY_USER)?.[1] ?? null;
		if (channelIdentifier) {
			apiEndpoint = `channels?part=id&forUsername=${channelIdentifier}`;
		}
	}

	if (!apiEndpoint) {
		return null;
	}

	try {
		const response = await fetch(
			`https://www.googleapis.com/youtube/v3/${apiEndpoint}&key=${process.env.YOUTUBE_API_KEY}`,
		);
		const data = await response.json();

		if (data.items && data.items.length > 0) {
			return data.items[0].id;
		}
	} catch (error) {
		console.error("Error fetching channel ID:", error);
	}

	return null;
}

export const addChannel = requireRole(["admin", "editor"])(
	async (
		_prevState: AddChannelState,
		formData: FormData,
	): Promise<AddChannelState> => {
		const validatedFields = addChannelSchema.safeParse({
			url: formData.get("url"),
		});

		if (!validatedFields.success) {
			return {
				errors: validatedFields.error.flatten().fieldErrors,
				message: "Invalid YouTube URL",
			};
		}

		try {
			// Get channel ID from URL
			const channelId = await getChannelId(validatedFields.data.url);

			if (!channelId) {
				return {
					errors: {
						_form: ["Could not find YouTube channel. Please check the URL."],
					},
					message: "Invalid YouTube channel URL",
				};
			}

			const result = await addNewChannel(channelId);

			if (!result.success || !result.channel) {
				return {
					errors: {
						_form: [result.error || "Failed to add channel"],
					},
					message: "Failed to add channel",
				};
			}

			revalidatePath("/videos");
			return {
				message: "Channel added successfully!",
				redirect: `/videos/channels/${result.channel.id}`,
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
