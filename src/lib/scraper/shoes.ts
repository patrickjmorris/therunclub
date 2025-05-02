import { BaseScraper } from "./base";
import { gearSchema, GearValidationSchema } from "@/lib/validation/gear";
import { insertGear } from "@/lib/db/queries/gear"; // We'll need this later
import { generateSlug } from "@/utils/slugify"; // Use path alias assuming it's configured
import { eq } from "drizzle-orm";
import { upsertGear } from "@/lib/db/queries/gear"; // Import upsertGear function
import type { NewGear } from "@/db/schema";
import { sexAgeEnum } from "@/db/schema"; // Import the enum directly

const BASE_URL = "https://www.runningwarehouse.com"; // Restore BASE_URL

// URLs are now expected to be passed into run()
// const ENTRY_POINTS = {
// 	mens: "/mens-running-shoes.html",
// 	womens: "/womens-running-shoes.html",
// };
// const BASE_URL = "https://www.runningwarehouse.com";

export class ShoesScraper extends BaseScraper {
	private sexAge: (typeof sexAgeEnum.enumValues)[number]; // Store sexAge internally

	constructor(sexAge: (typeof sexAgeEnum.enumValues)[number]) {
		super(); // Call BaseScraper constructor
		this.sexAge = sexAge;
		console.log(`ShoesScraper initialized for: ${this.sexAge}`);
	}

	// run now takes the main category URL (e.g., /womens-running-shoes.html)
	async run(categoryUrl: string) {
		console.log(
			`Starting multi-brand shoe scrape from category: ${categoryUrl} for ${this.sexAge}`,
		);

		try {
			await this.init();
			const page = await this.getPage();

			// 1. Navigate to the main category page
			await this.navigateWithRetry(categoryUrl);

			// 2. Extract brand page links
			console.log("Extracting brand links...");
			const brandGridSelector = "#WRSPPBRANDS"; // Or #MRSPPBRANDS based on gender?
			// Let's try a more general selector that might cover both men/women
			const brandLinkSelector = ".col.col-4.col-xs-3.col-md-2.col-xxl-1.mt-4 a";
			const brandLinksElements = page.locator(brandLinkSelector);
			const brandUrls = await brandLinksElements.evaluateAll((links) =>
				links.map((a) => (a as HTMLAnchorElement).href).filter(Boolean),
			);

			if (brandUrls.length === 0) {
				console.warn(
					`No brand links found using selector: ${brandLinkSelector} on page ${categoryUrl}`,
				);
				return; // Exit if no brands found
			}
			console.log(`Found ${brandUrls.length} brand links to process.`);

			// 3. Iterate through each brand URL and scrape
			for (const brandUrl of brandUrls) {
				console.log(`--- Processing Brand URL: ${brandUrl} ---`);
				try {
					await this.scrapeBrandPage(brandUrl);
				} catch (brandError) {
					console.error(`Error processing brand ${brandUrl}:`, brandError);
					// Continue to the next brand even if one fails
				}
				console.log(`--- Finished Brand URL: ${brandUrl} ---`);
			}

			console.log("Finished scraping all brands for shoe category.");
		} catch (error) {
			console.error("Error during multi-brand shoe scraping process:", error);
			throw error;
		} finally {
			await this.closeSession();
		}
	}

	// Extracted method to scrape a single brand page (contains the previous run logic)
	private async scrapeBrandPage(brandPageUrl: string) {
		console.log(`Navigating to brand page: ${brandPageUrl}`);
		await this.navigateWithRetry(brandPageUrl);

		let pageNum = 1;
		let hasNextPage = true;

		while (hasNextPage) {
			console.log(`Scraping page ${pageNum} for brand ${brandPageUrl}`);
			const page = await this.getPage();

			const itemLocators = page.locator("div.cattable-wrap-cell");
			const count = await itemLocators.count();
			console.log(`Found ${count} items on page ${pageNum}.`);

			// --- Concurrent Processing Logic (moved inside scrapeBrandPage) ---
			const processingPromises = [];
			for (let i = 0; i < count; i++) {
				const itemNum = i + 1;
				const itemLocator = itemLocators.nth(i);

				processingPromises.push(
					(async () => {
						console.log(
							`--- Starting processing item ${itemNum} on page ${pageNum} ---`,
						);
						const gearData: Partial<GearValidationSchema> = {
							category: "shoes",
							sexAge: this.sexAge,
						};

						try {
							// Extract data using selectors
							const brandAttr = await itemLocator.getAttribute(
								"data-gtm_impression_brand",
							);
							gearData.brand = brandAttr ?? undefined;

							const nameLocator = itemLocator.locator(
								".cattable-wrap-cell-info .cattable-wrap-cell-info-name",
							);
							try {
								await nameLocator.waitFor({
									state: "visible",
									timeout: 15000,
								});
								gearData.name = (await nameLocator.textContent())?.trim(); // Added trim
							} catch (nameError) {
								console.warn(
									`[Item ${itemNum}] Name not found or timed out: ${
										(nameError as Error).message
									}`,
								);
								gearData.name = undefined;
							}

							const priceContainerLocator = itemLocator.locator(
								".cattable-wrap-cell-info-price",
							);
							try {
								await priceContainerLocator.waitFor({
									state: "visible",
									timeout: 10000,
								});

								const priceContainerText =
									await priceContainerLocator.textContent();
								const priceMatch = priceContainerText?.match(/\$(\d+\.?\d*)/);
								const priceString = priceMatch ? priceMatch[1] : null;
								gearData.price = priceString
									? parseFloat(priceString)
									: undefined;
							} catch (priceError) {
								console.warn(
									`[Item ${itemNum}] Price not found or timed out: ${
										(priceError as Error).message
									}`,
								);
								gearData.price = undefined;
							}

							const linkElement = itemLocator.locator(
								"a.cattable-wrap-cell-imgwrap-inner",
							);
							const href = await linkElement.getAttribute("href");
							gearData.link = href ?? undefined;
							if (gearData.link && !gearData.link.startsWith("http")) {
								gearData.link = `${BASE_URL}${gearData.link}`;
							}

							const imageElement = itemLocator.locator(
								"img.cattable-wrap-cell-imgwrap-inner-img",
							);
							const srcset = await imageElement.getAttribute("data-srcset");
							if (srcset) {
								const firstSrc = srcset.split(",")[0]?.trim().split(" ")[0];
								gearData.image = firstSrc ?? undefined;
							} else {
								gearData.image =
									(await imageElement.getAttribute("src")) ?? undefined;
							}

							try {
								const ratingText = await itemLocator
									.locator(".catpage-review-container .review_agg")
									.textContent({ timeout: 5000 });
								gearData.rating = ratingText
									? parseFloat(ratingText)
									: undefined;
							} catch (e) {
								/* Ignore */
							}

							try {
								const reviewCountText = await itemLocator
									.locator(".catpage-review_count")
									.textContent({ timeout: 5000 });
								gearData.reviewCount = reviewCountText
									? parseInt(reviewCountText.split(" ")[0], 10)
									: undefined;
							} catch (e) {
								/* Ignore */
							}

							gearData.description = undefined;

							console.log(
								`[Item ${itemNum}] Raw data:`,
								JSON.stringify(gearData),
							);

							const validationResult = gearSchema.safeParse(gearData);

							if (validationResult.success) {
								const validatedData = validationResult.data;
								try {
									const slug = generateSlug(
										`${validatedData.brand} ${validatedData.name} ${this.sexAge}`,
									);
									const dataToUpsert: NewGear = {
										...validatedData,
										slug: slug,
										description: validatedData.description || null,
										rating: validatedData.rating
											? String(validatedData.rating)
											: null,
										price: String(validatedData.price), // Price is required, should be valid here
										reviewCount: validatedData.reviewCount ?? null,
										// sexAge is already in validatedData due to Partial type merge
									};
									await upsertGear(dataToUpsert);
									console.log(`[Item ${itemNum}] Upserted: ${slug}`);
								} catch (dbError) {
									const errorSlug = generateSlug(
										`${gearData.brand || "unknown"} ${
											gearData.name || "unknown"
										} ${this.sexAge}`,
									);
									console.error(
										`[Item ${itemNum}] Database error for slug ${errorSlug}:`,
										dbError,
									);
								}
							} else {
								console.warn(
									`[Item ${itemNum}] Validation failed:`,
									validationResult.error.flatten(),
								);
							}
						} catch (error) {
							console.error(
								`[Item ${itemNum}] Error during processing:`,
								error,
							);
						} finally {
							console.log(
								`--- Finished processing item ${itemNum} on page ${pageNum} ---`,
							);
						}
					})(),
				);
			} // End loop pushing item promises

			await Promise.all(processingPromises);
			// --- End Concurrent Processing ---

			console.log(
				`Finished processing items on page ${pageNum} for brand ${brandPageUrl}.`,
			);

			// Go to next page for the current brand
			hasNextPage = await this.goToNextPage("a.next-page-plp");
			if (hasNextPage) {
				pageNum++;
			}
		} // End while loop for brand pagination
	}
}

// ... test usage comment ...
