import fetch from "node-fetch";
import * as crypto from "crypto";

/**
 * This script simulates a WebSub hub sending a notification to your callback endpoint
 * It helps verify that your endpoint can properly receive and process notifications
 */
async function testWebSubCallback() {
	// Configuration
	const baseUrl =
		process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
		"http://localhost:3000";
	const callbackUrl = `${baseUrl}/api/websub/callback`;
	const feedUrl = process.argv[2]; // Pass the feed URL as a command line argument

	if (!feedUrl) {
		console.error("Please provide a feed URL as an argument");
		console.error(
			"Example: npx tsx scripts/test-websub-callback.ts https://example.com/feed.xml",
		);
		process.exit(1);
	}

	// Generate a test secret
	const secret = crypto.randomBytes(32).toString("hex");

	// Create a simple XML payload that mimics a feed update
	const payload = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Test Feed</title>
    <link>${feedUrl}</link>
    <description>Test notification from script</description>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <item>
      <title>Test Item</title>
      <link>${feedUrl}/test-item</link>
      <guid>${feedUrl}/test-item</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>This is a test notification sent at ${new Date().toISOString()}</description>
    </item>
  </channel>
</rss>`;

	// Generate HMAC signature
	const hmac = crypto.createHmac("sha1", secret);
	hmac.update(payload);
	const signature = `sha1=${hmac.digest("hex")}`;

	console.log(`Sending test notification to ${callbackUrl}`);
	console.log(`Feed URL: ${feedUrl}`);
	console.log(`Payload size: ${payload.length} bytes`);

	try {
		// Send the notification
		const response = await fetch(callbackUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/xml",
				"X-Hub-Topic": feedUrl,
				"X-Hub-Signature": signature,
			},
			body: payload,
		});

		console.log(`Response status: ${response.status}`);
		console.log(`Response text: ${await response.text()}`);

		if (response.ok) {
			console.log("✅ Test notification sent successfully!");
			console.log("Check your logs to see if it was processed correctly.");
		} else {
			console.error("❌ Failed to send test notification");
		}
	} catch (error) {
		console.error("Error sending test notification:", error);
	}
}

testWebSubCallback();
