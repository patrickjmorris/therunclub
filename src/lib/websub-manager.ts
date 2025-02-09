import { db } from "@/db/client";
import { podcasts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updatePodcastByFeedUrl } from "./podcast-service";
import * as crypto from "crypto";

const SUBSCRIPTION_VERIFY_TIMEOUT = 60000; // 1 minute timeout for subscription verification
const DEFAULT_LEASE_SECONDS = 86400; // 24 hours

interface WebSubSubscription {
	topic: string; // The feed URL
	hub: string; // The hub URL
	leaseSeconds: number; // How long the subscription is valid for
	secret: string; // Secret for verifying hub notifications
	expiresAt: Date; // When the subscription expires
	status: "pending" | "active" | "expired";
}

class WebSubManager {
	private subscriptions: Map<string, WebSubSubscription> = new Map();
	private callbackUrl: string;

	constructor(baseUrl: string) {
		this.callbackUrl = `${baseUrl}/api/websub/callback`;
		this.startSubscriptionCleanup();
	}

	private startSubscriptionCleanup() {
		// Check for expired subscriptions every hour
		setInterval(() => {
			const now = new Date();
			for (const [topic, subscription] of this.subscriptions.entries()) {
				if (subscription.expiresAt < now) {
					this.subscriptions.delete(topic);
				}
			}
		}, 3600000); // 1 hour
	}

	async subscribe(feedUrl: string, hubUrl: string): Promise<boolean> {
		try {
			const secret = this.generateSecret();
			const formData = new URLSearchParams();
			formData.append("hub.mode", "subscribe");
			formData.append("hub.topic", feedUrl);
			formData.append("hub.callback", this.callbackUrl);
			formData.append("hub.secret", secret);
			formData.append("hub.lease_seconds", DEFAULT_LEASE_SECONDS.toString());
			formData.append("hub.verify", "sync"); // Support both sync and async verification

			const response = await fetch(hubUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: formData.toString(),
			});

			if (response.ok) {
				const expiresAt = new Date();
				expiresAt.setSeconds(expiresAt.getSeconds() + DEFAULT_LEASE_SECONDS);

				this.subscriptions.set(feedUrl, {
					topic: feedUrl,
					hub: hubUrl,
					leaseSeconds: DEFAULT_LEASE_SECONDS,
					secret,
					expiresAt,
					status: "pending",
				});
				return true;
			}

			console.error("Hub subscription failed:", {
				status: response.status,
				statusText: response.statusText,
				body: await response.text(),
			});
			return false;
		} catch (error) {
			console.error("Error subscribing to WebSub hub:", error);
			return false;
		}
	}

	async handleVerification(
		query: URLSearchParams,
	): Promise<{ statusCode: number; body: string }> {
		const mode = query.get("hub.mode");
		const topic = query.get("hub.topic");
		const challenge = query.get("hub.challenge");
		const leaseSeconds = query.get("hub.lease_seconds");

		console.log("Handling WebSub verification:", { mode, topic, leaseSeconds });

		if (!topic || !challenge) {
			return { statusCode: 400, body: "Missing required parameters" };
		}

		if (mode === "subscribe" || mode === "unsubscribe") {
			// Verify this is a topic we're interested in
			const podcast = await db.query.podcasts.findFirst({
				where: eq(podcasts.feedUrl, topic),
			});

			if (!podcast) {
				return { statusCode: 404, body: "Topic not found" };
			}

			const subscription = this.subscriptions.get(topic);

			if (mode === "subscribe") {
				if (!subscription) {
					console.warn(
						`Received verification for unknown subscription: ${topic}`,
					);
					return { statusCode: 404, body: "Subscription not found" };
				}

				if (leaseSeconds) {
					const expiresAt = new Date();
					expiresAt.setSeconds(
						expiresAt.getSeconds() + parseInt(leaseSeconds, 10),
					);
					subscription.leaseSeconds = parseInt(leaseSeconds, 10);
					subscription.expiresAt = expiresAt;
					subscription.status = "active";
				}
			} else if (mode === "unsubscribe") {
				this.subscriptions.delete(topic);
			}

			return { statusCode: 200, body: challenge };
		}

		return { statusCode: 400, body: "Invalid mode" };
	}

	async handleNotification(
		topic: string,
		signature: string | null,
		body: string,
	): Promise<{ statusCode: number; body: string }> {
		console.log("Handling WebSub notification:", {
			topic,
			hasSignature: !!signature,
		});

		const subscription = this.subscriptions.get(topic);

		if (!subscription) {
			console.warn(`Received notification for unknown subscription: ${topic}`);
			return { statusCode: 404, body: "Subscription not found" };
		}

		if (subscription.status !== "active") {
			console.warn(`Received notification for inactive subscription: ${topic}`);
			return { statusCode: 403, body: "Subscription not active" };
		}

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
			// Update the podcast content
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

	private generateSecret(): string {
		return crypto.randomBytes(32).toString("hex");
	}

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

// Create a singleton instance
const webSubManager = new WebSubManager(
	process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
);

export { webSubManager, WebSubManager };
