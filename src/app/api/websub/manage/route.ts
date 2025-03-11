import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { websubSubscriptions, podcasts } from "@/db/schema";
import { webSubManager } from "@/lib/websub-manager";
import { and, eq, lt, desc, SQL } from "drizzle-orm";

type WebSubSubscription = typeof websubSubscriptions.$inferSelect;
type WebSubStatus = "pending" | "active" | "expired";

/**
 * Handles GET requests to check WebSub subscription status
 * Can filter by status, expiring soon, or specific podcast
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const statusParam = searchParams.get("status");
		const expiringSoon = searchParams.get("expiringSoon") === "true";
		const podcastId = searchParams.get("podcastId");
		const feedUrl = searchParams.get("feedUrl");
		const limit = parseInt(searchParams.get("limit") || "100", 10);

		// Build query conditions
		const conditions: SQL[] = [];

		if (statusParam && ["pending", "active", "expired"].includes(statusParam)) {
			const status = statusParam as WebSubStatus;
			conditions.push(eq(websubSubscriptions.status, status));
		}

		if (expiringSoon) {
			const expirationThreshold = new Date();
			expirationThreshold.setHours(expirationThreshold.getHours() + 12);
			conditions.push(lt(websubSubscriptions.expiresAt, expirationThreshold));
		}

		if (feedUrl) {
			conditions.push(eq(websubSubscriptions.topic, feedUrl));
		}

		// If podcastId is provided, first get the podcast's feed URL
		if (podcastId) {
			const podcast = await db.query.podcasts.findFirst({
				where: eq(podcasts.id, podcastId),
			});

			if (!podcast) {
				return NextResponse.json(
					{ message: "Podcast not found" },
					{ status: 404 },
				);
			}

			conditions.push(eq(websubSubscriptions.topic, podcast.feedUrl));
		}

		// Execute the query
		const subscriptions = await db
			.select()
			.from(websubSubscriptions)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(websubSubscriptions.updatedAt))
			.limit(limit);

		return NextResponse.json({
			message: "Subscriptions retrieved successfully",
			count: subscriptions.length,
			subscriptions,
		});
	} catch (error) {
		console.error("Error retrieving WebSub subscriptions:", error);
		return NextResponse.json(
			{
				message: "Error retrieving WebSub subscriptions",
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

/**
 * Handles POST requests to renew WebSub subscriptions
 * Can renew all expiring subscriptions or specific ones
 */
export async function POST(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const action = searchParams.get("action");

		if (action === "renew") {
			const feedUrl = searchParams.get("feedUrl");
			const podcastId = searchParams.get("podcastId");
			const renewAll = searchParams.get("renewAll") === "true";
			const expiringOnly = searchParams.get("expiringOnly") === "true";

			let subscriptionsToRenew: WebSubSubscription[] = [];

			// Determine which subscriptions to renew
			if (feedUrl) {
				// Renew a specific subscription by feed URL
				const subscription = await db.query.websubSubscriptions.findFirst({
					where: eq(websubSubscriptions.topic, feedUrl),
				});

				if (subscription) {
					subscriptionsToRenew.push(subscription);
				}
			} else if (podcastId) {
				// Renew subscription for a specific podcast
				const podcast = await db.query.podcasts.findFirst({
					where: eq(podcasts.id, podcastId),
				});

				if (podcast) {
					const subscription = await db.query.websubSubscriptions.findFirst({
						where: eq(websubSubscriptions.topic, podcast.feedUrl),
					});

					if (subscription) {
						subscriptionsToRenew.push(subscription);
					}
				}
			} else if (renewAll) {
				// Renew all subscriptions, optionally filtering for expiring ones
				const renewConditions: SQL[] = [
					eq(websubSubscriptions.status, "active" as WebSubStatus),
				];

				if (expiringOnly) {
					const expirationThreshold = new Date();
					expirationThreshold.setHours(expirationThreshold.getHours() + 12);
					renewConditions.push(
						lt(websubSubscriptions.expiresAt, expirationThreshold),
					);
				}

				subscriptionsToRenew = await db
					.select()
					.from(websubSubscriptions)
					.where(and(...renewConditions));
			}

			if (subscriptionsToRenew.length === 0) {
				return NextResponse.json(
					{ message: "No subscriptions found to renew" },
					{ status: 404 },
				);
			}

			// Process renewals
			const results = [];
			for (const subscription of subscriptionsToRenew) {
				try {
					const success = await webSubManager.subscribe(
						subscription.topic,
						subscription.hub,
					);
					results.push({
						topic: subscription.topic,
						success,
					});
				} catch (error) {
					results.push({
						topic: subscription.topic,
						success: false,
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}

			return NextResponse.json({
				message: "Subscription renewal process completed",
				total: subscriptionsToRenew.length,
				successful: results.filter((r) => r.success).length,
				failed: results.filter((r) => !r.success).length,
				results,
			});
		}

		return NextResponse.json(
			{ message: "Invalid action parameter" },
			{ status: 400 },
		);
	} catch (error) {
		console.error("Error managing WebSub subscriptions:", error);
		return NextResponse.json(
			{
				message: "Error managing WebSub subscriptions",
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
