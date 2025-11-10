import { supabaseAdmin } from "@/lib/supabase-admin";
import sharp from "sharp";
import { nanoid } from "nanoid";

/**
 * Downloads an image, optimizes it, uploads it to Supabase storage,
 * and returns the public URL.
 */
export async function optimizeImage(
	imageUrl: string,
	targetSize: number,
	prefix: string,
	entityId?: string,
): Promise<string | null> {
	try {
		// Fetch the image
		const response = await fetch(imageUrl);
		if (!response.ok) {
			console.error(
				`Failed to fetch image: ${response.status} ${response.statusText} for URL: ${imageUrl}`,
			);
			return null;
		}
		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Process the image with sharp
		const processedImage = await sharp(buffer)
			.resize(targetSize, targetSize, {
				fit: "contain",
				background: { r: 255, g: 255, b: 255, alpha: 0 },
			})
			.webp({ quality: 85 })
			.toBuffer();

		// Upload to Supabase Storage with deterministic filename if entityId provided
		const fileName = entityId
			? `${prefix}/${entityId}.webp`
			: `${prefix}/${nanoid()}.webp`;

		const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
			.from("content-images")
			.upload(fileName, processedImage, {
				contentType: "image/webp",
				upsert: true,
			});

		if (uploadError) {
			console.error("Error uploading to Supabase:", uploadError);
			return null;
		}

		// Get the public URL
		const {
			data: { publicUrl },
		} = supabaseAdmin.storage.from("content-images").getPublicUrl(fileName);

		return publicUrl;
	} catch (error) {
		console.error(`Error processing image from URL: ${imageUrl}`, error);
		return null;
	}
}
