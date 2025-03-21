"use server";

import { db } from "@/db/client";
import { athletes, athleteCategories } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";

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

const categorySchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	description: z.string().optional(),
});

export async function createAthlete(data: z.infer<typeof createAthleteSchema>) {
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
			throw new Error(error.errors[0].message);
		}
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("Failed to create athlete");
	}
}

export async function createCategory(data: z.infer<typeof categorySchema>) {
	try {
		const validatedData = categorySchema.parse(data);
		await db.insert(athleteCategories).values({
			name: validatedData.name,
			description: validatedData.description || null,
		});
		revalidatePath("/athletes");
	} catch (error) {
		console.error("Error creating category:", error);
		throw new Error("Failed to create category");
	}
}

export async function updateCategory(
	id: string,
	data: z.infer<typeof categorySchema>,
) {
	try {
		const validatedData = categorySchema.parse(data);
		await db
			.update(athleteCategories)
			.set({
				name: validatedData.name,
				description: validatedData.description || null,
			})
			.where(eq(athleteCategories.id, id));
		revalidatePath("/athletes");
	} catch (error) {
		console.error("Error updating category:", error);
		throw new Error("Failed to update category");
	}
}

export async function deleteCategory(id: string) {
	try {
		await db.delete(athleteCategories).where(eq(athleteCategories.id, id));
		revalidatePath("/athletes");
	} catch (error) {
		console.error("Error deleting category:", error);
		throw new Error("Failed to delete category");
	}
}
