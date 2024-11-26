import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env" });

// Default to development unless explicitly set to production
const isDevelopment = process.env.NODE_ENV !== "production";

const connectionString = isDevelopment
  ? process.env.LOCAL_DB_URL ?? ""
  : process.env.DATABASE_URL ?? "";

if (!connectionString) {
  throw new Error("Database connection string is not defined");
}

console.log("Environment:", isDevelopment ? "development" : "production");
console.log("Using connection:", connectionString.split("@")[1]); // Log only host part for security

export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);
