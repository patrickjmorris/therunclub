import crypto from "crypto";
import { db } from "@/db/client";
import { websubSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

// Get environment from command line arguments or default to development
const args = process.argv.slice(2);
const envArg = args.find((arg) => arg.startsWith("--env="));
const env = envArg ? envArg.split("=")[1] : "development";
const topicArg = args.find((arg) => arg.startsWith("--topic="));
const topic = topicArg ? topicArg.split("=")[1] : null;

// Set environment variables based on environment
if (env === "production") {
	process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
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

async function testWebSubCallback() {
	try {
		console.log(`Starting WebSub callback test in ${env} environment...`);

		const baseUrl = ensureUrlHasProtocol(
			process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
				"http://localhost:3000",
		);
		const callbackUrl = new URL("/api/websub/callback", baseUrl).toString();
		console.log(`Using callback URL: ${callbackUrl}`);

		// If no topic is provided, find an active subscription
		let testTopic = topic;
		let testSecret = "";

		if (!testTopic) {
			console.log("No topic provided, finding an active subscription...");
			const activeSubscription = await db
				.select()
				.from(websubSubscriptions)
				.where(eq(websubSubscriptions.status, "active"))
				.limit(1)
				.then((rows) => rows[0]);

			if (!activeSubscription) {
				console.error(
					"No active subscriptions found. Please create a subscription first or specify a topic.",
				);
				process.exit(1);
			}

			testTopic = activeSubscription.topic;
			testSecret = activeSubscription.secret;
			console.log(`Found active subscription for topic: ${testTopic}`);
		} else {
			// If topic is provided, find the subscription to get the secret
			console.log(`Looking up subscription for provided topic: ${testTopic}`);
			const subscription = await db
				.select()
				.from(websubSubscriptions)
				.where(eq(websubSubscriptions.topic, testTopic))
				.limit(1)
				.then((rows) => rows[0]);

			if (subscription) {
				testSecret = subscription.secret;
				console.log(`Found subscription with status: ${subscription.status}`);
			} else {
				console.log(
					"No subscription found for the provided topic. Using a test secret.",
				);
				testSecret = crypto.randomBytes(32).toString("hex");
			}
		}

		// Test 1: Verification Request
		console.log("\n=== Test 1: Verification Request ===");
		const challenge = crypto.randomBytes(32).toString("hex");
		const verificationUrl = new URL(callbackUrl);
		verificationUrl.searchParams.append("hub.mode", "subscribe");
		verificationUrl.searchParams.append("hub.topic", testTopic);
		verificationUrl.searchParams.append("hub.challenge", challenge);
		verificationUrl.searchParams.append("hub.lease_seconds", "86400");

		console.log("Sending verification request to:", verificationUrl.toString());

		const verificationResponse = await fetch(verificationUrl.toString());
		const verificationText = await verificationResponse.text();

		console.log("Verification response:", {
			status: verificationResponse.status,
			body: verificationText,
		});

		if (verificationResponse.status === 200 && verificationText === challenge) {
			console.log("✅ Verification test passed!");
		} else {
			console.log("❌ Verification test failed!");
		}

		// Test 2: Notification Request
		console.log("\n=== Test 2: Notification Request ===");
		const testContent = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
        <channel>
          <title>Test Podcast</title>
          <item>
            <title>Test Episode</title>
            <pubDate>${new Date().toUTCString()}</pubDate>
            <guid>test-episode-${Date.now()}</guid>
            <enclosure url="https://example.com/test.mp3" type="audio/mpeg" length="1000" />
          </item>
        </channel>
      </rss>
    `;

		// Generate HMAC signature
		const hmac = crypto.createHmac("sha1", testSecret);
		hmac.update(testContent);
		const signature = `sha1=${hmac.digest("hex")}`;

		console.log("Sending notification with:", {
			topic: testTopic,
			hasSignature: !!signature,
			contentLength: testContent.length,
		});

		// Send test notification
		const notificationResponse = await fetch(callbackUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/xml",
				"X-Hub-Topic": testTopic,
				"X-Hub-Signature": signature,
			},
			body: testContent,
		});

		const notificationText = await notificationResponse.text();
		console.log("Notification response:", {
			status: notificationResponse.status,
			body: notificationText,
		});

		if (notificationResponse.status === 200) {
			console.log("✅ Notification test passed!");
		} else {
			console.log("❌ Notification test failed!");
		}

		// Test 3: Try with different header formats
		console.log("\n=== Test 3: Testing Different Header Formats ===");

		const headerFormats = [
			{ "Hub-Topic": testTopic, "Hub-Signature": signature },
			{ "hub.topic": testTopic, "hub.signature": signature },
		];

		for (let i = 0; i < headerFormats.length; i++) {
			const headerFormat = headerFormats[i];
			console.log(`\nTesting header format ${i + 1}:`, headerFormat);

			const headers = new Headers({
				"Content-Type": "application/xml",
			});

			// Add the custom headers using for...of instead of forEach
			for (const [key, value] of Object.entries(headerFormat)) {
				headers.append(key, value);
			}

			const formatResponse = await fetch(callbackUrl, {
				method: "POST",
				headers,
				body: testContent,
			});

			const formatText = await formatResponse.text();
			console.log(`Header format ${i + 1} response:`, {
				status: formatResponse.status,
				body: formatText,
			});

			if (formatResponse.status === 200) {
				console.log(`✅ Header format ${i + 1} test passed!`);
			} else {
				console.log(`❌ Header format ${i + 1} test failed!`);
			}
		}

		console.log("\n=== WebSub Callback Tests Complete ===");
	} catch (error) {
		console.error("Error running WebSub callback test:", error);
		process.exit(1);
	}
}

// Run the test
testWebSubCallback();
