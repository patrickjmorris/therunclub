import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { type WebSubSubscription, websubSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// Get environment from command line arguments or default to development
const args = process.argv.slice(2);
const envArg = args.find((arg) => arg.startsWith("--env="));
const env = envArg ? envArg.split("=")[1] : "development";

// Set environment variables based on environment
if (env === "production") {
	process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
	process.env.DATABASE_URL;
} else {
	process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL =
		"http://localhost:3000";
}

// Helper function to ensure URL has protocol
function ensureUrlHasProtocol(url: string): string {
	if (!url.startsWith("http://") && !url.startsWith("https://")) {
		return `https://${url}`;
	}
	return url;
}

// Create database client based on environment
// biome-ignore lint/style/noNonNullAssertion: <explanation>
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function testWebSubIntegration() {
	try {
		console.log(`Starting WebSub integration test in ${env} environment...`);
		console.log(`Using database: ${process.env.DATABASE_URL}`);

		const baseUrl = ensureUrlHasProtocol(
			process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
				"http://localhost:3000",
		);
		console.log(`Using endpoint: ${baseUrl}/api/websub/callback`);

		// Test 1: URL Construction
		console.log("\n=== Test 1: URL Construction ===");
		const callbackUrl = new URL("/api/websub/callback", baseUrl);
		console.log("Constructed callback URL:", callbackUrl.toString());

		// Test 2: Subscription Process
		console.log("\n=== Test 2: Subscription Process ===");
		const testFeedUrl = "https://anchor.fm/s/f97770a0/podcast/rss";
		const hubUrl = "https://pubsubhubbub.appspot.com/";

		// Generate test subscription data
		const secret = crypto.randomBytes(32).toString("hex");
		const leaseSeconds = 86400; // 24 hours

		// Prepare subscription request
		const formData = new URLSearchParams();
		formData.append("hub.mode", "subscribe");
		formData.append("hub.topic", testFeedUrl);
		formData.append("hub.callback", callbackUrl.toString());
		formData.append("hub.secret", secret);
		formData.append("hub.lease_seconds", leaseSeconds.toString());
		formData.append("hub.verify", "async");

		console.log("Sending subscription request to hub:", {
			hubUrl,
			feedUrl: testFeedUrl,
			callbackUrl: callbackUrl.toString(),
		});

		// Send subscription request
		const response = await fetch(hubUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: formData.toString(),
		});

		const responseBody = await response.text();
		console.log("Hub response:", {
			status: response.status,
			statusText: response.statusText,
			body: responseBody,
		});

		// Test 3: Verification Process
		console.log("\n=== Test 3: Verification Process ===");
		const challenge = crypto.randomBytes(32).toString("hex");
		const verificationUrl = new URL(callbackUrl);
		verificationUrl.searchParams.append("hub.mode", "subscribe");
		verificationUrl.searchParams.append("hub.topic", testFeedUrl);
		verificationUrl.searchParams.append("hub.challenge", challenge);
		verificationUrl.searchParams.append(
			"hub.lease_seconds",
			leaseSeconds.toString(),
		);

		console.log("Testing verification URL:", verificationUrl.toString());

		// Make verification request
		const verificationResponse = await fetch(verificationUrl.toString());
		const verificationText = await verificationResponse.text();

		console.log("Verification response:", {
			status: verificationResponse.status,
			body: verificationText,
		});

		// Wait for subscription to be verified and active
		console.log("\nWaiting for subscription to be verified...");
		let subscription = null;
		let attempts = 0;
		const maxAttempts = 10;
		const delay = 2000; // 2 seconds

		while (attempts < maxAttempts) {
			subscription = await db
				.select()
				.from(websubSubscriptions)
				.where(eq(websubSubscriptions.topic, testFeedUrl))
				.limit(1)
				.then((rows) => rows[0]);

			if (subscription?.status === "active") {
				console.log("Subscription verified and active!");
				break;
			}

			console.log(
				`Subscription status: ${subscription?.status || "not found"}`,
			);
			await new Promise((resolve) => setTimeout(resolve, delay));
			attempts++;
		}

		if (!subscription || subscription.status !== "active") {
			console.error("Failed to verify subscription after maximum attempts");
			return;
		}

		// Test 4: Notification Handling
		console.log("\n=== Test 4: Notification Handling ===");
		const notificationUrl = new URL(callbackUrl);
		const testContent = "Test notification content";

		// Generate HMAC signature
		const hmac = crypto.createHmac("sha1", subscription.secret);
		hmac.update(testContent);
		const signature = `sha1=${hmac.digest("hex")}`;

		console.log("Sending test notification with:", {
			topic: testFeedUrl,
			hasSignature: !!signature,
		});

		// Send test notification
		const notificationResponse = await fetch(notificationUrl.toString(), {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"X-Hub-Topic": testFeedUrl,
				"X-Hub-Signature": signature,
			},
			body: testContent,
		});

		const notificationText = await notificationResponse.text();
		console.log("Notification response:", {
			status: notificationResponse.status,
			body: notificationText,
		});

		// Cleanup: Remove test subscription
		console.log("\n=== Cleanup ===");
		await db
			.delete(websubSubscriptions)
			.where(eq(websubSubscriptions.topic, testFeedUrl));

		console.log("Test subscription removed");

		// Close the database connection
		await client.end();
	} catch (error) {
		console.error("Error running WebSub integration test:", error);
		// Make sure to close the connection even if there's an error
		await client.end();
		process.exit(1);
	}
}

// Run the test
testWebSubIntegration();
