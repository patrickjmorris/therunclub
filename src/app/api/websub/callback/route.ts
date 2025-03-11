import { NextRequest, NextResponse } from "next/server";
import { webSubManager } from "@/lib/websub-manager";
import { db } from "@/db/client";
import { websubCallbackLogs } from "@/db/schema";
import { sql } from "drizzle-orm";

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
	const mode = searchParams.get("hub.mode");
	const topic = searchParams.get("hub.topic");
	const challenge = searchParams.get("hub.challenge");
	const leaseSeconds = searchParams.get("hub.lease_seconds");

	// Log the verification request
	console.log("WebSub verification request received:", {
		mode,
		topic,
		hasChallenge: !!challenge,
		leaseSeconds,
		headers: Object.fromEntries(request.headers.entries()),
		clientIp: request.headers.get("x-forwarded-for") || "unknown",
		timestamp: new Date().toISOString(),
	});

	// Store the verification request in the database for debugging
	try {
		await db.insert(websubCallbackLogs).values({
			type: "verification",
			topic: topic || "unknown",
			requestMethod: "GET",
			requestHeaders: JSON.stringify(
				Object.fromEntries(request.headers.entries()),
			),
			requestParams: JSON.stringify(Object.fromEntries(searchParams.entries())),
			requestBody: "",
			responseStatus: 0, // Will be updated after processing
			responseBody: "",
			createdAt: new Date(),
		});
	} catch (error) {
		console.error("Error logging WebSub verification request:", error);
	}

	const { statusCode, body } =
		await webSubManager.handleVerification(searchParams);

	// Update the log with the response
	try {
		await db
			.update(websubCallbackLogs)
			.set({
				responseStatus: statusCode,
				responseBody: body,
			})
			.where(
				sql`created_at = (SELECT MAX(created_at) FROM websub_callback_logs WHERE type = 'verification' AND topic = ${
					topic || "unknown"
				})`,
			);
	} catch (error) {
		console.error("Error updating WebSub verification log:", error);
	}

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
	const topic =
		request.headers.get("x-hub-topic") || request.headers.get("hub-topic");
	const signature =
		request.headers.get("x-hub-signature") ||
		request.headers.get("hub-signature");
	const contentType = request.headers.get("content-type") || "unknown";

	// Log the notification request
	console.log("WebSub notification received:", {
		topic,
		hasSignature: !!signature,
		contentType,
		headers: Object.fromEntries(request.headers.entries()),
		clientIp: request.headers.get("x-forwarded-for") || "unknown",
		timestamp: new Date().toISOString(),
	});

	if (!topic) {
		console.warn("WebSub notification missing topic header");
		return new NextResponse("Missing topic header", { status: 400 });
	}

	try {
		// Get the raw body for signature verification
		const body = await request.text();
		const bodyPreview =
			body.length > 10000 ? `${body.substring(0, 10000)}...` : body;

		// Store the notification in the database for debugging
		try {
			await db.insert(websubCallbackLogs).values({
				type: "notification",
				topic,
				requestMethod: "POST",
				requestHeaders: JSON.stringify(
					Object.fromEntries(request.headers.entries()),
				),
				requestParams: "",
				requestBody: bodyPreview,
				responseStatus: 0, // Will be updated after processing
				responseBody: "",
				createdAt: new Date(),
			});
		} catch (error) {
			console.error("Error logging WebSub notification:", error);
		}

		// Process the notification
		const { statusCode, body: responseBody } =
			await webSubManager.handleNotification(topic, signature, body);

		// Update the log with the response
		try {
			const responsePreview =
				responseBody.length > 1000
					? `${responseBody.substring(0, 1000)}...`
					: responseBody;

			await db
				.update(websubCallbackLogs)
				.set({
					responseStatus: statusCode,
					responseBody: responsePreview,
				})
				.where(
					sql`created_at = (SELECT MAX(created_at) FROM websub_callback_logs WHERE type = 'notification' AND topic = ${topic})`,
				);
		} catch (error) {
			console.error("Error updating WebSub notification log:", error);
		}

		return new NextResponse(responseBody, { status: statusCode });
	} catch (error) {
		console.error("Error processing WebSub notification:", error);
		return new NextResponse("Internal server error", { status: 500 });
	}
}
