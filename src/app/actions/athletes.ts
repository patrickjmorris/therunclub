import { db } from "@/db/client";
import { athletes, athleteResults } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";
import { sql } from "drizzle-orm";

export async function deleteAthlete(id: string) {
	return requireRole(["admin", "editor"])(async () => {
		// Delete the athlete (disciplines will be deleted via foreign key cascade)
		await db.delete(athletes).where(eq(athletes.id, id));
		revalidatePath("/dashboard/athletes");
		revalidatePath("/athletes");
		return { success: true };
	})();
}

export async function bulkDeleteAthletes(ids: string[]) {
	return requireRole(["admin", "editor"])(async () => {
		// Delete the athletes (disciplines will be deleted via foreign key cascade)
		await db.delete(athletes).where(inArray(athletes.id, ids));
		revalidatePath("/dashboard/athletes");
		revalidatePath("/athletes");
		return { success: true };
	})();
}

export async function getAthletesForManagement() {
	await requireRole(["admin", "editor"]);

	const allAthletes = await db
		.select({
			id: athletes.id,
			name: athletes.name,
			slug: athletes.slug,
			countryName: athletes.countryName,
			countryCode: athletes.countryCode,
			imageUrl: athletes.imageUrl,
			createdAt: athletes.createdAt,
			updatedAt: athletes.updatedAt,
			disciplines: sql<
				string[]
			>`array_agg(DISTINCT ${athleteResults.discipline}) filter (where ${athleteResults.discipline} is not null)`,
		})
		.from(athletes)
		.leftJoin(athleteResults, eq(athletes.id, athleteResults.athleteId))
		.groupBy(athletes.id);

	return allAthletes;
}
