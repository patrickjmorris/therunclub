import { db } from "@/db/client";
import { athletes, athleteCategories } from "@/db/schema";
import { sql } from "drizzle-orm";

async function migrateAthletes() {
	try {
		console.log("Starting athlete migration...");

		// 1. Create elite category
		console.log("Creating elite category...");
		const eliteCategory = await db
			.insert(athleteCategories)
			.values({
				name: "Elite",
				description: "World Athletics athletes",
			})
			.returning();

		// 2. Create other categories
		console.log("Creating other categories...");
		const otherCategories = await db
			.insert(athleteCategories)
			.values([
				{
					name: "Sub-elite",
					description: "Competitive athletes not in World Athletics",
				},
				{
					name: "Coach",
					description: "Running coaches and trainers",
				},
				{
					name: "Content Creator",
					description: "Running content creators and influencers",
				},
				{
					name: "Casual Runner",
					description: "Recreational runners",
				},
			])
			.returning();

		// 3. Backup existing athletes
		console.log("Creating backup of existing athletes...");
		await db.execute(sql`
		        CREATE TABLE athletes_backup AS
		        SELECT * FROM athletes;
		    `);

		// 4. Update existing athletes with new structure
		console.log("Updating existing athletes...");
		await db.execute(sql`
            ALTER TABLE athletes
            ADD COLUMN uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            -- ADD COLUMN world_athletics_id TEXT,
            -- ADD COLUMN category_id UUID REFERENCES athlete_categories(id);

            UPDATE athletes
            -- SET world_athletics_id = id,
            --     category_id = (SELECT id FROM athlete_categories WHERE name = 'Elite'),
            --     uuid = substr(md5(random()::text), 1, 10);

            -- ALTER TABLE athletes
            -- DROP CONSTRAINT athletes_pkey,
            -- ADD PRIMARY KEY (uuid),
            -- ADD CONSTRAINT unique_world_athletics_id UNIQUE (world_athletics_id);
        `);

		// 5. Update all related tables
		console.log("Updating related tables...");
		const relatedTables = [
			"athlete_honors",
			"athlete_results",
			"athlete_sponsors",
			"athlete_gear",
			"athlete_events",
			"athlete_mentions",
		];

		for (const table of relatedTables) {
			await db.execute(sql`
                -- First, drop any existing foreign key constraints
                DO $$ 
                BEGIN
                    IF EXISTS (
                        SELECT 1 
                        FROM information_schema.table_constraints 
                        WHERE table_name = ${sql.identifier(table)}
                        AND constraint_name = ${sql.identifier(
													`${table}_athlete_id_fkey`,
												)}
                    ) THEN
                        ALTER TABLE ${sql.identifier(table)}
                        DROP CONSTRAINT ${sql.identifier(
													`${table}_athlete_id_fkey`,
												)};
                    END IF;
                END $$;

                -- Add new column and update it
                ALTER TABLE ${sql.identifier(table)}
                ADD COLUMN new_athlete_id TEXT;

                UPDATE ${sql.identifier(table)} t
                SET new_athlete_id = a.uuid
                FROM athletes a
                WHERE t.athlete_id = a.world_athletics_id;

                -- Drop old column and rename new one
                ALTER TABLE ${sql.identifier(table)}
                DROP COLUMN athlete_id,
                RENAME COLUMN new_athlete_id TO athlete_id;

                -- Add NOT NULL constraint
                ALTER TABLE ${sql.identifier(table)}
                ALTER COLUMN athlete_id SET NOT NULL;

                -- Add foreign key constraint
                ALTER TABLE ${sql.identifier(table)}
                ADD CONSTRAINT ${sql.identifier(`${table}_athlete_id_fkey`)}
                FOREIGN KEY (athlete_id) REFERENCES athletes(uuid);
            `);
		}

		// 6. Verify data integrity
		console.log("Verifying data integrity...");
		const athleteCount = await db
			.select({ count: sql`count(*)` })
			.from(athletes);
		const backupCount = await db.execute(sql`
            SELECT COUNT(*) FROM athletes_backup
        `);

		console.log(`Original athlete count: ${backupCount[0].count}`);
		console.log(`New athlete count: ${athleteCount[0].count}`);

		if (backupCount[0].count !== athleteCount[0].count) {
			throw new Error("Data loss detected during migration");
		}

		console.log("Migration completed successfully!");
	} catch (error) {
		console.error("Migration failed:", error);
		throw error;
	}
}

// Run migration
migrateAthletes()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
