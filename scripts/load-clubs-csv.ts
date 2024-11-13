import { db, client } from "@/db";
import { runningClubs } from "@/db/schema";
import { parse } from "csv-parse";
import { createReadStream } from "fs";
import { resolve } from "path";
import type { NewRunningClub } from "@/db/schema";

interface CSVClub {
	City: string;
	"Club Name": string;
	Location: string;
	Website: string;
	"Strava Club Link": string;
	"Social Media": string;
}

function transformClubData(
	csvClub: CSVClub,
): Omit<NewRunningClub, "id" | "createdAt" | "updatedAt"> {
	// Extract state from Location if available
	const locationParts = csvClub.Location.split(",");
	const state = locationParts.length > 1 ? locationParts[1].trim() : null;

	// Extract social media platform from URL
	const socialUrl = csvClub["Social Media"];
	const socialMedia: Record<string, string> = {
		strava: csvClub["Strava Club Link"],
	};

	if (socialUrl.includes("instagram")) {
		socialMedia.instagram = socialUrl;
	} else if (socialUrl.includes("twitter")) {
		socialMedia.twitter = socialUrl;
	} else if (socialUrl.includes("facebook")) {
		socialMedia.facebook = socialUrl;
	}

	return {
		clubName: csvClub["Club Name"],
		description: null,
		city: csvClub.City,
		location: {
			city: csvClub.City,
			state,
			country: "United States", // Assuming all clubs are in the US
			coordinates: null,
		},
		website: csvClub.Website,
		socialMedia,
		metadata: {
			tags: ["Running Club", csvClub.City],
			difficultyLevel: "All Levels",
		},
		lastUpdated: new Date(),
	};
}

async function loadClubs() {
	console.log("🌱 Loading clubs from CSV...");

	try {
		const csvFilePath = resolve(process.cwd(), "data/clubs.csv");
		const clubs: CSVClub[] = [];

		// Parse CSV file
		await new Promise((resolve, reject) => {
			createReadStream(csvFilePath)
				.pipe(
					parse({
						columns: true,
						skip_empty_lines: true,
					}),
				)
				.on("data", (data: CSVClub) => {
					clubs.push(data);
				})
				.on("error", reject)
				.on("end", resolve);
		});

		console.log(`Found ${clubs.length} clubs in CSV`);

		// Transform and insert clubs
		const transformedClubs = clubs.map(transformClubData);

		// Clear existing clubs
		await db.delete(runningClubs);
		console.log("Cleared existing clubs");

		// Insert new clubs
		await db.insert(runningClubs).values(transformedClubs);
		console.log("✅ Clubs loaded successfully");
	} catch (error) {
		console.error("❌ Error loading clubs:", error);
		throw error;
	} finally {
		await client.end();
	}
}

// Run the script
loadClubs().catch((err) => {
	console.error("Failed to load clubs:", err);
	process.exit(1);
});
