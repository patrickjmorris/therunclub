import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import postgres from "postgres";

// Verifies the RLS lockdown: the service role can read, while the public
// anon key is denied on every public table.
config({ quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DATABASE_URL;

if (!url || !anonKey || !serviceKey || !dbUrl) {
	console.error(
		"Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY or DATABASE_URL",
	);
	process.exit(1);
}

const clientOptions = {
	auth: { autoRefreshToken: false, persistSession: false },
};
const service = createClient(url, serviceKey, clientOptions);
const anon = createClient(url, anonKey, clientOptions);

async function main() {
	const sql = postgres(dbUrl as string, { max: 1 });
	const rows = await sql<{ name: string }[]>`
		select tablename as name from pg_tables
		where schemaname = 'public' order by tablename`;
	await sql.end();

	let failures = 0;

	const { error: serviceError } = await service
		.from("podcasts")
		.select("id")
		.limit(1);
	if (serviceError) {
		console.error(`❌ service role read failed: ${serviceError.message}`);
		failures++;
	} else {
		console.log("✅ service role can read");
	}

	for (const { name } of rows) {
		const { data, error } = await anon.from(name).select("*").limit(1);
		if (error) continue;
		console.error(`❌ anon can read ${name} (${data?.length ?? 0} rows)`);
		failures++;
	}

	if (failures > 0) process.exit(1);
	console.log(`✅ anon denied on all ${rows.length} public tables`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
