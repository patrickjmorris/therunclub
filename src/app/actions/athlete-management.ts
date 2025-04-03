"use server";

import { db } from "@/db/client";
import { athletes, athleteResults } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";

export type AthleteManagementData = {
	id: string;
	name: string;
	slug: string;
	countryName: string | null;
	countryCode: string | null;
	disciplines: string[];
	imageUrl: string | null;
	createdAt: string;
	updatedAt: string;
};

export async function deleteAthleteAction(id: string) {
	return requireRole(["admin", "editor"])(async () => {
		await db.delete(athletes).where(eq(athletes.id, id));
		revalidatePath("/dashboard/athletes");
		revalidatePath("/athletes");
		return { success: true };
	})();
}

export async function bulkDeleteAthletesAction(ids: string[]) {
	return requireRole(["admin", "editor"])(async () => {
		await db.delete(athletes).where(inArray(athletes.id, ids));
		revalidatePath("/dashboard/athletes");
		revalidatePath("/athletes");
		return { success: true };
	})();
}

export async function getAthletesForManagement(): Promise<
	AthleteManagementData[]
> {
	return requireRole(["admin", "editor"])(async () => {
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
				>`array_agg(DISTINCT ${athleteResults.discipline}) FILTER (WHERE ${athleteResults.discipline} IS NOT NULL)`,
			})
			.from(athletes)
			.leftJoin(
				athleteResults,
				eq(athletes.worldAthleticsId, athleteResults.athleteId),
			)
			.groupBy(athletes.id);

		return allAthletes.map((athlete) => ({
			...athlete,
			createdAt: athlete.createdAt?.toISOString() ?? new Date().toISOString(),
			updatedAt: athlete.updatedAt?.toISOString() ?? new Date().toISOString(),
			disciplines: athlete.disciplines || [],
		}));
	})();
}
