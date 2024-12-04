import { db } from "./client";
import { sql } from "drizzle-orm";
import { CHANNELS } from "@/lib/youtube";
import { updateVideos } from "@/lib/services/video-service";

// Only run seeding if script is called directly
const isDirectRun = require.main === module;

async function checkConnection() {
	try {
		const result = await db.execute(sql`SELECT 1`);
		console.log("Connection test result:", result);
		return true;
	} catch (error) {
		console.error("Database connection failed:", error);
		return false;
	}
}

export async function seedVideos(
	options: {
		limit?: number;
		videosPerChannel?: number;
		youtubeChannelId?: string;
		forceUpdate?: boolean;
	} = { limit: 50, videosPerChannel: 10 },
) {
	console.log("Starting video database seeding process...");

	try {
		const isConnected = await checkConnection();
		if (!isConnected) {
			throw new Error("Failed to connect to database");
		}

		// Use the optimized update function
		const results = await updateVideos(options);

		console.log("Video database seeding completed", results);
		return results;
	} catch (error) {
		console.error("Fatal error during video seeding process:", error);
		throw error;
	}
}

// Only run if script is called directly
if (isDirectRun) {
	const SEED_TIMEOUT = 300000; // 5 minutes timeout

	Promise.race([
		seedVideos(),
		new Promise((_, reject) =>
			setTimeout(
				() => reject(new Error("Video seeding timed out")),
				SEED_TIMEOUT,
			),
		),
	])
		.then(() => {
			console.log("Video seeding completed successfully");
			process.exit(0);
		})
		.catch((error) => {
			console.error("Error seeding video database:", error);
			process.exit(1);
		});
}
