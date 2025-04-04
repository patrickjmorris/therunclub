import Vibrant from "node-vibrant";
import sharp from "sharp";

export async function extractVibrantColors(
	imageUrl: string,
): Promise<string | null> {
	try {
		// Fetch and process the image with Sharp first
		const response = await fetch(imageUrl);
		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Resize and convert to JPEG for better compatibility
		const processedBuffer = await sharp(buffer)
			.resize(300, 300, { fit: "inside" })
			.jpeg() // Convert to JPEG format
			.toBuffer();

		// Extract colors using Vibrant
		const palette = await Vibrant.from(processedBuffer).getPalette();

		// Convert to array of color strings, filtering out null values
		const vibrantColor = palette.Vibrant?.hex;

		return vibrantColor ?? "#1e3a8a";
	} catch (error) {
		console.error("Error extracting vibrant colors:", error);
		return null;
	}
}
