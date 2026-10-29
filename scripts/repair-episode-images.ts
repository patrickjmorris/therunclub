import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env" });

const PUBLIC_PREFIX =
	"https://akzhyzwiwjxtjuirmqyx.supabase.co/storage/v1/object/public/content-images/";

const dryRun = process.argv.includes("--dry-run");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString, {
	prepare: false,
	onnotice: () => {},
});

// Storage collapses repeated slashes in object names on write and on read, so
// a URL like episodes/https://host/x.webp resolves to episodes/https:/host/x.webp.
const missingEpisodeImages = sql`
	select e.id, e.episode_image
	from episodes e
	where e.episode_image like ${`${PUBLIC_PREFIX}%`}
	and not exists (
		select 1 from storage.objects o
		where o.bucket_id = 'content-images'
		and o.name = regexp_replace(
			substr(e.episode_image, ${PUBLIC_PREFIX.length + 1}),
			'/+', '/', 'g'
		)
	)
`;

async function countMissing(tx: postgres.Sql | postgres.TransactionSql) {
	const [row] = await tx<{ count: number }[]>`
		select count(*)::int as count from (${missingEpisodeImages}) m
	`;
	return row.count;
}

async function repairEpisodeImages() {
	const [{ withImage }] = await sql<{ withImage: number }[]>`
		select count(*)::int as "withImage" from episodes
		where episode_image is not null
	`;
	const missing = await countMissing(sql);
	console.log(`Episodes with episode_image: ${withImage}`);
	console.log(`Episodes whose episode_image object is missing: ${missing}`);

	if (dryRun) {
		const sample = await sql`
			select id, episode_image from (${missingEpisodeImages}) m limit 3
		`;
		console.log("Sample:", sample.map((row) => row.episode_image));
		console.log("Dry run: no changes written.");
		return;
	}

	await sql.begin(async (tx) => {
		await tx`
			create table if not exists episode_image_backup_20261029 (
				id uuid primary key,
				episode_image text not null
			)
		`;
		await tx`
			alter table episode_image_backup_20261029 enable row level security
		`;
		await tx`
			revoke all on table episode_image_backup_20261029
			from anon, authenticated
		`;
		const backedUp = await tx`
			insert into episode_image_backup_20261029 (id, episode_image)
			select id, episode_image from (${missingEpisodeImages}) m
			on conflict (id) do nothing
		`;
		const cleared = await tx`
			update episodes set episode_image = null
			where id in (select id from (${missingEpisodeImages}) m)
		`;
		console.log(`Backed up ${backedUp.count} rows`);
		console.log(`Cleared episode_image on ${cleared.count} rows`);
	});

	console.log(`Still missing after repair: ${await countMissing(sql)}`);
}

repairEpisodeImages()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(() => sql.end());
