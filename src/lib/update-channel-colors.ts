import { db } from "@/db/client";
import { channels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { extractVibrantColors } from "./extract-vibrant-colors";

export async function updateChannelColor(
	channelId: string,
	thumbnailUrl: string,
) {
	try {
		const vibrantColor = await extractVibrantColors(thumbnailUrl);

		if (vibrantColor) {
			await db
				.update(channels)
				.set({ vibrantColor })
				.where(eq(channels.id, channelId));

			return vibrantColor;
		}
	} catch (error) {
		console.error("Error updating channel color:", error);
	}

	return null;
}
