import { db } from "../src/db/client";
import { podcasts, episodes } from "@/db/schema";
import { sql } from "drizzle-orm";
import { supabaseAdmin } from "@/lib/supabase-admin";
import sharp from "sharp";
import { nanoid } from "nanoid";

interface ProcessResult {
	success: boolean;
	message: string;
	processedCount: number;
	failedCount: number;
}

async function optimizeImage(
	imageUrl: string,
	targetSize: number,
	prefix: string,
): Promise<string | null> {
	try {
		// Fetch the image
		const response = await fetch(imageUrl);
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

		// Upload to Supabase Storage
		const fileName = `${prefix}/${nanoid()}.webp`;

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
		console.error("Error processing image:", error);
		return null;
	}
}

async function processPodcastImages(batchSize = 10000): Promise<ProcessResult> {
	console.log(`Processing podcast images in batches of ${batchSize}...`);

	// Get all podcasts with unoptimized images
	const podcastsWithImages = await db
		.select({
			id: podcasts.id,
			title: podcasts.title,
			image: podcasts.image,
		})
		.from(podcasts)
		.where(sql`image IS NOT NULL AND podcast_image IS NULL`)
		.limit(batchSize);

	console.log(
		`Found ${podcastsWithImages.length} podcasts with unoptimized images`,
	);

	let successCount = 0;
	let failureCount = 0;

	for (const podcast of podcastsWithImages) {
		try {
			console.log(`Processing ${podcast.title}...`);

			if (!podcast.image) {
				console.log(`No image URL for ${podcast.title}, skipping...`);
				failureCount++;
				continue;
			}

			const optimizedUrl = await optimizeImage(podcast.image, 1400, "podcasts");

			if (optimizedUrl) {
				await db
					.update(podcasts)
					.set({
						podcastImage: optimizedUrl,
						updatedAt: sql`CURRENT_TIMESTAMP`,
					})
					.where(sql`id = ${podcast.id}`);

				console.log(`✅ Successfully optimized image for ${podcast.title}`);
				successCount++;
			} else {
				console.log(`❌ Failed to optimize image for ${podcast.title}`);
				failureCount++;
			}
		} catch (error) {
			console.error(`Error processing ${podcast.title}:`, error);
			failureCount++;
		}
	}

	return {
		success: failureCount === 0,
		message: `Processed ${successCount} podcasts successfully, ${failureCount} failed`,
		processedCount: successCount,
		failedCount: failureCount,
	};
}

async function processEpisodeImages(batchSize = 10000): Promise<ProcessResult> {
	console.log(`Processing episode images in batches of ${batchSize}...`);

	// Get all episodes with unoptimized images
	const episodesWithImages = await db
		.select({
			id: episodes.id,
			title: episodes.title,
			image: episodes.image,
		})
		.from(episodes)
		.where(sql`image IS NOT NULL AND episode_image IS NULL`)
		.limit(batchSize);

	console.log(
		`Found ${episodesWithImages.length} episodes with unoptimized images`,
	);

	let successCount = 0;
	let failureCount = 0;

	for (const episode of episodesWithImages) {
		try {
			console.log(`Processing ${episode.title}...`);

			if (!episode.image) {
				console.log(`No image URL for ${episode.title}, skipping...`);
				failureCount++;
				continue;
			}

			const optimizedUrl = await optimizeImage(episode.image, 1400, "episodes");

			if (optimizedUrl) {
				await db
					.update(episodes)
					.set({
						episodeImage: optimizedUrl,
						updatedAt: sql`CURRENT_TIMESTAMP`,
					})
					.where(sql`id = ${episode.id}`);

				console.log(`✅ Successfully optimized image for ${episode.title}`);
				successCount++;
			} else {
				console.log(`❌ Failed to optimize image for ${episode.title}`);
				failureCount++;
			}
		} catch (error) {
			console.error(`Error processing ${episode.title}:`, error);
			failureCount++;
		}
	}

	return {
		success: failureCount === 0,
		message: `Processed ${successCount} episodes successfully, ${failureCount} failed`,
		processedCount: successCount,
		failedCount: failureCount,
	};
}

async function optimizeContentImages(batchSize = 10000) {
	console.log("Starting content image optimization process...");

	try {
		// Process podcasts first
		const podcastResult = await processPodcastImages(batchSize);
		console.log("\nPodcast Processing Results:");
		console.log(podcastResult.message);

		// Then process episodes
		const episodeResult = await processEpisodeImages(batchSize);
		console.log("\nEpisode Processing Results:");
		console.log(episodeResult.message);

		console.log("\n✨ Optimization process completed");
		process.exit(0);
	} catch (error) {
		console.error("❌ Script failed:", error);
		process.exit(1);
	}
}

// Parse command line arguments
const batchSize = process.argv[2] ? parseInt(process.argv[2]) : 10000;

// Run the script
optimizeContentImages(batchSize);
