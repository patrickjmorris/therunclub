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
	console.log("WebSub verification request received");
	console.log(
		"Query params:",
		Object.fromEntries(request.nextUrl.searchParams.entries()),
	);

	const searchParams = request.nextUrl.searchParams;
	const { statusCode, body } =
		await webSubManager.handleVerification(searchParams);

	console.log("WebSub verification response:", { statusCode, body });
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
	console.log("WebSub notification received");

	// Log all headers for debugging
	const headers = Object.fromEntries(request.headers.entries());
	console.log("WebSub notification headers:", headers);

	// Get required headers from the request
	// Check for both standard header names and X- prefixed versions
	const topic =
		request.headers.get("hub-topic") ||
		request.headers.get("x-hub-topic") ||
		request.headers.get("hub.topic");

	const signature =
		request.headers.get("hub-signature") ||
		request.headers.get("x-hub-signature") ||
		request.headers.get("hub.signature");

	if (!topic) {
		console.error("WebSub notification missing topic header");
		return new NextResponse("Missing topic header", { status: 400 });
	}

	try {
		// Get the raw body for signature verification
		const body = await request.text();
		console.log(`WebSub notification body length: ${body.length} bytes`);

		// Log a preview of the body for debugging (first 200 chars)
		if (body.length > 0) {
			console.log(
				`WebSub notification body preview: ${body.substring(0, 200)}...`,
			);
		}

		// Process the notification
		const { statusCode, body: responseBody } =
			await webSubManager.handleNotification(topic, signature, body);

		console.log("WebSub notification response:", { statusCode, responseBody });
		return new NextResponse(responseBody, { status: statusCode });
	} catch (error) {
		console.error("Error processing WebSub notification:", error);
		return new NextResponse("Internal server error", { status: 500 });
	}
}
