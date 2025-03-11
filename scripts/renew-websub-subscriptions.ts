import { db } from "@/db/client";
import { websubSubscriptions } from "@/db/schema";
import { webSubManager } from "@/lib/websub-manager";
import { and, eq, lt } from "drizzle-orm";

/**
 * Renews WebSub subscriptions that are about to expire
 * This script should be run daily to ensure subscriptions don't expire
 */
async function renewWebSubSubscriptions() {
	try {
		// Calculate the expiration threshold (subscriptions expiring in the next 12 hours)
		const expirationThreshold = new Date();
		expirationThreshold.setHours(expirationThreshold.getHours() + 12);

		// Find active subscriptions that are about to expire
		const expiringSubscriptions = await db
			.select()
			.from(websubSubscriptions)
			.where(
				and(
					eq(websubSubscriptions.status, "active"),
					lt(websubSubscriptions.expiresAt, expirationThreshold),
				),
			);

		console.log(
			`Found ${expiringSubscriptions.length} subscriptions that need renewal`,
		);

		let successCount = 0;
		let failureCount = 0;

		// Process each subscription
		for (const subscription of expiringSubscriptions) {
			try {
				console.log(
					`\nRenewing subscription for ${subscription.topic} (expires: ${subscription.expiresAt})`,
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
					`Error renewing subscription for ${subscription.topic}:`,
					error,
				);
				failureCount++;
			}

			// Add a small delay between requests to avoid overwhelming servers
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		console.log("\nWebSub subscription renewal complete!");
		console.log(`Successful renewals: ${successCount}`);
		console.log(`Failed renewals: ${failureCount}`);
		console.log(`Total processed: ${expiringSubscriptions.length}`);
	} catch (error) {
		console.error("Error renewing WebSub subscriptions:", error);
		process.exit(1);
	}
}

// Run the renewal process
renewWebSubSubscriptions();
