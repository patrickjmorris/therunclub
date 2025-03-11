import { db } from "../src/db/client";
import { athletes } from "@/db/schema";
import { slugify } from "@/lib/utils";
import { sql } from "drizzle-orm";

async function generateSlugs() {
	// Get all athletes without slugs
	const athletesWithoutSlugs = await db
		.select({
			id: athletes.id,
			name: athletes.name,
		})
		.from(athletes)
		.where(sql`${athletes.slug} IS NULL`);

	// console.log(`Found ${athletesWithoutSlugs.length} athletes without slugs`);

	// Update each athlete with a slug
	for (const athlete of athletesWithoutSlugs) {
		const nameSlug = slugify(athlete.name);
		const uniqueSlug = `${nameSlug}-${athlete.id}`;
		console.log(`Generating slug for ${athlete.name}: ${uniqueSlug}`);

		await db
			.update(athletes)
			.set({
				slug: uniqueSlug,
				updatedAt: sql`CURRENT_TIMESTAMP`,
			})
			.where(sql`${athletes.id} = ${athlete.id}`);
	}

	// console.log("✅ Slug generation completed successfully");
}

// Run the script
generateSlugs()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("❌ Slug generation failed:", error);
		process.exit(1);
	});
