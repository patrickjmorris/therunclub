"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { contentTags } from "@/db/schema";
import { count, desc, eq, and, inArray, sql, countDistinct } from "drizzle-orm";
import { z } from "zod";

// --- Action to fetch unique tags --- <get_unique_tags>
export async function getUniqueTags(limit = 1000, offset = 0) {
	try {
		const tagCounts = await db
			.select({
				tag: contentTags.tag,
				count: count(contentTags.id),
			})
			.from(contentTags)
			.groupBy(contentTags.tag)
			.orderBy(desc(count(contentTags.id)))
			.limit(limit)
			.offset(offset);

		const totalCountResult = await db
			.select({ count: countDistinct(contentTags.tag) })
			.from(contentTags);

		const totalCount = totalCountResult[0]?.count ?? 0;

		return {
			success: true,
			tags: tagCounts,
			totalCount: totalCount,
		};
	} catch (error) {
		console.error("Error fetching unique tags:", error);
		return {
			success: false,
			error: "Failed to fetch tags",
			tags: [],
			totalCount: 0,
		};
	}
}
// --- </get_unique_tags> ---

// --- Action to consolidate tags --- <consolidate_tags>
const ConsolidateTagsSchema = z.object({
	variantTag: z.string().trim().min(1, "Variant tag cannot be empty."),
	canonicalTag: z.string().trim().min(1, "Canonical tag cannot be empty."),
});

// Define the state type returned by the action
export type ConsolidateTagsState = {
	success: boolean;
	error?: string;
	message?: string;
};

// Update action signature to accept previous state (required by useFormState)
export async function consolidateTagsAction(
	prevState: ConsolidateTagsState,
	formData: FormData,
): Promise<ConsolidateTagsState> {
	// Return the defined state type
	const validatedFields = ConsolidateTagsSchema.safeParse({
		variantTag: formData.get("variantTag"),
		canonicalTag: formData.get("canonicalTag"),
	});

	if (!validatedFields.success) {
		return {
			success: false,
			error: `Invalid input: ${JSON.stringify(
				validatedFields.error.flatten().fieldErrors,
			)}`,
		};
	}

	const { variantTag, canonicalTag } = validatedFields.data;

	if (variantTag.toLowerCase() === canonicalTag.toLowerCase()) {
		return {
			success: false,
			error: "Variant tag and canonical tag cannot be the same.",
		};
	}

	let totalUpdated = 0;
	let totalDeleted = 0;

	console.log(`Consolidating: "${variantTag}" -> "${canonicalTag}"`);

	try {
		// Use a transaction to ensure atomicity
		await db.transaction(async (tx) => {
			// Find all rows with the variant tag
			const sourceRows = await tx
				.select({
					id: contentTags.id,
					contentId: contentTags.contentId,
					contentType: contentTags.contentType,
				})
				.from(contentTags)
				.where(eq(contentTags.tag, variantTag));

			if (sourceRows.length === 0) {
				// Use throw to abort transaction if no source tags found
				throw new Error(`No content found with tag "${variantTag}".`);
			}

			const sourceContentIds = sourceRows.map((r) => r.contentId);

			// Find content IDs that *already* have the canonical tag
			const conflictingRows = await tx
				.selectDistinct({ contentId: contentTags.contentId })
				.from(contentTags)
				.where(
					and(
						eq(contentTags.tag, canonicalTag),
						inArray(contentTags.contentId, sourceContentIds),
					),
				);

			const conflictingContentIds = new Set(
				conflictingRows.map((r) => r.contentId),
			);

			// Determine IDs to delete (conflicts) and update (no conflicts)
			const idsToDelete = sourceRows
				.filter((r) => conflictingContentIds.has(r.contentId))
				.map((r) => r.id);

			const idsToUpdate = sourceRows
				.filter((r) => !conflictingContentIds.has(r.contentId))
				.map((r) => r.id);

			// Perform Deletions
			if (idsToDelete.length > 0) {
				console.log(
					`  Deleting ${idsToDelete.length} conflicting "${variantTag}" tags.`,
				);
				await tx
					.delete(contentTags)
					.where(inArray(contentTags.id, idsToDelete));
				totalDeleted = idsToDelete.length;
			}

			// Perform Updates
			if (idsToUpdate.length > 0) {
				console.log(
					`  Updating ${idsToUpdate.length} tags to "${canonicalTag}".`,
				);
				await tx
					.update(contentTags)
					.set({ tag: canonicalTag })
					.where(inArray(contentTags.id, idsToUpdate));
				totalUpdated = idsToUpdate.length;
			}
		}); // End transaction

		console.log("Consolidation successful.");
		// Revalidate the admin tags path to refresh the list
		revalidatePath("/admin/tags");
		return {
			success: true,
			message: `Consolidated "${variantTag}". Updated: ${totalUpdated}, Deleted: ${totalDeleted}.`,
		};
	} catch (error: unknown) {
		let errorMessage = "Failed to consolidate tags.";
		if (error instanceof Error) {
			console.error("Error consolidating tags:", error.message);
			errorMessage = error.message; // Use specific error from transaction if available
		} else {
			console.error("An unexpected error occurred:", error);
		}
		return { success: false, error: errorMessage };
	}
}
// --- </consolidate_tags> ---
