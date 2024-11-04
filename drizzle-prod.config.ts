import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: "aws-0-us-east-1.pooler.supabase.com",
    port: 6543,
    user: "postgres.akzhyzwiwjxtjuirmqyx",
    password: process.env.DATABASE_PASSWORD ?? "",
    database: "postgres",
    ssl: true,
  },
  verbose: true,
  strict: true,
}); 