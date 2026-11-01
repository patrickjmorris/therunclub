"use server";

import { db } from "@/db/client";
import { athletes } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireContentManager } from "@/lib/auth-utils";

const createAthleteSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	slug: z.string().min(2, "Slug must be at least 2 characters"),
	categoryId: z.string().uuid("Invalid category"),
	worldAthleticsId: z.string().optional(),
	countryCode: z.string().optional(),
	countryName: z.string().optional(),
	dateOfBirth: z.string().optional(),
	bio: z.string().optional(),
	socialMedia: z
		.object({
			twitter: z.string().optional(),
			instagram: z.string().optional(),
			facebook: z.string().optional(),
			website: z.string().optional(),
			strava: z.string().optional(),
		})
		.optional(),
});

export async function createAthlete(data: z.infer<typeof createAthleteSchema>) {
	await requireContentManager();
	try {
		// Validate input data
		const validatedData = createAthleteSchema.parse(data);

		// Check if slug is unique
		const existingAthlete = await db.query.athletes.findFirst({
			where: (athletes, { eq }) => eq(athletes.slug, validatedData.slug),
		});

		if (existingAthlete) {
			throw new Error("An athlete with this slug already exists");
		}

		// Check if World Athletics ID is unique if provided
		if (validatedData.worldAthleticsId) {
			const existingWorldAthleticsId = await db.query.athletes.findFirst({
				where: (athletes, { eq }) =>
					eq(athletes.worldAthleticsId, validatedData.worldAthleticsId || ""),
			});

			if (existingWorldAthleticsId) {
				throw new Error(
					"An athlete with this World Athletics ID already exists",
				);
			}
		}

		// Create the athlete
		await db.insert(athletes).values({
			name: validatedData.name,
			slug: validatedData.slug,
			categoryId: validatedData.categoryId,
			worldAthleticsId: validatedData.worldAthleticsId || null,
			countryCode: validatedData.countryCode || null,
			countryName: validatedData.countryName || null,
			dateOfBirth: validatedData.dateOfBirth || null,
			bio: validatedData.bio || null,
			socialMedia: validatedData.socialMedia || null,
			verified: false,
		});

		// Revalidate the athletes page
		revalidatePath("/athletes");

		return { success: true };
	} catch (error) {
		console.error("Error creating athlete:", error);
		if (error instanceof z.ZodError) {
			throw new Error(error.issues[0].message);
		}
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("Failed to create athlete");
	}
}
