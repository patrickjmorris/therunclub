import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "./schema";
import "dotenv/config";

const connectionString = process.env.LOCAL_DB_URL || "";

async function reset() {
	console.log("Resetting database...");
	console.log("Connection string:", connectionString);
	const sql = postgres(connectionString, { prepare: false });
	const db = drizzle(sql, { schema });

	// Drop all tables
	await sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `;

	console.log("All tables dropped");

	// Re-run migrations
	await migrate(db, { migrationsFolder: "./src/db/migrations" });

	console.log("Migrations completed");
	await sql.end();
}

reset().catch(console.error);
