import { NextRequest, NextResponse } from "next/server";
import { webSubManager } from "@/lib/websub-manager";
import { db } from "@/db/client";
import { websubSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Handles GET requests to check feed updates and debug WebSub issues
 * This endpoint can:
 * - Check if a feed has been updated since the last notification
 * - Manually trigger feed processing
 * - Verify subscription status
 */
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const action = searchParams.get("action");
	const feedUrl = searchParams.get("feedUrl");

	if (!feedUrl) {
		return NextResponse.json(
			{ message: "feedUrl parameter is required" },
			{ status: 400 },
		);
	}

	// Check if the feed exists in our subscriptions
	const subscription = await db.query.websubSubscriptions.findFirst({
		where: eq(websubSubscriptions.topic, feedUrl),
	});

	if (!subscription) {
		return NextResponse.json(
			{ message: `No subscription found for feed: ${feedUrl}` },
			{ status: 404 },
		);
	}

	// Handle different actions
	if (action === "check") {
		// Check if the feed has been updated since the last notification
		const result = await webSubManager.checkFeedForUpdates(feedUrl);

		return NextResponse.json({
			message: "Feed check completed",
			feedUrl,
			subscription: {
				status: subscription.status,
				expiresAt: subscription.expiresAt,
				hub: subscription.hub,
			},
			lastBuildDate: result.lastBuildDate,
			lastNotificationDate: result.lastNotificationDate,
			hasChanged: result.hasChanged,
			feedContentPreview: result.feedContent
				? `${result.feedContent.substring(0, 500)}...`
				: null,
		});
	}

	if (action === "process") {
		// Manually process the feed
		const result = await webSubManager.manuallyProcessFeed(feedUrl);

		return NextResponse.json({
			message: result.message,
			success: result.success,
			feedUrl,
			subscription: {
				status: subscription.status,
				expiresAt: subscription.expiresAt,
				hub: subscription.hub,
			},
		});
	}

	if (action === "verify") {
		// Verify the subscription status
		return NextResponse.json({
			message: "Subscription status",
			feedUrl,
			subscription: {
				id: subscription.id,
				status: subscription.status,
				expiresAt: subscription.expiresAt,
				hub: subscription.hub,
				createdAt: subscription.createdAt,
				updatedAt: subscription.updatedAt,
			},
		});
	}

	return NextResponse.json(
		{
			message: "Invalid action parameter. Use 'check', 'process', or 'verify'",
		},
		{ status: 400 },
	);
}
