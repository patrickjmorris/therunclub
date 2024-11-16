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

		// Resize image for better performance
		const resizedBuffer = await sharp(buffer)
			.resize(300, 300, { fit: "inside" })
			.toBuffer();

		// Extract colors using Vibrant
		const palette = await Vibrant.from(resizedBuffer).getPalette();

		// Convert to array of color strings, filtering out null values
		const vibrantColor = palette.Vibrant?.hex;

		return vibrantColor ?? "#1e3a8a";
	} catch (error) {
		console.error("Error extracting vibrant colors:", error);
		return null;
	}
}
