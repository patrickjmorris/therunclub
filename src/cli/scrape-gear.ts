import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { config } from "dotenv"; // Import dotenv config
import { resolve } from "path";

// Load .env file from the project root
config({ path: resolve(process.cwd(), ".env") });

import { ShoesScraper } from "../lib/scraper/shoes";
import { ApparelScraper } from "../lib/scraper/apparel";
import { WatchesScraper } from "../lib/scraper/watches"; // Import the new scraper
import type { sexAgeEnum } from "@/db/schema"; // Import enum type if needed for clarity

// Define base URL and main category entry points
const BASE_URL = "https://www.runningwarehouse.com";
// Define a type for the paths to improve type safety
type CategoryPaths = {
	shoes: { [key in (typeof sexAgeEnum.enumValues)[number]]?: string };
	apparel: { [key in (typeof sexAgeEnum.enumValues)[number]]?: string };
	watches: { main: string }; // Explicitly define watches structure
	// Add other categories as needed
};

const CATEGORY_PATHS: CategoryPaths = {
	shoes: {
		mens: "/mens-running-shoes.html",
		womens: "/womens-running-shoes.html",
	},
	apparel: {
		mens: "/mens-running-apparel.html",
		womens: "/womens-running-apparel.html",
	},
	watches: {
		main: "/catpage-SDMONITORS.html",
	},
};

async function main() {
	const argv = await yargs(hideBin(process.argv))
		.option("category", {
			alias: "c",
			describe: "Category to scrape",
			type: "string",
			choices: Object.keys(CATEGORY_PATHS) as (keyof CategoryPaths)[], // Use keys from type
			// default: "shoes", // Remove default to force explicit choice?
			// For now, keep default for backward compatibility if needed
			default: "shoes" as keyof CategoryPaths,
		})
		.option("gender", {
			alias: "g",
			describe:
				"Gender for category (mens/womens) - Not applicable for watches",
			type: "string",
			choices: ["mens", "womens"],
		})
		.demandOption(["category"], "Please specify a category to scrape.")
		.help()
		.alias("help", "h")
		.parseAsync();

	console.log("Starting Manual Gear Scrape...");
	console.log(
		`Arguments: Category=${argv.category}, Gender=${argv.gender ?? "N/A"}`,
	);
	const startTime = Date.now();

	// Determine category
	const category = argv.category as keyof CategoryPaths;

	// Validate and determine the path key (gender or 'main')
	let pathKey: string | undefined;

	if (category === "shoes" || category === "apparel") {
		if (!argv.gender) {
			console.error(
				`Error: --gender (mens/womens) is required for category '${category}'.`,
			);
			process.exit(1);
		}
		pathKey = argv.gender;
		// Check if the gender is a valid key for the *specific* category's path object
		if (!(pathKey in CATEGORY_PATHS[category])) {
			console.error(
				`Invalid gender (${pathKey}) specified for category ${category}.`,
			);
			process.exit(1);
		}
	} else if (category === "watches") {
		pathKey = "main"; // Use the defined key for watches
		if (argv.gender) {
			console.log("Gender argument ignored for watches category.");
		}
	} else {
		console.error(`Invalid category specified: ${category}`);
		process.exit(1);
	}

	// At this point, pathKey should be a valid key for the selected category's path object
	// biome-ignore lint/suspicious/noExplicitAny: ok for now
	const categoryUrlPath = (CATEGORY_PATHS[category] as any)[pathKey as string];

	if (!categoryUrlPath) {
		console.error(
			`Could not find URL path for category '${category}' and type '${pathKey}'.`,
		);
		process.exit(1);
	}

	const categoryUrl = `${BASE_URL}${categoryUrlPath}`;
	let scraper: ShoesScraper | ApparelScraper | WatchesScraper;
	let successMessage = "";
	let errorMessage = "";

	// Instantiate the correct scraper based on category
	if (category === "shoes" && (pathKey === "mens" || pathKey === "womens")) {
		scraper = new ShoesScraper(pathKey as "mens" | "womens");
		successMessage = `✅ Shoes scrape (${pathKey}) finished successfully`;
		errorMessage = `❌ Shoes scrape (${pathKey}) failed`;
	} else if (
		category === "apparel" &&
		(pathKey === "mens" || pathKey === "womens")
	) {
		scraper = new ApparelScraper(pathKey as "mens" | "womens");
		successMessage = `✅ Apparel scrape (${pathKey}) finished successfully`;
		errorMessage = `❌ Apparel scrape (${pathKey}) failed`;
	} else if (category === "watches") {
		scraper = new WatchesScraper();
		successMessage = "✅ Watches scrape finished successfully"; // Removed template literal
		errorMessage = "❌ Watches scrape failed"; // Removed template literal
	} else {
		// This case should theoretically be unreachable due to earlier checks
		console.log(
			`Scraping for category "${category}" with type "${pathKey}" is not yet implemented.`,
		);
		process.exit(0);
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
		process.exit(1);
	}
}

main().catch(console.error);
