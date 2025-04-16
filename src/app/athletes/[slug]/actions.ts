"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import {
	athletes,
	athleteEvents,
	athleteSponsors,
	athleteGear,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth-utils";
import { processAthleteImage } from "@/lib/image-utils";
import { searchAthleteImage } from "@/lib/wikimedia";
import { createClient } from "@/utils/supabase/server";

interface ProfileData {
	bio?: string;
	socialMedia?: {
		twitter?: string;
		instagram?: string;
		facebook?: string;
		website?: string;
		strava?: string;
	};
	verified?: boolean;
	imageUrl?: string;
}

export const updateProfile = requireRole(["admin", "editor"])(
	async (slug: string, data: ProfileData) => {
		const { imageUrl, ...otherData } = data;
		let processedImageUrl = null;

		// Get the current athlete data to check for existing image
		const currentAthlete = await db.query.athletes.findFirst({
			where: eq(athletes.slug, slug),
		});

		if (!currentAthlete) {
			throw new Error("Athlete not found");
		}

		if (imageUrl) {
			try {
				processedImageUrl = await processAthleteImage(imageUrl);
				if (!processedImageUrl) {
					throw new Error("Failed to process image");
				}

				// If there's an existing image, delete it from storage
				if (currentAthlete?.imageUrl) {
					try {
						const supabase = await createClient();
						const oldImagePath = currentAthlete.imageUrl.split("/").pop();
						if (oldImagePath?.startsWith("athletes/")) {
							await supabase.storage
								.from("athlete-images")
								.remove([oldImagePath]);
						}
					} catch (deleteError) {
						console.error("Error deleting old image:", deleteError);
						// Continue with update even if delete fails
					}
				}
			} catch (error) {
				console.error("Error processing image:", error);
				throw new Error("Failed to process image URL");
			}
		}

		await db
			.update(athletes)
			.set({
				...otherData,
				imageUrl: processedImageUrl || undefined,
				updatedAt: sql`CURRENT_TIMESTAMP`,
			})
			.where(eq(athletes.slug, slug));

		revalidatePath(`/athletes/${slug}`);
	},
);

interface EventData {
	name: string;
	date: string;
	location?: string;
	discipline?: string;
	description?: string;
	website?: string;
	status: "upcoming" | "completed" | "cancelled";
	result?: {
		place?: number;
		time?: string;
		notes?: string;
	} | null;
}

export const addEvent = requireRole(["admin", "editor"])(
	async (slug: string, data: EventData) => {
		const athlete = await db.query.athletes.findFirst({
			where: eq(athletes.slug, slug),
		});

		if (!athlete) {
			throw new Error("Athlete not found");
		}

		await db.insert(athleteEvents).values({
			athleteId: athlete.id,
			name: data.name,
			date: sql`${data.date}::date`,
			location: data.location || null,
			discipline: data.discipline || null,
			description: data.description || null,
			website: data.website || null,
			status: data.status,
			result: data.result || null,
		});

		revalidatePath(`/athletes/${slug}`);
	},
);

export const updateEvent = requireRole(["admin", "editor"])(
	async (eventId: string, slug: string, data: EventData) => {
		const athlete = await db.query.athletes.findFirst({
			where: eq(athletes.slug, slug),
		});

		if (!athlete) {
			throw new Error("Athlete not found");
		}

		await db
			.update(athleteEvents)
			.set({
				name: data.name,
				date: sql`${data.date}::date`,
				location: data.location || null,
				discipline: data.discipline || null,
				description: data.description || null,
				website: data.website || null,
				status: data.status,
				result: data.result || null,
				updatedAt: sql`CURRENT_TIMESTAMP`,
			})
			.where(eq(athleteEvents.id, eventId));

		revalidatePath(`/athletes/${slug}`);
	},
);

export const deleteEvent = requireRole(["admin", "editor"])(
	async (eventId: string, slug: string) => {
		const athlete = await db.query.athletes.findFirst({
			where: eq(athletes.slug, slug),
		});

		if (!athlete) {
			throw new Error("Athlete not found");
		}

		await db.delete(athleteEvents).where(eq(athleteEvents.id, eventId));
		revalidatePath(`/athletes/${slug}`);
	},
);

interface SponsorData {
	name: string;
	website?: string;
	logo?: string;
	startDate?: string;
	endDate?: string;
	isPrimary?: boolean;
}

export const addSponsor = requireRole(["admin", "editor"])(
	async (slug: string, data: SponsorData) => {
		const athlete = await db.query.athletes.findFirst({
			where: eq(athletes.slug, slug),
		});

		if (!athlete) {
			throw new Error("Athlete not found");
		}

		const { startDate, endDate, ...rest } = data;
		await db.insert(athleteSponsors).values({
			athleteId: athlete.id,
			...rest,
			startDate: startDate ? sql`${startDate}::date` : null,
			endDate: endDate ? sql`${endDate}::date` : null,
		});
		revalidatePath(`/athletes/${slug}`);
	},
);

export const updateSponsor = requireRole(["admin", "editor"])(
	async (sponsorId: string, slug: string, data: Partial<SponsorData>) => {
		const athlete = await db.query.athletes.findFirst({
			where: eq(athletes.slug, slug),
		});

		if (!athlete) {
			throw new Error("Athlete not found");
		}

		const { startDate, endDate, ...rest } = data;
		await db
			.update(athleteSponsors)
			.set({
				...rest,
				startDate: startDate ? sql`${startDate}::date` : undefined,
				endDate: endDate ? sql`${endDate}::date` : undefined,
				updatedAt: sql`CURRENT_TIMESTAMP`,
			})
			.where(eq(athleteSponsors.id, sponsorId));
		revalidatePath(`/athletes/${slug}`);
	},
);

export const deleteSponsor = requireRole(["admin", "editor"])(
	async (sponsorId: string, slug: string) => {
		const athlete = await db.query.athletes.findFirst({
			where: eq(athletes.slug, slug),
		});

		if (!athlete) {
			throw new Error("Athlete not found");
		}

		await db.delete(athleteSponsors).where(eq(athleteSponsors.id, sponsorId));
		revalidatePath(`/athletes/${slug}`);
	},
);

interface GearData {
	name: string;
	brand: string;
	category:
		| "racing_shoes"
		| "training_shoes"
		| "shirts"
		| "shorts"
		| "tights"
		| "recovery"
		| "other";
	model?: string;
	description?: string;
	purchaseUrl?: string;
	imageUrl?: string;
	isCurrent?: boolean;
}

export const addGear = requireRole(["admin", "editor"])(
	async (slug: string, data: GearData) => {
		const athlete = await db.query.athletes.findFirst({
			where: eq(athletes.slug, slug),
		});

		if (!athlete) {
			throw new Error("Athlete not found");
		}

		await db.insert(athleteGear).values({
			athleteId: athlete.id,
			...data,
		});
		revalidatePath(`/athletes/${slug}`);
	},
);

export const updateGear = requireRole(["admin", "editor"])(
	async (gearId: string, slug: string, data: Partial<GearData>) => {
		const athlete = await db.query.athletes.findFirst({
			where: eq(athletes.slug, slug),
		});

		if (!athlete) {
			throw new Error("Athlete not found");
		}

		await db
			.update(athleteGear)
			.set({
				...data,
				updatedAt: sql`CURRENT_TIMESTAMP`,
			})
			.where(eq(athleteGear.id, gearId));
		revalidatePath(`/athletes/${slug}`);
	},
);

export const deleteGear = requireRole(["admin", "editor"])(
	async (gearId: string, slug: string) => {
		const athlete = await db.query.athletes.findFirst({
			where: eq(athletes.slug, slug),
		});

		if (!athlete) {
			throw new Error("Athlete not found");
		}

		await db.delete(athleteGear).where(eq(athleteGear.id, gearId));
		revalidatePath(`/athletes/${slug}`);
	},
);

export const updateAthleteImage = requireRole(["admin", "editor"])(
	async (slug: string) => {
		const athlete = await db.query.athletes.findFirst({
			where: eq(athletes.slug, slug),
		});

		if (!athlete) {
			throw new Error("Athlete not found");
		}

		// Search for new image
		const wikiImageUrl = await searchAthleteImage(athlete.name);
		if (!wikiImageUrl) {
			throw new Error("No suitable image found");
		}

		// Process and upload the new image
		const processedImageUrl = await processAthleteImage(wikiImageUrl);
		if (!processedImageUrl) {
			throw new Error("Failed to process image");
		}

		// Delete old image if it exists
		if (athlete.imageUrl) {
			try {
				const supabase = await createClient();
				const oldImagePath = athlete.imageUrl.split("/").pop();
				if (oldImagePath?.startsWith("athletes/")) {
					await supabase.storage.from("athlete-images").remove([oldImagePath]);
				}
			} catch (deleteError) {
				console.error("Error deleting old image:", deleteError);
				// Continue with update even if delete fails
			}
		}

		// Update the database with new image URL
		await db
			.update(athletes)
			.set({
				imageUrl: processedImageUrl,
				updatedAt: sql`CURRENT_TIMESTAMP`,
			})
			.where(eq(athletes.slug, slug));

		revalidatePath(`/athletes/${slug}`);
		return processedImageUrl;
	},
);
