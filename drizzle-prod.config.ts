import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env" });

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./src/db/migrations",
	dialect: "postgresql",
	dbCredentials: {
		host: process.env.POSTGRES_HOST ?? "",
		port: parseInt(process.env.POSTGRES_PORT ?? "5432"),
		user: process.env.POSTGRES_USER ?? "",
		password: process.env.POSTGRES_PASSWORD ?? "",
		database: process.env.POSTGRES_DATABASE ?? "",
	},
});
