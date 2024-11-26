import { db, client } from "@/db/client";
import { runningClubs } from "@/db/schema";
import type { NewRunningClub } from "@/db/schema";

const clubsData: Omit<NewRunningClub, "id" | "createdAt" | "updatedAt">[] = [
	{
		clubName: "New York Road Runners (NYRR)",
		city: "New York",
		description:
			"The world's premier community running organization, serving runners of all abilities through races, community runs, walks, training, and more.",
		location: {
			city: "New York",
			state: "NY",
			country: "United States",
			coordinates: {
				latitude: 40.7829,
				longitude: -73.9654,
			},
		},
		website: "https://www.nyrr.org",
		socialMedia: {
			facebook: "https://www.facebook.com/NYRR",
			instagram: "https://www.instagram.com/nyrr",
			twitter: "https://twitter.com/nyrr",
			strava: "https://www.strava.com/clubs/nyrr",
		},
		metadata: {
			foundedYear: 1958,
			memberCount: 60000,
			difficultyLevel: "All Levels",
			tags: ["Road Running", "Marathon Training", "Community"],
			meetupSchedule: "Multiple weekly runs",
			amenities: ["Bag Storage", "Showers", "Training Programs"],
			events: [
				{
					name: "New York City Marathon",
					date: "2024-11-03",
					description: "The world's largest marathon",
				},
			],
		},
		lastUpdated: new Date(),
	},
	{
		clubName: "Boston Athletic Association (BAA)",
		city: "Boston",
		description:
			"Historic running organization known for organizing the Boston Marathon and promoting amateur sports.",
		location: {
			city: "Boston",
			state: "MA",
			country: "United States",
			coordinates: {
				latitude: 42.3601,
				longitude: -71.0589,
			},
		},
		website: "https://www.baa.org",
		socialMedia: {
			facebook: "https://www.facebook.com/BostonMarathon",
			instagram: "https://www.instagram.com/bostonmarathon",
			twitter: "https://twitter.com/BAA",
		},
		metadata: {
			foundedYear: 1887,
			memberCount: 45000,
			difficultyLevel: "Intermediate",
			tags: ["Marathon", "Historic", "Elite Running"],
			meetupSchedule: "Weekly track workouts",
			amenities: ["Track Access", "Coaching", "Race Discounts"],
			events: [
				{
					name: "Boston Marathon",
					date: "2024-04-15",
					description: "The world's oldest annual marathon",
				},
			],
		},
		lastUpdated: new Date(),
	},
	{
		clubName: "Portland Running Company Club",
		city: "Portland",
		description:
			"Community-focused running group offering training programs and social runs for all levels.",
		location: {
			city: "Portland",
			state: "OR",
			country: "United States",
			coordinates: {
				latitude: 45.5155,
				longitude: -122.6789,
			},
		},
		website: "https://portlandrunning.com",
		socialMedia: {
			facebook: "https://www.facebook.com/PortlandRunningCo",
			instagram: "https://www.instagram.com/portlandrunningco",
			strava: "https://www.strava.com/clubs/prc",
		},
		metadata: {
			foundedYear: 1995,
			memberCount: 2500,
			difficultyLevel: "All Levels",
			tags: ["Trail Running", "Road Running", "Community"],
			meetupSchedule: "Wednesday evenings and Saturday mornings",
			amenities: ["Store Discounts", "Group Runs", "Training Plans"],
			events: [
				{
					name: "Forest Park Trail Series",
					date: "2024-06-01",
					description: "Monthly trail running series",
				},
			],
		},
		lastUpdated: new Date(),
	},
	// ... Add more clubs here
];

async function main() {
	console.log("🌱 Starting running clubs seed...");

	try {
		// Clear existing clubs
		await db.delete(runningClubs);
		console.log("Cleared existing clubs");

		// Insert clubs
		await db.insert(runningClubs).values(clubsData);
		console.log("✅ Running clubs seeded successfully");
	} catch (error) {
		console.error("❌ Error seeding running clubs:", error);
		throw error;
	} finally {
		await client.end();
	}
}

main().catch((err) => {
	console.error("Failed to seed running clubs:", err);
	process.exit(1);
});
