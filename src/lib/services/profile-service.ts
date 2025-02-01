import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

// Get user profile
export const getProfile = unstable_cache(
	async (userId: string) => {
		return db.select().from(profiles).where(eq(profiles.id, userId));
	},
	["profile"],
	{ tags: ["profiles"] },
);
