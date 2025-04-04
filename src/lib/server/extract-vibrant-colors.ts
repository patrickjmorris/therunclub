import "server-only";
import Vibrant from "node-vibrant";
import sharp from "sharp";

export async function extractVibrantColors(
	imageUrl: string,
): Promise<string | null> {
	try {
		console.log("[extractVibrantColors] Starting process for:", imageUrl);

		// Fetch and process the image with Sharp first
		const response = await fetch(imageUrl);
		console.log(
			"[extractVibrantColors] Fetch response status:",
			response.status,
		);

		const arrayBuffer = await response.arrayBuffer();
		console.log(
			"[extractVibrantColors] Got array buffer, size:",
			arrayBuffer.byteLength,
		);

		const buffer = Buffer.from(arrayBuffer);
		console.log("[extractVibrantColors] Converted to Buffer");

		// Resize and convert to JPEG for better compatibility
		console.log("[extractVibrantColors] Starting Sharp processing");
		const processedBuffer = await sharp(buffer)
			.resize(300, 300, { fit: "inside" })
			.jpeg() // Convert to JPEG format
			.toBuffer();
		console.log("[extractVibrantColors] Completed Sharp processing");

		// Extract colors using Vibrant
		const palette = await Vibrant.from(processedBuffer).getPalette();
		console.log("[extractVibrantColors] Generated color palette");

		// Convert to array of color strings, filtering out null values
		const vibrantColor = palette.Vibrant?.hex;
		console.log("[extractVibrantColors] Selected vibrant color:", vibrantColor);

		return vibrantColor ?? "#1e3a8a";
	} catch (error: unknown) {
		console.error("[extractVibrantColors] Error:", error);
		if (error instanceof Error) {
			console.error("[extractVibrantColors] Error stack:", error.stack);
		}
		return null;
	}
}
