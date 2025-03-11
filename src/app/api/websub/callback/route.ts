import { NextRequest, NextResponse } from "next/server";
import { webSubManager } from "@/lib/websub-manager";

/**
 * Handles GET requests for WebSub subscription verification
 * The hub will send a GET request to verify a subscription or unsubscription
 *
 * According to the WebSub spec, the hub sends the following parameters:
 * - hub.mode: Either "subscribe" or "unsubscribe"
 * - hub.topic: The URL of the feed being subscribed to
 * - hub.challenge: A random string that must be echoed back
 * - hub.lease_seconds: (Optional) How long the subscription will be active
 */
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const { statusCode, body } =
		await webSubManager.handleVerification(searchParams);

	return new NextResponse(body, { status: statusCode });
}

/**
 * Handles POST requests for content notifications
 * The hub will send a POST request when the subscribed content is updated
 *
 * According to the WebSub spec:
 * - The request body contains the updated content
 * - The hub.topic header identifies which feed was updated
 * - The hub.signature header contains the HMAC signature (if a secret was provided)
 *
 * Security considerations:
 * - Verifies the signature if present
 * - Only processes updates for active subscriptions
 * - Uses constant-time comparison for signature verification
 */
export async function POST(request: NextRequest) {
	// Get required headers from the request
	const topic = request.headers.get("x-hub-topic");
	const signature = request.headers.get("x-hub-signature");

	if (!topic) {
		return new NextResponse("Missing topic header", { status: 400 });
	}

	try {
		// Get the raw body for signature verification
		const body = await request.text();

		// Process the notification
		const { statusCode, body: responseBody } =
			await webSubManager.handleNotification(topic, signature, body);

		return new NextResponse(responseBody, { status: statusCode });
	} catch (error) {
		console.error("Error processing WebSub notification:", error);
		return new NextResponse("Internal server error", { status: 500 });
	}
}
