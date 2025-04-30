import { BaseScraper } from "./base";
import { gearSchema, GearValidationSchema } from "@/lib/validation/gear";
import { upsertGear } from "@/lib/db/queries/gear";
import { generateSlug } from "@/utils/slugify";
import type { NewGear } from "@/db/schema";
import { sexAgeEnum } from "@/db/schema";

const BASE_URL = "https://www.runningwarehouse.com";

export class ApparelScraper extends BaseScraper {
	private sexAge: (typeof sexAgeEnum.enumValues)[number];

	constructor(sexAge: (typeof sexAgeEnum.enumValues)[number]) {
		super();
		this.sexAge = sexAge;
		console.log(`ApparelScraper initialized for: ${this.sexAge}`);
	}

	// run now takes the main category URL (e.g., /womens-running-apparel.html)
	async run(categoryUrl: string) {
		console.log(
			`Starting multi-brand apparel scrape from category: ${categoryUrl} for ${this.sexAge}`,
		);

		try {
			await this.init();
			const page = await this.getPage();

			// 1. Navigate to the main category page
			await this.navigateWithRetry(categoryUrl);

			// 2. Extract brand page links using the correct grid ID
			console.log("Extracting apparel brand links...");
			const gridId = this.sexAge === "womens" ? "#WRCPPBRANDS" : "#MRCPPBRANDS";
			const brandLinkSelector = `${gridId} a`; // Select all links within the grid
			const brandLinksElements = page.locator(brandLinkSelector);
			const brandUrls = await brandLinksElements.evaluateAll((links) =>
				links.map((a) => (a as HTMLAnchorElement).href).filter(Boolean),
			);

			if (brandUrls.length === 0) {
				console.warn(
					`No apparel brand links found using selector: ${brandLinkSelector} on page ${categoryUrl}`,
				);
				return; // Exit if no brands found
			}
			console.log(`Found ${brandUrls.length} apparel brand links to process.`);

			// 3. Iterate through each brand URL and scrape
			for (const brandUrl of brandUrls) {
				console.log(`--- Processing Apparel Brand URL: ${brandUrl} ---`);
				try {
					await this.scrapeBrandPage(brandUrl);
				} catch (brandError) {
					console.error(
						`Error processing apparel brand ${brandUrl}:`,
						brandError,
					);
					// Continue to the next brand even if one fails
				}
				console.log(`--- Finished Apparel Brand URL: ${brandUrl} ---`);
			}

			console.log("Finished scraping all brands for apparel category.");
		} catch (error) {
			console.error(
				"Error during multi-brand apparel scraping process:",
				error,
			);
			throw error;
		} finally {
			await this.closeSession();
		}
	}

	// Extracted method to scrape a single brand page
	private async scrapeBrandPage(brandPageUrl: string) {
		console.log(`Navigating to apparel brand page: ${brandPageUrl}`);
		await this.navigateWithRetry(brandPageUrl);

		let pageNum = 1;
		let hasNextPage = true;

		while (hasNextPage) {
			console.log(`Scraping page ${pageNum} for apparel brand ${brandPageUrl}`);
			const page = await this.getPage();

			// *ASSUMPTION*: Using same item container selector as shoes.
			const itemLocators = page.locator("div.cattable-wrap-cell");
			const count = await itemLocators.count();
			console.log(`Found ${count} apparel items on page ${pageNum}.`);

			// --- Concurrent Processing Logic ---
			const processingPromises = [];
			for (let i = 0; i < count; i++) {
				const itemNum = i + 1;
				const itemLocator = itemLocators.nth(i);

				processingPromises.push(
					(async () => {
						console.log(
							`--- Starting processing apparel item ${itemNum} on page ${pageNum} ---`,
						);
						const gearData: Partial<GearValidationSchema> = {
							category: "apparel", // Set category to apparel
							sexAge: this.sexAge,
						};

						try {
							// *ASSUMPTION*: Using same selectors as shoes. May need refinement.
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
								gearData.name = (await nameLocator.textContent())?.trim();
							} catch (nameError) {
								console.warn(
									`[Apparel Item ${itemNum}] Name not found or timed out: ${
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
									`[Apparel Item ${itemNum}] Price not found or timed out: ${
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

							// Attempt to get rating/reviews, ignore if not present for apparel
							try {
								const ratingText = await itemLocator
									.locator(".catpage-review-container .review_agg")
									.textContent({ timeout: 3000 }); // Short timeout
								gearData.rating = ratingText
									? parseFloat(ratingText)
									: undefined;
							} catch (e) {
								/* Ignore */
							}

							try {
								const reviewCountText = await itemLocator
									.locator(".catpage-review_count")
									.textContent({ timeout: 3000 }); // Short timeout
								gearData.reviewCount = reviewCountText
									? parseInt(reviewCountText.split(" ")[0], 10)
									: undefined;
							} catch (e) {
								/* Ignore */
							}

							gearData.description = undefined; // Assume no description on list view

							console.log(
								`[Apparel Item ${itemNum}] Raw data:`,
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
										price: String(validatedData.price), // Price is required
										reviewCount: validatedData.reviewCount ?? null,
										// sexAge already included
									};
									await upsertGear(dataToUpsert);
									console.log(`[Apparel Item ${itemNum}] Upserted: ${slug}`);
								} catch (dbError) {
									const errorSlug = generateSlug(
										`${gearData.brand || "unknown"} ${
											gearData.name || "unknown"
										} ${this.sexAge}`,
									);
									console.error(
										`[Apparel Item ${itemNum}] Database error for slug ${errorSlug}:`,
										dbError,
									);
								}
							} else {
								console.warn(
									`[Apparel Item ${itemNum}] Validation failed:`,
									validationResult.error.flatten(),
								);
							}
						} catch (error) {
							console.error(
								`[Apparel Item ${itemNum}] Error during processing:`,
								error,
							);
						} finally {
							console.log(
								`--- Finished processing apparel item ${itemNum} on page ${pageNum} ---`,
							);
						}
					})(),
				);
			} // End loop pushing item promises

			await Promise.all(processingPromises);
			// --- End Concurrent Processing ---

			console.log(
				`Finished processing apparel items on page ${pageNum} for brand ${brandPageUrl}.`,
			);

			// Go to next page for the current brand
			hasNextPage = await this.goToNextPage("a.next-page-plp");
			if (hasNextPage) {
				pageNum++;
			}
		} // End while loop for brand pagination
	}
}
