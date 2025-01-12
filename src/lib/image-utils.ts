import smartcrop from "smartcrop-sharp";
import sharp from "sharp";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "./supabase-admin";
import { nanoid } from "nanoid";

interface CropResult {
	url: string;
	width: number;
	height: number;
}

export async function smartCropImage(
	imageUrl: string,
	targetSize: number,
	isScript = false,
): Promise<CropResult | null> {
	try {
		// Fetch the image
		const response = await fetch(imageUrl);
		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Analyze the image with smartcrop
		const result = await smartcrop.crop(buffer, {
			width: targetSize,
			height: targetSize,
			boost: [
				{
					x: 0,
					y: 0,
					width: 1,
					height: 0.5,
					weight: 1.5, // Boost importance of upper half for athlete faces
				},
			],
		});
		const crop = result.topCrop;

		// Process the image with sharp
		const processedImage = await sharp(buffer)
			.extract({
				width: crop.width,
				height: crop.height,
				left: crop.x,
				top: crop.y,
			})
			.resize(targetSize, targetSize)
			.webp({ quality: 85 }) // Convert to WebP
			.toBuffer();

		// Upload to Supabase Storage
		const fileName = `athletes/${nanoid()}.webp`;
		const supabase = isScript ? supabaseAdmin : await createClient();

		const { data: uploadData, error: uploadError } = await supabase.storage
			.from("athlete-images")
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
		} = supabase.storage.from("athlete-images").getPublicUrl(fileName);

		return {
			url: publicUrl,
			width: targetSize,
			height: targetSize,
		};
	} catch (error) {
		console.error("Error processing image:", error);
		return null;
	}
}

export async function processAthleteImage(
	imageUrl: string,
	isScript = false,
): Promise<string | null> {
	// Process for square profile image (800x800)
	const result = await smartCropImage(imageUrl, 800, isScript);
	return result?.url || null;
}
