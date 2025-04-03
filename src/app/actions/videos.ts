"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AddVideoState } from "./types";
import { addVideoSchema } from "./validation";
import { requireRole, AuthError } from "@/lib/auth-utils";
import {
	importIndividualVideo,
	extractYouTubeVideoId,
} from "@/lib/services/video-service";

// Schema for validating video URL and force update flag
const videoSchema = z.object({
	url: z.string().min(1, "URL is required"),
	forceUpdate: z.boolean().default(false),
});

// Simple validation without zod
function validateVideoUrl(url: string): {
	isValid: boolean;
	message?: string;
} {
	if (!url || url.trim() === "") {
		return { isValid: false, message: "URL is required" };
	}

	const videoId = extractYouTubeVideoId(url);
	if (!videoId) {
		return {
			isValid: false,
			message: "Could not extract YouTube video ID. Please check the URL.",
		};
	}

	return { isValid: true };
}

export const addVideo = requireRole(["admin", "editor"])(
	async (
		_prevState: AddVideoState,
		formData: FormData,
	): Promise<AddVideoState> => {
		const rawUrl = formData.get("url");

		if (!(rawUrl instanceof FormData) && !rawUrl) {
			// Empty form data was submitted - used for resetting the form
			return { errors: {}, message: "" };
		}

		// Parse formData using the zod schema
		const validatedFields = videoSchema.safeParse({
			url: formData.get("url"),
			forceUpdate: formData.get("forceUpdate") === "on",
		});

		if (!validatedFields.success) {
			return {
				errors: {
					url: validatedFields.error.flatten().fieldErrors.url,
					_form: validatedFields.error.flatten().formErrors,
				},
				message: "Failed to validate input",
			};
		}

		try {
			// Basic validation
			const validation = validateVideoUrl(validatedFields.data.url);
			if (!validation.isValid) {
				return {
					errors: {
						url: [validation.message || "Invalid URL format"],
					},
					message: "Please provide a valid YouTube video URL",
				};
			}

			// Get force update option
			const forceUpdate = formData.get("forceUpdate") === "on";
			console.log("Import video with force update:", forceUpdate);

			// Process the video and get results
			console.log("Importing video from URL:", validatedFields.data.url);
			const result = await importIndividualVideo(validatedFields.data.url, {
				forceUpdate,
			});

			if (result.status === "error") {
				console.error("Error importing video:", result.error);
				return {
					errors: {
						_form: [result.message || "Failed to import video"],
					},
					message: "An error occurred while importing the video",
				};
			}

			if (result.status === "not_found") {
				return {
					errors: {
						url: ["Video not found on YouTube"],
					},
					message: "Video not found",
				};
			}

			if (result.status === "invalid_input") {
				return {
					errors: {
						url: ["Invalid YouTube URL"],
					},
					message: "Could not extract a valid YouTube video ID from the URL",
				};
			}

			// Success - detailed message about what happened
			console.log("Video imported successfully:", result.video?.title);
			const wasExisting = result.message?.includes("existing");
			const action = wasExisting ? "updated" : "imported";
			const message = `Video "${result.video?.title}" ${action} successfully.`;

			// Revalidate cache
			revalidatePath("/videos");
			revalidatePath("/dashboard/videos");

			// Return success state
			return {
				message,
			};
		} catch (error) {
			console.error("Error importing video:", error);
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
