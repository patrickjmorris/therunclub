import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });

const isDevelopment = process.env.NODE_ENV === "development";

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./src/db/migrations",
	dialect: "postgresql",
	dbCredentials: isDevelopment
		? {
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				url: process.env.LOCAL_DB_URL!,
		  }
		: {
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				url: process.env.DATABASE_URL!,
		  },
});
