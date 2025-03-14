import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { websubSubscriptions, podcasts } from "@/db/schema";
import { webSubManager } from "@/lib/websub-manager";
import { eq, lt, and, sql } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * Helper function to check if the request is authorized
 */
async function isAuthorized(request: NextRequest): Promise<boolean> {
	const headersList = await headers();
	const apiKeyFromHeaders = headersList.get("x-api-key");
	const apiKeyFromRequest = request.headers.get("x-api-key");
	const validApiKey = process.env.UPDATE_API_KEY;

	// Check for cron secret
	const authHeader = headersList.get("authorization");
	const validCronSecret = process.env.CRON_SECRET;
	const isCronRequest = authHeader === `Bearer ${validCronSecret}`;

	if (!validApiKey && !validCronSecret) {
		console.error(
			"Neither API key nor CRON_SECRET configured in environment variables",
		);
		return false;
	}

	return (
		apiKeyFromHeaders === validApiKey ||
		apiKeyFromRequest === validApiKey ||
		isCronRequest
	);
}

/**
 * GET handler for the WebSub management API
 * Supports the following operations:
 * - update-expiring: Updates subscriptions that will expire in the next 24 hours
 * - status: Returns the status of all WebSub subscriptions
 * - renew: Renews a specific subscription by topic (feed URL)
 */
export async function GET(request: NextRequest) {
	if (!(await isAuthorized(request))) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const searchParams = request.nextUrl.searchParams;
	const operation = searchParams.get("operation");

	if (!operation) {
		return NextResponse.json(
			{ message: "Missing operation parameter" },
			{ status: 400 },
		);
	}

	// Handle different operations
	switch (operation) {
		case "update-expiring":
			return handleUpdateExpiring();
		case "status":
			return handleGetStatus();
		case "renew": {
			const topic = searchParams.get("topic");
			if (!topic) {
				return NextResponse.json(
					{ message: "Missing topic parameter for renew operation" },
					{ status: 400 },
				);
			}
			return handleRenewSubscription(topic);
		}
		default:
			return NextResponse.json(
				{ message: "Invalid operation" },
				{ status: 400 },
			);
	}
}

/**
 * Updates subscriptions that will expire in the next 24 hours
 */
async function handleUpdateExpiring() {
	try {
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
		const results = [];

		// Process each expiring subscription
		for (const subscription of expiringSubscriptions) {
			try {
				console.log(`Processing subscription for topic: ${subscription.topic}`);

				// Attempt to renew the subscription
				const success = await webSubManager.subscribe(
					subscription.topic,
					subscription.hub,
				);

				const result = {
					topic: subscription.topic,
					success,
					previousExpiry: subscription.expiresAt,
				};

				results.push(result);

				if (success) {
					successCount++;
				} else {
					failureCount++;
				}
			} catch (error) {
				console.error(
					`Error processing subscription ${subscription.topic}:`,
					error,
				);
				results.push({
					topic: subscription.topic,
					success: false,
					error: error instanceof Error ? error.message : String(error),
				});
				failureCount++;
			}

			// Add a small delay between requests to avoid overwhelming servers
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		return NextResponse.json({
			message: "WebSub subscription update complete",
			results: {
				total: expiringSubscriptions.length,
				successful: successCount,
				failed: failureCount,
				details: results,
			},
		});
	} catch (error) {
		console.error("Error updating WebSub subscriptions:", error);
		return NextResponse.json(
			{
				message: "Error updating WebSub subscriptions",
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

/**
 * Gets the status of all WebSub subscriptions
 */
async function handleGetStatus() {
	try {
		// Get all subscriptions with their status
		const allSubscriptions = await db
			.select({
				id: websubSubscriptions.id,
				topic: websubSubscriptions.topic,
				hub: websubSubscriptions.hub,
				status: websubSubscriptions.status,
				expiresAt: websubSubscriptions.expiresAt,
				updatedAt: websubSubscriptions.updatedAt,
			})
			.from(websubSubscriptions);

		// Count subscriptions by status
		const statusCounts = {
			active: 0,
			pending: 0,
			expired: 0,
			total: allSubscriptions.length,
		};

		for (const sub of allSubscriptions) {
			if (sub.status === "active") statusCounts.active++;
			else if (sub.status === "pending") statusCounts.pending++;
			else if (sub.status === "expired") statusCounts.expired++;
		}

		// Get count of podcasts without subscriptions
		const podcastsWithoutSubscriptions = await db
			.select({ count: sql<number>`count(*)` })
			.from(podcasts)
			.leftJoin(
				websubSubscriptions,
				eq(podcasts.feedUrl, websubSubscriptions.topic),
			)
			.where(sql`${websubSubscriptions.id} IS NULL`);

		return NextResponse.json({
			message: "WebSub subscription status",
			results: {
				statusCounts,
				podcastsWithoutSubscriptions:
					podcastsWithoutSubscriptions[0]?.count || 0,
			},
		});
	} catch (error) {
		console.error("Error getting WebSub subscription status:", error);
		return NextResponse.json(
			{
				message: "Error getting WebSub subscription status",
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

/**
 * Renews a specific subscription by topic (feed URL)
 */
async function handleRenewSubscription(topic: string) {
	try {
		// Find the subscription
		const subscription = await db
			.select()
			.from(websubSubscriptions)
			.where(eq(websubSubscriptions.topic, topic))
			.limit(1)
			.then((rows) => rows[0]);

		if (subscription) {
			console.log(`Renewing existing subscription for ${topic}`);
			const success = await webSubManager.subscribe(topic, subscription.hub);

			return NextResponse.json({
				message: success
					? "Subscription renewed successfully"
					: "Failed to renew subscription",
				success,
				topic,
				previousStatus: subscription.status,
				previousExpiry: subscription.expiresAt,
			});
		}

		// No existing subscription, try to discover hub and subscribe
		console.log(
			`No existing subscription found for ${topic}, discovering hub...`,
		);
		const hubUrl = await webSubManager.discoverWebSubHub(topic);

		if (!hubUrl) {
			return NextResponse.json({
				message: "No WebSub hub found for the topic",
				success: false,
				topic,
			});
		}

		const success = await webSubManager.subscribe(topic, hubUrl);

		return NextResponse.json({
			message: success
				? "New subscription created successfully"
				: "Failed to create subscription",
			success,
			topic,
			hub: hubUrl,
		});
	} catch (error) {
		console.error(`Error renewing subscription for ${topic}:`, error);
		return NextResponse.json(
			{
				message: "Error renewing subscription",
				topic,
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

// Also support POST requests for the same operations
export { GET as POST };
