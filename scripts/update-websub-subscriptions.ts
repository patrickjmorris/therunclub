import { db } from "@/db/client";
import { podcasts, websubSubscriptions } from "@/db/schema";
import { webSubManager } from "@/lib/websub-manager";
import { eq, lt, and, sql } from "drizzle-orm";

async function updateWebSubSubscriptions() {
	try {
		console.log("Starting WebSub subscription update process...");

		// Get current date
		const now = new Date();

		// Calculate date for subscriptions expiring in the next 24 hours
		const expiryThreshold = new Date(now);
		expiryThreshold.setHours(expiryThreshold.getHours() + 24);

		// Find active subscriptions that will expire in the next 24 hours
		const expiringSubscriptions = await db
			.select({
				id: websubSubscriptions.id,
				topic: websubSubscriptions.topic,
				hub: websubSubscriptions.hub,
				expiresAt: websubSubscriptions.expiresAt,
			})
			.from(websubSubscriptions)
			.where(
				and(
					eq(websubSubscriptions.status, "active"),
					lt(websubSubscriptions.expiresAt, expiryThreshold),
				),
			);

		console.log(
			`Found ${expiringSubscriptions.length} subscriptions expiring in the next 24 hours`,
		);

		let successCount = 0;
		let failureCount = 0;

		// Process each expiring subscription
		for (const subscription of expiringSubscriptions) {
			try {
				console.log(
					`\nProcessing subscription for topic: ${subscription.topic}`,
				);
				console.log(
					`Current expiration: ${subscription.expiresAt.toISOString()}`,
				);

				// Attempt to renew the subscription
				const success = await webSubManager.subscribe(
					subscription.topic,
					subscription.hub,
				);

				if (success) {
					console.log(
						`Successfully renewed subscription for ${subscription.topic}`,
					);
					successCount++;
				} else {
					console.log(`Failed to renew subscription for ${subscription.topic}`);
					failureCount++;
				}
			} catch (error) {
				console.error(
					`Error processing subscription ${subscription.topic}:`,
					error,
				);
				failureCount++;
			}

			// Add a small delay between requests to avoid overwhelming servers
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		// If no expiring subscriptions were found, check for podcasts without subscriptions
		if (expiringSubscriptions.length === 0) {
			console.log(
				"No expiring subscriptions found. Checking for podcasts without subscriptions...",
			);

			// Find podcasts that don't have an active WebSub subscription
			const podcastsWithoutSubscriptions = await db
				.select({
					id: podcasts.id,
					title: podcasts.title,
					feedUrl: podcasts.feedUrl,
				})
				.from(podcasts)
				.leftJoin(
					websubSubscriptions,
					eq(podcasts.feedUrl, websubSubscriptions.topic),
				)
				.where(sql`${websubSubscriptions.id} IS NULL`);

			console.log(
				`Found ${podcastsWithoutSubscriptions.length} podcasts without subscriptions`,
			);

			// Process each podcast without a subscription
			for (const podcast of podcastsWithoutSubscriptions) {
				try {
					console.log(
						`\nProcessing podcast without subscription: ${podcast.title}`,
					);

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
							console.log(
								`Successfully subscribed to hub for ${podcast.title}`,
							);
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
		}

		console.log("\nWebSub subscription update complete!");
		console.log(`Successful subscriptions/renewals: ${successCount}`);
		console.log(`Failed subscriptions/renewals: ${failureCount}`);
		console.log(`Total processed: ${successCount + failureCount}`);
	} catch (error) {
		console.error("Error updating WebSub subscriptions:", error);
		process.exit(1);
	}
}

// Run the update
updateWebSubSubscriptions();
