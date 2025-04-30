import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { config } from "dotenv"; // Import dotenv config
import { resolve } from "path";

// Load .env file from the project root
config({ path: resolve(process.cwd(), ".env") });

import { ShoesScraper } from "../lib/scraper/shoes";
import { ApparelScraper } from "../lib/scraper/apparel"; // Import the new scraper

// Define base URL and main category entry points
const BASE_URL = "https://www.runningwarehouse.com";
const CATEGORY_PATHS = {
	// Renamed for clarity
	shoes: {
		mens: "/mens-running-shoes.html",
		womens: "/womens-running-shoes.html",
	},
	apparel: {
		mens: "/mens-running-apparel.html",
		womens: "/womens-running-apparel.html",
	},
	// Future: Add spikes, tools, fuel
};

async function main() {
	const argv = await yargs(hideBin(process.argv))
		.option("category", {
			alias: "c",
			describe: "Category to scrape",
			type: "string",
			choices: ["shoes", "apparel"], // Add apparel
			default: "shoes",
		})
		.option("gender", {
			alias: "g",
			describe: "Gender for shoe category (mens/womens)",
			type: "string",
			choices: ["mens", "womens"],
			// Default to scraping both if not specified?
			// For now, let's make it required if category is shoes
		})
		.demandOption(["category"], "Please specify a category to scrape.")
		// Make gender required only if category is shoes
		.implies("category", "gender")
		.help()
		.alias("help", "h")
		.parseAsync();

	console.log("Starting Manual Gear Scrape...");
	console.log(`Arguments: Category=${argv.category}, Gender=${argv.gender}`);
	const startTime = Date.now();

	// Determine category and gender
	const category = argv.category as keyof typeof CATEGORY_PATHS;
	const gender = argv.gender as keyof (typeof CATEGORY_PATHS)[typeof category]; // Type depends on category

	if (!CATEGORY_PATHS[category] || !CATEGORY_PATHS[category][gender]) {
		console.error(
			`Invalid category (${category}) or gender (${gender}) specified.`,
		);
		process.exit(1);
	}

	const categoryUrl = `${BASE_URL}${CATEGORY_PATHS[category][gender]}`;
	let scraper: ShoesScraper | ApparelScraper; // Explicitly type scraper
	let successMessage = "";
	let errorMessage = "";

	// Instantiate the correct scraper based on category
	if (category === "shoes") {
		scraper = new ShoesScraper(gender);
		successMessage = `✅ Shoes scrape (${gender}) finished successfully`;
		errorMessage = `❌ Shoes scrape (${gender}) failed`;
	} else if (category === "apparel") {
		scraper = new ApparelScraper(gender);
		successMessage = `✅ Apparel scrape (${gender}) finished successfully`;
		errorMessage = `❌ Apparel scrape (${gender}) failed`;
	} else {
		console.log(`Scraping for category "${category}" is not yet implemented.`);
		process.exit(0); // Exit gracefully if category not implemented
	}

	try {
		await scraper.run(categoryUrl);
		const endTime = Date.now();
		console.log(`${successMessage} in ${(endTime - startTime) / 1000}s`);
	} catch (error) {
		const endTime = Date.now();
		console.error(
			`${errorMessage} after ${(endTime - startTime) / 1000}s:`,
			error,
		);
		process.exit(1); // Exit with error code
	}
}

main().catch(console.error);
