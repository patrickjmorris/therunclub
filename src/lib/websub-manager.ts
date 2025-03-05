import { db } from "@/db/client";
import { podcasts, websubSubscriptions } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { updatePodcastByFeedUrl } from "./podcast-service";
import * as crypto from "crypto";

/**
 * Constants for WebSub subscription management
 */
const SUBSCRIPTION_VERIFY_TIMEOUT = 120000; // 2 minutes timeout for subscription verification
const DEFAULT_LEASE_SECONDS = 86400; // 24 hours default subscription lease time
const MAX_RETRIES = 3; // Maximum number of retry attempts
const RETRY_DELAY = 5000; // 5 seconds between retries

/**
 * WebSubManager handles WebSub subscriptions and notifications for podcast feeds
 * It implements the WebSub subscriber role as defined in the specification:
 * https://www.w3.org/TR/websub/
 */
class WebSubManager {
	private callbackUrl: string;

	constructor(baseUrl: string) {
		// Ensure the base URL has a protocol
		const url = new URL(
			baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`,
		);
		this.callbackUrl = new URL("/api/websub/callback", url).toString();
		this.startSubscriptionCleanup();
	}

	/**
	 * Discovers WebSub hubs from a podcast feed
	 * Checks both Link headers and feed XML for hub URLs
	 * @param feedUrl The URL of the podcast feed
	 * @returns Promise<string | null> The discovered hub URL or null if none found
	 */
	async discoverWebSubHub(feedUrl: string): Promise<string | null> {
		try {
			const response = await fetch(feedUrl);
			const text = await response.text();

			// Check Link headers first (preferred method)
			const linkHeader = response.headers.get("link");
			if (linkHeader) {
				const links = linkHeader.split(",");
				for (const link of links) {
					const [url, rel] = link.split(";").map((part) => part.trim());
					if (rel === 'rel="hub"') {
						return url.replace(/[<>]/g, "");
					}
				}
			}

			// Check for atom:link with hub relation in XML
			const atomLinkMatches = text.match(
				/<atom:link[^>]*rel=["']hub["'][^>]*href=["']([^"']+)["'][^>]*\/?>/i,
			);
			if (atomLinkMatches) {
				return atomLinkMatches[1];
			}

			// Check for regular link with hub relation in XML
			const linkMatches = text.match(
				/<link[^>]*rel=["']hub["'][^>]*href=["']([^"']+)["'][^>]*\/?>/i,
			);
			if (linkMatches) {
				return linkMatches[1];
			}

			// Check for link with href first and rel second
			const reverseLinkMatches = text.match(
				/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']hub["'][^>]*\/?>/i,
			);
			if (reverseLinkMatches) {
				return reverseLinkMatches[1];
			}

			// Check for common hub URLs if none found in feed
			const commonHubs = [
				"https://pubsubhubbub.appspot.com/",
				"https://pubsubhubbub.superfeedr.com/",
			];

			// Try to ping each hub to see if it's available
			for (const hub of commonHubs) {
				try {
					const hubResponse = await fetch(hub, { method: "HEAD" });
					if (hubResponse.ok) {
						return hub;
					}
				} catch (error) {
					// Log error and continue to next hub
					console.debug(`Hub ${hub} not available:`, error);
				}
			}

			return null;
		} catch (error) {
			console.error("Error discovering WebSub hub:", error);
			return null;
		}
	}

	/**
	 * Periodically checks for and removes expired subscriptions
	 * Runs every hour to maintain subscription state
	 */
	private startSubscriptionCleanup() {
		setInterval(async () => {
			try {
				const now = new Date();
				// Update status of expired subscriptions
				await db
					.update(websubSubscriptions)
					.set({ status: "expired" })
					.where(
						and(
							eq(websubSubscriptions.status, "active"),
							lt(websubSubscriptions.expiresAt, now),
						),
					);
			} catch (error) {
				console.error("Error cleaning up subscriptions:", error);
			}
		}, 3600000); // 1 hour
	}

	/**
	 * Initiates a subscription request to a WebSub hub
	 * @param feedUrl - The URL of the feed to subscribe to (topic)
	 * @param hubUrl - The URL of the WebSub hub
	 * @returns Promise<boolean> - Whether the subscription request was successful
	 */
	async subscribe(feedUrl: string, hubUrl: string): Promise<boolean> {
		let retryCount = 0;

		while (retryCount < MAX_RETRIES) {
			try {
				// Check if we already have an active subscription
				const existingSubscription =
					await db.query.websubSubscriptions.findFirst({
						where: and(
							eq(websubSubscriptions.topic, feedUrl),
							eq(websubSubscriptions.status, "active"),
						),
					});

				if (
					existingSubscription &&
					existingSubscription.expiresAt > new Date()
				) {
					console.log(`Active subscription already exists for ${feedUrl}`);
					return true;
				}

				// Generate a unique secret for this subscription
				const secret = this.generateSecret();

				// Prepare the subscription request according to WebSub spec
				const formData = new URLSearchParams();
				formData.append("hub.mode", "subscribe");
				formData.append("hub.topic", feedUrl);
				formData.append("hub.callback", this.callbackUrl);
				formData.append("hub.secret", secret);
				formData.append("hub.lease_seconds", DEFAULT_LEASE_SECONDS.toString());
				formData.append("hub.verify", "async"); // Use async verification to prevent timeouts

				console.log(
					`Sending subscription request to hub ${hubUrl} for ${feedUrl}`,
				);
				console.log(`Callback URL: ${this.callbackUrl}`);

				// Send subscription request to the hub
				const response = await fetch(hubUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: formData.toString(),
				});

				const responseBody = await response.text();
				console.log(`Hub response for ${feedUrl}:`, {
					status: response.status,
					statusText: response.statusText,
					body: responseBody,
					headers: Object.fromEntries(response.headers.entries()),
				});

				if (response.ok) {
					// Calculate expiration time for the subscription
					const expiresAt = new Date();
					expiresAt.setSeconds(expiresAt.getSeconds() + DEFAULT_LEASE_SECONDS);

					// Store subscription in database
					await db
						.insert(websubSubscriptions)
						.values({
							topic: feedUrl,
							hub: hubUrl,
							secret,
							leaseSeconds: DEFAULT_LEASE_SECONDS,
							expiresAt,
							status: "pending",
						})
						.onConflictDoUpdate({
							target: websubSubscriptions.topic,
							set: {
								hub: hubUrl,
								secret,
								leaseSeconds: DEFAULT_LEASE_SECONDS,
								expiresAt,
								status: "pending",
								updatedAt: new Date(),
							},
						});

					return true;
				}

				// If we get a 409 Conflict with a gateway timeout, wait and retry
				if (response.status === 409 && responseBody.includes("504")) {
					console.log(
						`Retry ${
							retryCount + 1
						}/${MAX_RETRIES} for ${feedUrl} due to gateway timeout`,
					);
					retryCount++;
					if (retryCount < MAX_RETRIES) {
						await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
						continue;
					}
				}

				console.error("Hub subscription failed:", {
					feedUrl,
					hubUrl,
					status: response.status,
					statusText: response.statusText,
					body: responseBody,
				});
				return false;
			} catch (error) {
				console.error("Error subscribing to WebSub hub:", {
					feedUrl,
					hubUrl,
					error: error instanceof Error ? error.message : error,
					retry: retryCount + 1,
				});

				retryCount++;
				if (retryCount < MAX_RETRIES) {
					await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
					continue;
				}
				return false;
			}
		}

		return false;
	}

	/**
	 * Handles subscription verification requests from the hub
	 * This is called when the hub verifies a subscription or unsubscription request
	 * @param query - URL parameters from the verification request
	 * @returns Response with appropriate status code and body
	 */
	async handleVerification(
		query: URLSearchParams,
	): Promise<{ statusCode: number; body: string }> {
		const mode = query.get("hub.mode");
		const topic = query.get("hub.topic");
		const challenge = query.get("hub.challenge");
		const leaseSeconds = parseInt(query.get("hub.lease_seconds") || "0", 10);

		console.log("Handling WebSub verification:", { mode, topic, leaseSeconds });

		if (!topic || !challenge) {
			return { statusCode: 400, body: "Missing required parameters" };
		}

		if (mode !== "subscribe" && mode !== "unsubscribe") {
			return { statusCode: 400, body: "Invalid mode" };
		}

		try {
			if (mode === "subscribe") {
				// Calculate expiration time
				const expiresAt = new Date();
				expiresAt.setSeconds(
					expiresAt.getSeconds() + (leaseSeconds || DEFAULT_LEASE_SECONDS),
				);

				// Update subscription status to active
				await db
					.update(websubSubscriptions)
					.set({
						status: "active",
						expiresAt,
						leaseSeconds: leaseSeconds || DEFAULT_LEASE_SECONDS,
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(websubSubscriptions.topic, topic),
							eq(websubSubscriptions.status, "pending"),
						),
					);

				console.log(`Subscription verified for ${topic}`);
			} else {
				// Update subscription status to expired for unsubscribe
				await db
					.update(websubSubscriptions)
					.set({
						status: "expired",
						updatedAt: new Date(),
					})
					.where(eq(websubSubscriptions.topic, topic));

				console.log(`Unsubscription verified for ${topic}`);
			}

			// Return the challenge string to confirm verification
			return { statusCode: 200, body: challenge };
		} catch (error) {
			console.error("Error handling verification:", error);
			return { statusCode: 500, body: "Internal server error" };
		}
	}

	/**
	 * Handles content notifications from the hub
	 * This is called when the hub sends updates about new/changed content
	 * @param topic - The feed URL that was updated
	 * @param signature - HMAC signature from the hub
	 * @param body - The notification content
	 * @returns Response with appropriate status code and body
	 */
	async handleNotification(
		topic: string,
		signature: string | null,
		body: string,
	): Promise<{ statusCode: number; body: string }> {
		console.log("Handling WebSub notification:", {
			topic,
			hasSignature: !!signature,
		});

		const subscription = await db.query.websubSubscriptions.findFirst({
			where: and(
				eq(websubSubscriptions.topic, topic),
				eq(websubSubscriptions.status, "active"),
			),
		});

		if (!subscription) {
			console.warn(`Received notification for unknown subscription: ${topic}`);
			return { statusCode: 404, body: "Subscription not found" };
		}

		// Verify the notification signature if provided
		if (signature) {
			const isValid = this.verifySignature(
				body,
				signature,
				subscription.secret,
			);
			if (!isValid) {
				console.warn(`Invalid signature for topic: ${topic}`);
				return { statusCode: 403, body: "Invalid signature" };
			}
		}

		try {
			// Process the update notification
			const result = await updatePodcastByFeedUrl(topic);
			console.log("WebSub notification processed:", result);
			return {
				statusCode: 200,
				body: JSON.stringify({
					message: "Update processed successfully",
					result,
				}),
			};
		} catch (error) {
			console.error("Error processing WebSub notification:", error);
			return { statusCode: 500, body: "Error processing update" };
		}
	}

	/**
	 * Generates a cryptographically secure random secret
	 * Used for HMAC verification of notifications
	 */
	private generateSecret(): string {
		return crypto.randomBytes(32).toString("hex");
	}

	/**
	 * Verifies the HMAC signature of a notification
	 * Uses constant-time comparison to prevent timing attacks
	 * @param body - The notification content
	 * @param signature - The signature provided by the hub
	 * @param secret - The secret key for this subscription
	 * @returns boolean - Whether the signature is valid
	 */
	private verifySignature(
		body: string,
		signature: string,
		secret: string,
	): boolean {
		try {
			const hmac = crypto.createHmac("sha1", secret);
			hmac.update(body);
			const computedSignature = `sha1=${hmac.digest("hex")}`;

			// Use a constant-time comparison to prevent timing attacks
			if (signature.length !== computedSignature.length) {
				return false;
			}

			let result = 0;
			for (let i = 0; i < signature.length; i++) {
				result |= signature.charCodeAt(i) ^ computedSignature.charCodeAt(i);
			}
			return result === 0;
		} catch (error) {
			console.error("Error verifying signature:", error);
			return false;
		}
	}
}

// Create a singleton instance for use throughout the application
const webSubManager = new WebSubManager(
	process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
		"http://localhost:3000",
);

export { webSubManager, WebSubManager };
