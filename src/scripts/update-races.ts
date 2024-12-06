import { db } from "@/db/client";
import { races } from "@/db/schema";
import * as runsignup from "@/lib/services/runsignup-service";
import { eq, lt, and, isNotNull } from "drizzle-orm";

async function updateRaces() {
	console.log("Starting race updates...");
	const today = new Date();
	let page = 1;
	let totalUpdated = 0;
	let totalAdded = 0;

	try {
		// First, remove past races
		await db.delete(races).where(lt(races.date, today));
		console.log("Removed past races");

		// Then fetch and update/insert new races
		while (true) {
			console.log(`Fetching page ${page}...`);
			const response = await runsignup.getRaces(page);

			if (!response.races || response.races.length === 0) {
				console.log("No more races to fetch.");
				break;
			}

			// Process each race
			for (const race of response.races) {
				const mappedRace = runsignup.mapToRace(race);

				// Try to update existing race
				const updateResult = await db
					.update(races)
					.set({
						...mappedRace,
						updatedAt: new Date(),
					})
					.where(
						and(
							isNotNull(races.website),
							eq(races.website, mappedRace.website ?? ""),
						),
					)
					.returning();

				if (updateResult.length > 0) {
					totalUpdated++;
				} else {
					// If race doesn't exist, insert it
					await db.insert(races).values(mappedRace).onConflictDoNothing();

					totalAdded++;
				}
			}

			console.log(`Processed page ${page}`);

			if (!response.next_page) {
				console.log("No more pages available.");
				break;
			}

			page++;

			// Add a small delay to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		console.log(`Update complete:
- Updated ${totalUpdated} existing races
- Added ${totalAdded} new races`);
	} catch (error) {
		console.error("Error updating races:", error);
		process.exit(1);
	}
}

// Run the update function
updateRaces();
