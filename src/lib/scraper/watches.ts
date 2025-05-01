import { BaseScraper } from "./base";
import { gearSchema, GearValidationSchema } from "@/lib/validation/gear";
import { upsertGear } from "@/lib/db/queries/gear";
import { generateSlug } from "@/utils/slugify";
import type { NewGear } from "@/db/schema";

const BASE_URL = "https://www.runningwarehouse.com";
const KNOWN_WATCH_BRANDS = ["Garmin", "COROS", "Suunto"]; // Add more known watch brands if needed

export class WatchesScraper extends BaseScraper {
	constructor() {
		super();
		console.log("WatchesScraper initialized.");
	}

	async run(categoryUrl: string) {
		console.log(`Starting watches scrape from category: ${categoryUrl}`);

		try {
			await this.init();
			await this.navigateWithRetry(categoryUrl);

			let pageNum = 1;
			let hasNextPage = true;

			while (hasNextPage) {
				console.log(`Scraping page ${pageNum} for watches`);
				const page = await this.getPage();

				const itemLocators = page.locator("div.cattable-wrap-cell");
				const count = await itemLocators.count();
				console.log(`Found ${count} watch items on page ${pageNum}.`);

				const processingPromises = [];
				for (let i = 0; i < count; i++) {
					const itemNum = i + 1;
					const itemLocator = itemLocators.nth(i);

					processingPromises.push(
						(async () => {
							console.log(
								`--- Starting processing watch item ${itemNum} on page ${pageNum} ---`,
							);
							const gearData: Partial<GearValidationSchema> = {
								category: "watches",
								sexAge: undefined, // Watches are typically unisex in this context
							};

							try {
								const nameLocator = itemLocator.locator(
									".cattable-wrap-cell-info .cattable-wrap-cell-info-name",
								);
								let rawName: string | undefined | null = null;
								try {
									await nameLocator.waitFor({
										state: "visible",
										timeout: 15000,
									});
									rawName = await nameLocator.textContent();
									gearData.name = rawName?.trim();
								} catch (nameError) {
									console.warn(
										`[Watch Item ${itemNum}] Name not found or timed out: ${
											(nameError as Error).message
										}`,
									);
									gearData.name = undefined;
								}

								// Attempt to extract brand from name
								if (gearData.name) {
									const nameParts = gearData.name.split(" ");
									const potentialBrand = nameParts[0];
									if (KNOWN_WATCH_BRANDS.includes(potentialBrand)) {
										gearData.brand = potentialBrand;
									} else {
										// Fallback or log warning if brand is unknown/cannot be parsed
										console.warn(
											`[Watch Item ${itemNum}] Could not determine brand from name: ${gearData.name}. Setting to 'Unknown'.`,
										);
										gearData.brand = "Unknown"; // Or handle differently
									}
								} else {
									gearData.brand = "Unknown"; // Set default if name is missing
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
										`[Watch Item ${itemNum}] Price not found or timed out: ${
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
										.textContent({ timeout: 3000 });
									gearData.rating = ratingText
										? parseFloat(ratingText)
										: undefined;
								} catch (e) {
									/* Ignore */
								}

								try {
									const reviewCountText = await itemLocator
										.locator(".catpage-review_count")
										.textContent({ timeout: 3000 });
									gearData.reviewCount = reviewCountText
										? parseInt(reviewCountText.split(" ")[0], 10)
										: undefined;
								} catch (e) {
									/* Ignore */
								}

								gearData.description = undefined; // Assume no description on list view

								console.log(
									`[Watch Item ${itemNum}] Raw data:`,
									JSON.stringify(gearData),
								);

								// Filter out non-watch items that might be on the page (like accessories)
								if (!gearData.name?.toLowerCase().includes("watch")) {
									console.log(
										`[Watch Item ${itemNum}] Skipping item, likely not a watch: ${gearData.name}`,
									);
									return; // Skip this item
								}

								const validationResult = gearSchema.safeParse(gearData);

								if (validationResult.success) {
									const validatedData = validationResult.data;
									try {
										// Slug generation - using brand and name (sexAge is undefined)
										const slug = generateSlug(
											`${validatedData.brand} ${validatedData.name}`,
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
											sexAge: null, // Explicitly set sexAge to null for watches
										};
										await upsertGear(dataToUpsert);
										console.log(`[Watch Item ${itemNum}] Upserted: ${slug}`);
									} catch (dbError) {
										const errorSlug = generateSlug(
											`${gearData.brand || "unknown"} ${
												gearData.name || "unknown"
											}`,
										);
										console.error(
											`[Watch Item ${itemNum}] Database error for slug ${errorSlug}:`,
											dbError,
										);
									}
								} else {
									console.warn(
										`[Watch Item ${itemNum}] Validation failed:`,
										validationResult.error.flatten(),
									);
								}
							} catch (error) {
								console.error(
									`[Watch Item ${itemNum}] Error during processing:`,
									error,
								);
							} finally {
								console.log(
									`--- Finished processing watch item ${itemNum} on page ${pageNum} ---`,
								);
							}
						})(),
					);
				} // End loop pushing item promises

				await Promise.all(processingPromises);
				// --- End Concurrent Processing ---

				console.log(`Finished processing watch items on page ${pageNum}.`);

				// Go to next page
				hasNextPage = await this.goToNextPage("a.next-page-plp");
				if (hasNextPage) {
					pageNum++;
				}
			} // End while loop for pagination

			console.log("Finished scraping watches category.");
		} catch (error) {
			console.error("Error during watches scraping process:", error);
			throw error; // Re-throw to be caught by the calling script
		} finally {
			await this.closeSession();
		}
	}
}
