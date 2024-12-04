import { z } from "zod";
import { processChannel } from "@/lib/services/video-service";
import { revalidatePath } from "next/cache";

const addChannelSchema = z.object({
	youtubeChannelId: z.string().min(1, "Channel ID is required"),
});

export type AddChannelFormData = z.infer<typeof addChannelSchema>;

export async function addChannel(formData: AddChannelFormData) {
	try {
		// Validate form data
		const validatedData = addChannelSchema.parse(formData);

		// Process the channel with unlimited videos for initial import
		const result = await processChannel(validatedData.youtubeChannelId, {
			videosPerChannel: Infinity,
			forceUpdate: true,
		});

		if (result.status === "error") {
			return {
				success: false,
				error: "Failed to add channel",
			};
		}

		if (result.status === "not_found") {
			return {
				success: false,
				error: "Channel not found. Please check the channel ID and try again.",
			};
		}

		// Revalidate the videos and dashboard pages
		revalidatePath("/videos");
		revalidatePath("/dashboard");

		return {
			success: true,
			data: result.data,
		};
	} catch (error) {
		console.error("Error adding channel:", error);
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.errors[0].message,
			};
		}
		return {
			success: false,
			error: "Failed to add channel. Please try again.",
		};
	}
}
