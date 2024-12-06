import { db } from "@/db/client";
import { races } from "@/db/schema";
import * as runsignup from "@/lib/services/runsignup-service";

async function seedRaces() {
	console.log("Starting race seeding...");
	let page = 1;
	let totalRaces = 0;

	try {
		while (true) {
			console.log(`Fetching page ${page}...`);
			const response = await runsignup.getRaces(page);

			if (!response.races || response.races.length === 0) {
				console.log("No more races to fetch.");
				break;
			}

			// Process races in batches
			const racesToInsert = response.races.map((race) =>
				runsignup.mapToRace(race),
			);

			// Insert races in batches
			await db.insert(races).values(racesToInsert).onConflictDoNothing();

			totalRaces += racesToInsert.length;
			console.log(`Inserted races from page ${page}`);

			if (!response.next_page) {
				console.log("No more pages available.");
				break;
			}

			page++;

			// Add a small delay to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		console.log(`Successfully processed ${totalRaces} races.`);
	} catch (error) {
		console.error("Error seeding races:", error);
		process.exit(1);
	}
}

// Run the seed function
seedRaces();
