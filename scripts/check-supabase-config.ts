import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables
config();

const requiredEnvVars = [
	"NEXT_PUBLIC_SUPABASE_URL",
	"SUPABASE_SERVICE_ROLE_KEY",
];

console.log("\nChecking Supabase configuration...\n");

// Check environment variables
let missingVars = false;
for (const envVar of requiredEnvVars) {
	if (!process.env[envVar]) {
		console.error(`❌ Missing ${envVar}`);
		missingVars = true;
	} else {
		console.log(`✅ ${envVar} is set`);
		// Show first few chars of values
		console.log(
			`   Value starts with: ${process.env[envVar]?.substring(0, 8)}...`,
		);
	}
}

if (missingVars) {
	console.error("\n❌ Missing required environment variables");
	process.exit(1);
}

// Test Supabase connection
const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL || "",
	process.env.SUPABASE_SERVICE_ROLE_KEY || "",
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	},
);

async function testConnection() {
	console.log("\nTesting Supabase connection...");

	try {
		// Test a simple query
		const { data, error } = await supabase
			.from("episodes")
			.select("id")
			.limit(1);

		if (error) {
			console.error("\n❌ Connection test failed");
			console.error("Error details:", {
				code: error.code,
				message: error.message,
				details: error.details,
				hint: error.hint,
			});
			return false;
		}

		// Test permissions by attempting to write
		const testId = `test-${Date.now()}`;
		const { error: writeError } = await supabase
			.from("athlete_mentions")
			.upsert({
				id: testId,
				athleteId: "test",
				episodeId: "test",
				source: "title",
				confidence: "1.0",
				context: "test",
			});

		if (writeError) {
			console.error("\n❌ Write permission test failed");
			console.error("Error details:", {
				code: writeError.code,
				message: writeError.message,
				details: writeError.details,
				hint: writeError.hint,
			});
			return false;
		}

		// Clean up test data
		await supabase.from("athlete_mentions").delete().eq("id", testId);

		console.log("\n✅ Connection and permissions test successful");
		return true;
	} catch (error) {
		console.error("\n❌ Connection test threw an error:", error);
		return false;
	}
}

testConnection().then((success) => {
	if (!success) {
		process.exit(1);
	}
});
