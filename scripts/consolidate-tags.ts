import "dotenv/config";
import { db } from "@/db/client";
import { contentTags } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { Command } from "commander";
import fs from "fs/promises";
import path from "path";

const program = new Command();

type ConsolidationMap = Record<string, string>;

async function consolidateTags(mapFile: string, dryRun: boolean) {
	console.log(
		`Consolidating tags using map: ${mapFile} ${dryRun ? "(Dry Run)" : ""}`,
	);

	let consolidationMap: ConsolidationMap = {};
	try {
		const mapFilePath = path.resolve(mapFile);
		const mapData = await fs.readFile(mapFilePath, "utf-8");
		consolidationMap = JSON.parse(mapData);
		console.log(`Loaded ${Object.keys(consolidationMap).length} mappings.`);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error(
				`Error reading or parsing map file ${mapFile}:`,
				error.message,
			);
		} else {
			console.error(
				"An unexpected error occurred while loading map file:",
				error,
			);
		}
		process.exit(1);
	}

	let totalUpdated = 0;
	let totalDeleted = 0;

	for (const [sourceTag, canonicalTag] of Object.entries(consolidationMap)) {
		if (!sourceTag || !canonicalTag || sourceTag === canonicalTag) {
			// Skip invalid or redundant mappings
			continue;
		}

		console.log(`Processing: "${sourceTag}" -> "${canonicalTag}"`);

		try {
			// Find all content IDs that have the source tag
			const sourceRows = await db
				.select({
					contentId: contentTags.contentId,
					id: contentTags.id,
				})
				.from(contentTags)
				.where(eq(contentTags.tag, sourceTag));

			if (sourceRows.length === 0) {
				console.log(`  No content found with tag "${sourceTag}". Skipping.`);
				continue;
			}

			const sourceContentIds = sourceRows.map((r) => r.contentId);

			// Find which of these content IDs *already* have the canonical tag
			const conflictingRows = await db
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

			// Determine which source rows need deletion vs. update
			const idsToDelete = sourceRows
				.filter((r) => conflictingContentIds.has(r.contentId))
				.map((r) => r.id);

			const idsToUpdate = sourceRows
				.filter((r) => !conflictingContentIds.has(r.contentId))
				.map((r) => r.id);

			// Perform Deletions (for conflicts)
			if (idsToDelete.length > 0) {
				console.log(
					`  Deleting ${idsToDelete.length} "${sourceTag}" tags (conflict with existing "${canonicalTag}")`,
				);
				if (!dryRun) {
					await db
						.delete(contentTags)
						.where(inArray(contentTags.id, idsToDelete));
				}
				totalDeleted += idsToDelete.length;
			}

			// Perform Updates (no conflicts)
			if (idsToUpdate.length > 0) {
				console.log(
					`  Updating ${idsToUpdate.length} tags from "${sourceTag}" to "${canonicalTag}"`,
				);
				if (!dryRun) {
					await db
						.update(contentTags)
						.set({ tag: canonicalTag })
						.where(inArray(contentTags.id, idsToUpdate));
				}
				totalUpdated += idsToUpdate.length;
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error(
					`  Error processing mapping "${sourceTag}" -> "${canonicalTag}":`,
					error.message,
				);
				// Decide if you want to continue to the next mapping or exit
				// process.exit(1);
			} else {
				console.error(
					"  An unexpected error occurred during processing:",
					error,
				);
			}
		}
	}

	console.log("--- Consolidation Summary ---");
	console.log(
		`Total mappings processed: ${Object.keys(consolidationMap).length}`,
	);
	console.log(`Total tags updated: ${totalUpdated}`);
	console.log(`Total tags deleted (due to conflict): ${totalDeleted}`);
	if (dryRun) {
		console.log(
			"\nNOTE: Dry run mode. No actual changes were made to the database.",
		);
	}
	console.log("---------------------------");
}

async function main() {
	program
		.name("consolidate-tags")
		.description("Consolidates content tags based on a JSON mapping file.")
		.option(
			"-m, --map-file <file>",
			"Path to the JSON consolidation map file",
			"tag-consolidation-map.json", // Default value
		)
		.option("--dry-run", "Perform a dry run without modifying the database")
		.parse(process.argv);

	const options = program.opts();

	await consolidateTags(options.mapFile, options.dryRun || false);

	console.log("\nConsolidation script finished.");
}

main().catch((err) => {
	console.error("\nScript failed unexpectedly:", err);
	process.exit(1);
});
