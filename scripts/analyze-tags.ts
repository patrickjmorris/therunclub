import "dotenv/config";
import { db } from "@/db/client";
import { contentTags } from "@/db/schema";
import { count, desc, countDistinct } from "drizzle-orm";
import { Command } from "commander";
import fs from "fs/promises";
import path from "path";

const program = new Command();

// Define the expected type for the result
type TagAnalysisResult = {
	tag: string;
	totalCount: number;
	distinctContentCount: number;
}[];

async function analyzeTags(
	limit: number | undefined,
	outputFile: string | undefined,
): Promise<TagAnalysisResult> {
	console.log(`Analyzing tags... ${limit ? `(Limit: ${limit})` : ""}`);

	try {
		const baseQuery = db
			.select({
				tag: contentTags.tag,
				totalCount: count(contentTags.id),
				distinctContentCount: countDistinct(contentTags.contentId),
			})
			.from(contentTags)
			.groupBy(contentTags.tag)
			.orderBy(desc(count(contentTags.id)));

		let tagAnalysis: TagAnalysisResult;
		if (limit !== undefined && limit > 0) {
			tagAnalysis = await baseQuery.limit(limit);
		} else {
			tagAnalysis = await baseQuery;
		}

		console.log(`Found ${tagAnalysis.length} unique tags.`);

		const outputData = JSON.stringify(tagAnalysis, null, 2);

		if (outputFile) {
			await fs.writeFile(path.resolve(outputFile), outputData);
			console.log(`Results saved to ${outputFile}`);
		} else {
			console.log(outputData);
		}

		return tagAnalysis;
	} catch (error) {
		console.error("Error analyzing tags:", error);
		process.exit(1);
	}
}

async function main() {
	program
		.name("analyze-tags")
		.description("Analyzes content tag frequency in the database.")
		.option(
			"-l, --limit <number>",
			"Limit the number of tags returned",
			parseInt,
		)
		.option("-o, --output <file>", "Output file path (JSON format)")
		.parse(process.argv);

	const options = program.opts();

	await analyzeTags(options.limit, options.output);

	console.log("Tag analysis complete.");
}

main().catch((err) => {
	console.error("Script failed:", err);
	process.exit(1);
});
