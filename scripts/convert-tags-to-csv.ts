import "dotenv/config";
import { Command } from "commander";
import fs from "fs/promises";
import path from "path";

const program = new Command();

type TagAnalysisObject = {
	tag: string;
	totalCount: number;
	distinctContentCount: number;
};

// Function to escape CSV fields according to RFC 4180
function escapeCsvField(field: string | number): string {
	const stringField = String(field);
	// If the field contains a comma, double quote, or newline, enclose it in double quotes
	if (
		stringField.includes(",") ||
		stringField.includes('"') ||
		stringField.includes("\n")
	) {
		// Escape existing double quotes by doubling them
		const escapedField = stringField.replace(/"/g, '""');
		return `"${escapedField}"`;
	}
	return stringField;
}

async function convertJsonToCsv(inputFile: string, outputFile: string) {
	console.log(`Converting ${inputFile} to ${outputFile}...`);

	try {
		// Read the JSON file
		const inputFilePath = path.resolve(inputFile);
		const jsonData = await fs.readFile(inputFilePath, "utf-8");

		// Parse the JSON data
		const data: TagAnalysisObject[] = JSON.parse(jsonData);

		if (!Array.isArray(data) || data.length === 0) {
			console.log("Input JSON is empty or not an array. No CSV generated.");
			return;
		}

		// Get headers from the first object's keys
		const headers = Object.keys(data[0]);

		// Create CSV header row
		const csvHeader = headers.map(escapeCsvField).join(",");

		// Create CSV data rows
		const csvRows = data.map((row) => {
			return headers
				.map((header) => escapeCsvField(row[header as keyof TagAnalysisObject]))
				.join(",");
		});

		// Combine header and rows
		const csvContent = [csvHeader, ...csvRows].join("\n");

		// Write to the output CSV file
		const outputFilePath = path.resolve(outputFile);
		await fs.writeFile(outputFilePath, csvContent);

		console.log(
			`Successfully converted ${data.length} records to ${outputFile}`,
		);
	} catch (error: unknown) {
		// Type check before accessing properties
		if (error instanceof Error) {
			console.error("Error during conversion:", error.message);
			if (error instanceof SyntaxError) {
				console.error(
					"Failed to parse JSON. Please ensure the input file is valid JSON.",
				);
			}
		} else {
			console.error("An unexpected error occurred:", error);
		}
		process.exit(1);
	}
}

async function main() {
	program
		.name("convert-tags-to-csv")
		.description("Converts a JSON file from analyze-tags script to CSV format.")
		.requiredOption("-i, --input <file>", "Input JSON file path")
		.requiredOption("-o, --output <file>", "Output CSV file path")
		.parse(process.argv);

	const options = program.opts();

	await convertJsonToCsv(options.input, options.output);

	console.log("Conversion complete.");
}

main().catch((err) => {
	console.error("Script failed:", err);
	process.exit(1);
});
