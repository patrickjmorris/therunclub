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

export async function optimizeImage(
	imageUrl: string,
	targetSize: number,
	prefix: string,
	entityId?: string,
): Promise<string | null> {
	try {
		// Validate image URL
		if (!imageUrl || !imageUrl.trim()) {
			console.log("[IMAGE] Skipping optimization: Empty image URL");
			return null;
		}

		// Normalize URL to ensure it's valid
		let normalizedUrl = imageUrl;
		try {
			normalizedUrl = new URL(imageUrl).toString();
		} catch (urlError) {
			console.error("[IMAGE] Invalid image URL:", imageUrl, urlError);
			return null;
		}

		console.log(`[IMAGE] Attempting to fetch image from: ${normalizedUrl}`);

		// Set up fetch with AbortController for timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

		// Fetch the image with timeout
		const response = await fetch(normalizedUrl, {
			signal: controller.signal,
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; TheRunClubBot/1.0)",
			},
		});

		// Clear the timeout
		clearTimeout(timeoutId);

		// Check response status
		if (!response.ok) {
			console.error(
				`[IMAGE] Failed to fetch image: HTTP ${response.status} - ${response.statusText}`,
			);
			return null;
		}

		// Verify content type is an image
		const contentType = response.headers.get("content-type");
		if (!contentType?.includes("image/")) {
			// Check if it's an HTML response
			if (contentType?.includes("text/html")) {
				const text = await response.text();
				const preview = text.substring(0, 100).replace(/\n/g, "");
				console.error(
					`[IMAGE] Received HTML instead of image: ${normalizedUrl}, Preview: ${preview}...`,
				);
			} else {
				console.error(
					`[IMAGE] Unexpected content type: ${contentType} for URL: ${normalizedUrl}`,
				);
			}
			return null;
		}

		// Log successful fetch
		console.log(`[IMAGE] Successfully fetched image from: ${normalizedUrl}`);

		const arrayBuffer = await response.arrayBuffer();
		// Verify we actually got data
		if (arrayBuffer.byteLength === 0) {
			console.error(`[IMAGE] Received empty image data from: ${normalizedUrl}`);
			return null;
		}

		const buffer = Buffer.from(arrayBuffer);

		// Process the image with sharp
		try {
			const processedImage = await sharp(buffer)
				.resize(targetSize, targetSize, {
					fit: "contain",
					background: { r: 255, g: 255, b: 255, alpha: 0 },
				})
				.webp({ quality: 85 })
				.toBuffer();

			console.log(`[IMAGE] Successfully processed image: ${normalizedUrl}`);

			// Upload to Supabase Storage with deterministic filename if entityId provided
			const fileName = entityId
				? `${prefix}/${entityId}.webp`
				: `${prefix}/${nanoid()}.webp`;
			const supabase = supabaseAdmin;

			const { data: uploadData, error: uploadError } = await supabase.storage
				.from("content-images")
				.upload(fileName, processedImage, {
					contentType: "image/webp",
					upsert: true,
				});

			if (uploadError) {
				console.error("[IMAGE] Error uploading to Supabase:", uploadError);
				return null;
			}

			// Get the public URL
			const {
				data: { publicUrl },
			} = supabase.storage.from("content-images").getPublicUrl(fileName);

			console.log(
				`[IMAGE] Successfully uploaded and optimized image: ${normalizedUrl} -> ${publicUrl}`,
			);

			return publicUrl;
		} catch (sharpError) {
			console.error(
				`[IMAGE] Error processing image with Sharp: ${normalizedUrl}`,
				sharpError,
			);
			return null;
		}
	} catch (error) {
		if (error instanceof Error) {
			if (error.name === "AbortError") {
				console.error(`[IMAGE] Fetch timeout for image: ${imageUrl}`);
			} else if (
				error.name === "SyntaxError" &&
				error.message.includes("JSON")
			) {
				console.error(
					`[IMAGE] JSON parsing error (likely received HTML): ${imageUrl}`,
				);
			} else if (error.message.includes("EPIPE")) {
				console.error(`[IMAGE] Connection broken (EPIPE): ${imageUrl}`);
			} else {
				console.error(`[IMAGE] Error processing image: ${imageUrl}`, error);
			}
		} else {
			console.error(
				`[IMAGE] Unknown error processing image: ${imageUrl}`,
				error,
			);
		}
		return null;
	}
}

export async function smartCropImage(
	imageUrl: string,
	targetSize: number,
	isScript = false,
): Promise<CropResult | null> {
	try {
		// Validate image URL
		if (!imageUrl || !imageUrl.trim()) {
			console.log("[IMAGE] Skipping smart crop: Empty image URL");
			return null;
		}

		// Normalize URL to ensure it's valid
		let normalizedUrl = imageUrl;
		try {
			normalizedUrl = new URL(imageUrl).toString();
		} catch (urlError) {
			console.error(
				"[IMAGE] Invalid image URL for smart crop:",
				imageUrl,
				urlError,
			);
			return null;
		}

		console.log(
			`[IMAGE] Attempting to fetch image for smart crop: ${normalizedUrl}`,
		);

		// Set up fetch with AbortController for timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

		// Fetch the image with timeout
		const response = await fetch(normalizedUrl, {
			signal: controller.signal,
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; TheRunClubBot/1.0)",
			},
		});

		// Clear the timeout
		clearTimeout(timeoutId);

		// Check response status
		if (!response.ok) {
			console.error(
				`[IMAGE] Failed to fetch image for smart crop: HTTP ${response.status} - ${response.statusText}`,
			);
			return null;
		}

		// Verify content type is an image
		const contentType = response.headers.get("content-type");
		if (!contentType?.includes("image/")) {
			// Check if it's an HTML response
			if (contentType?.includes("text/html")) {
				const text = await response.text();
				const preview = text.substring(0, 100).replace(/\n/g, "");
				console.error(
					`[IMAGE] Received HTML instead of image for smart crop: ${normalizedUrl}, Preview: ${preview}...`,
				);
			} else {
				console.error(
					`[IMAGE] Unexpected content type for smart crop: ${contentType} for URL: ${normalizedUrl}`,
				);
			}
			return null;
		}

		console.log(
			`[IMAGE] Successfully fetched image for smart crop: ${normalizedUrl}`,
		);

		const arrayBuffer = await response.arrayBuffer();
		// Verify we actually got data
		if (arrayBuffer.byteLength === 0) {
			console.error(
				`[IMAGE] Received empty image data for smart crop: ${normalizedUrl}`,
			);
			return null;
		}

		const buffer = Buffer.from(arrayBuffer);

		// Analyze the image with smartcrop
		try {
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

			console.log(
				`[IMAGE] Successfully processed image for smart crop: ${normalizedUrl}`,
			);

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
				console.error("[IMAGE] Error uploading to Supabase:", uploadError);
				return null;
			}

			// Get the public URL
			const {
				data: { publicUrl },
			} = supabase.storage.from("athlete-images").getPublicUrl(fileName);

			console.log(
				`[IMAGE] Successfully uploaded and smart cropped image: ${normalizedUrl} -> ${publicUrl}`,
			);

			return {
				url: publicUrl,
				width: targetSize,
				height: targetSize,
			};
		} catch (processingError) {
			console.error(
				`[IMAGE] Error with smartcrop/sharp processing: ${normalizedUrl}`,
				processingError,
			);
			return null;
		}
	} catch (error) {
		if (error instanceof Error) {
			if (error.name === "AbortError") {
				console.error(
					`[IMAGE] Fetch timeout for smart crop image: ${imageUrl}`,
				);
			} else if (
				error.name === "SyntaxError" &&
				error.message.includes("JSON")
			) {
				console.error(
					`[IMAGE] JSON parsing error in smart crop (likely received HTML): ${imageUrl}`,
				);
			} else if (error.message.includes("EPIPE")) {
				console.error(
					`[IMAGE] Connection broken during smart crop (EPIPE): ${imageUrl}`,
				);
			} else {
				console.error(
					`[IMAGE] Error processing image for smart crop: ${imageUrl}`,
					error,
				);
			}
		} else {
			console.error(
				`[IMAGE] Unknown error processing image for smart crop: ${imageUrl}`,
				error,
			);
		}
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
