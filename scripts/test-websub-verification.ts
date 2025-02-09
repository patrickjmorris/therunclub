import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { websubSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// Get environment from command line arguments or default to development
const args = process.argv.slice(2);
const envArg = args.find((arg) => arg.startsWith("--env="));
const env = envArg ? envArg.split("=")[1] : "development";

// Set environment variables based on environment
if (env === "production") {
	process.env.NEXT_PUBLIC_APP_URL;
	process.env.DATABASE_URL;
} else {
	process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
}

// Create database client based on environment
// biome-ignore lint/style/noNonNullAssertion: <explanation>
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function testWebSubVerification() {
	try {
		// Get all pending subscriptions
		const pendingSubscriptions = await db
			.select()
			.from(websubSubscriptions)
			.where(eq(websubSubscriptions.status, "pending"));

		console.log(
			`Found ${pendingSubscriptions.length} pending subscriptions to verify`,
		);

		for (const subscription of pendingSubscriptions) {
			try {
				// Generate a random challenge string
				const challenge = crypto.randomBytes(32).toString("hex");

				// Construct the verification URL with required parameters
				const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
				const verificationUrl = new URL(`${baseUrl}/api/websub/callback`);
				verificationUrl.searchParams.append("hub.mode", "subscribe");
				verificationUrl.searchParams.append("hub.topic", subscription.topic);
				verificationUrl.searchParams.append("hub.challenge", challenge);
				verificationUrl.searchParams.append(
					"hub.lease_seconds",
					subscription.leaseSeconds.toString(),
				);

				console.log("\nTesting verification for subscription:");
				console.log(`Topic: ${subscription.topic}`);
				console.log(`URL: ${verificationUrl.toString()}`);

				// Make the verification request
				const response = await fetch(verificationUrl.toString());
				const responseText = await response.text();

				console.log("Response status:", response.status);
				console.log("Response body:", responseText);

				// Check if verification was successful
				if (response.status === 200 && responseText === challenge) {
					console.log("✅ Verification successful!");
				} else {
					console.log("❌ Verification failed");
					console.log("Expected challenge:", challenge);
					console.log("Received response:", responseText);
				}
			} catch (error) {
				console.error(
					`Error testing subscription ${subscription.topic}:`,
					error,
				);
			}

			// Add a small delay between requests
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		// Close the database connection
		await client.end();
	} catch (error) {
		console.error("Error running WebSub verification test:", error);
		// Make sure to close the connection even if there's an error
		await client.end();
		process.exit(1);
	}
}

// Run the test
console.log(`Starting WebSub verification test in ${env} environment...`);
console.log(`Using database: ${process.env.DATABASE_URL}`);
console.log(
	`Using endpoint: ${process.env.NEXT_PUBLIC_APP_URL}/api/websub/callback`,
);

testWebSubVerification();
