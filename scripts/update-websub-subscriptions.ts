import { db } from "@/db/client";
import { podcasts } from "@/db/schema";
import { webSubManager } from "@/lib/websub-manager";

async function updateWebSubSubscriptions() {
	try {
		// Get all podcasts
		const allPodcasts = await db.select().from(podcasts);
		console.log(`Found ${allPodcasts.length} podcasts to process`);

		let successCount = 0;
		let failureCount = 0;

		// Process each podcast
		for (const podcast of allPodcasts) {
			try {
				console.log(`\nProcessing podcast: ${podcast.title}`);

				// Discover WebSub hub
				const hubUrl = await webSubManager.discoverWebSubHub(podcast.feedUrl);

				if (hubUrl) {
					console.log(`Found hub for ${podcast.title}: ${hubUrl}`);

					// Attempt to subscribe
					const success = await webSubManager.subscribe(
						podcast.feedUrl,
						hubUrl,
					);

					if (success) {
						console.log(`Successfully subscribed to hub for ${podcast.title}`);
						successCount++;
					} else {
						console.log(`Failed to subscribe to hub for ${podcast.title}`);
						failureCount++;
					}
				} else {
					console.log(`No WebSub hub found for ${podcast.title}`);
					failureCount++;
				}
			} catch (error) {
				console.error(`Error processing podcast ${podcast.title}:`, error);
				failureCount++;
			}

			// Add a small delay between requests to avoid overwhelming servers
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		console.log("\nWebSub subscription update complete!");
		console.log(`Successful subscriptions: ${successCount}`);
		console.log(`Failed subscriptions: ${failureCount}`);
		console.log(`Total processed: ${allPodcasts.length}`);
	} catch (error) {
		console.error("Error updating WebSub subscriptions:", error);
		process.exit(1);
	}
}

// Run the update
updateWebSubSubscriptions();
