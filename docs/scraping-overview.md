# Gear Scraping Process (`scrape:gear`, `optimize:gear-images`)

Documentation for the scripts used to scrape gear data from external merchants (currently Running Warehouse) and optimize associated images.

--- 

## 1. Overview

The primary goal of this process is to populate the `gear` table in the database with product information scraped from retailer websites. Currently, it supports scraping shoes, apparel, and watches from Running Warehouse.

The process involves two main parts:
1.  **Scraping (`scrape:gear`):** Extracts product details (name, brand, price, image URL, etc.) from the website and saves them to the database.
2.  **Image Optimization (`optimize:gear-images`):** A separate script that takes the original image URLs scraped previously, downloads them, optimizes them (resizing), and uploads them to Supabase Storage, storing the new URL.

--- 

## 2. Technology Stack

-   **Scraping Framework:** [Stagehand](https://github.com/browserbase/stagehand) / Playwright (using local browser)
-   **Database ORM:** Drizzle ORM
-   **Database:** PostgreSQL (via Supabase)
-   **Validation:** Zod
-   **Runtime:** Bun / tsx
-   **Language:** TypeScript
-   **Image Processing:** `../src/lib/server/image-processing` (likely using Sharp or similar)
-   **Image Storage:** Supabase Storage

--- 

## 3. Scraping Workflow (`scrape:gear`)

This script orchestrates the extraction of gear data for a specified category and gender/sex (where applicable).

**Process:**

1.  **Initialization:** The script is invoked via the CLI (`bun run scrape:gear`), parsing category and gender arguments.
2.  **Category Navigation:** It constructs the URL for the main category page (e.g., `/mens-running-shoes.html`, `/womens-running-apparel.html`, `/catpage-SDMONITORS.html`) based on the input arguments.
3.  **Brand Link Extraction (Shoes/Apparel):** For shoe and apparel categories, it navigates to the category page and extracts links to individual brand pages using category-specific selectors (e.g., `#MRSPPBRANDS a` for men's shoes, `#WRCPPBRANDS a` for women's apparel). Watches skip this step.
4.  **Brand Iteration (Shoes/Apparel):** Loops through each extracted brand URL (shoes/apparel only).
5.  **Page Scraping (Watches/Brand Pages):** For each brand URL (shoes/apparel) or the main category URL (watches):
    a.  Navigates to the relevant page.
    b.  **Item Scraping (Concurrent):** Identifies individual product containers (`div.cattable-wrap-cell`) and processes them concurrently using `Promise.all`.
    c.  **Data Extraction:** For each item, it extracts:
        *   `brand`: From `data-gtm_impression_brand` attribute (shoes/apparel), or parsed from name (watches).
        *   `name`: From `.cattable-wrap-cell-info .cattable-wrap-cell-info-name`, with a wait.
        *   `price`: Extracts the first dollar amount (`\$(\d+\.?\d*)`) from the `.cattable-wrap-cell-info-price` container text, handling both regular and sale structures.
        *   `link`: The product page URL.
        *   `image`: Prioritizes the first URL from the `data-srcset` attribute of the `img.cattable-wrap-cell-imgwrap-inner-img` tag, falling back to `src`.
        *   `rating`, `reviewCount`: Optional, extracted with short timeouts.
    d.  **Static Data:** Adds `category` (e.g., "shoes", "apparel", "watches") and `sexAge` (e.g., "mens", "womens", or `null` for watches) based on script arguments/context.
    e.  **Slug Generation:** Creates a unique slug using `brand`, `name`, and `sexAge` (or just brand/name for watches).
    f.  **Validation:** Validates the extracted data against the Zod schema (`src/lib/validation/gear.ts`).
    g.  **Database Upsert:** Uses `upsertGear` to insert the new item or update an existing item based on the unique `slug`.
    h.  **Pagination:** After processing all items on a page concurrently, it checks for and navigates to the next page (`a.next-page-plp`) for the current brand/category, repeating step 5b-h.
6.  **Completion:** Logs success or failure for the overall category scrape.

--- 

## 4. CLI Command: `scrape:gear`

Used to manually trigger the scraping process for specific categories and genders.

**Command Format:**
```bash
bun run scrape:gear -- [--category <category>] [--gender <gender>]
```

**Arguments:**

| Argument     | Alias | Type   | Choices                 | Default | Description                                                          |
| :----------- | :---- | :----- | :---------------------- | :------ | :------------------------------------------------------------------- |
| `--category` | `-c`  | String | `shoes`, `apparel`, `watches` | `shoes` | The gear category to scrape.                                         |
| `--gender`   | `-g`  | String | `mens`, `womens`          |         | **Required for `shoes`, `apparel`.** Ignored for `watches`.          |

**Examples:**

*   Scrape Men's Shoes:
    ```bash
    bun run scrape:gear -- --category shoes --gender mens
    ```
*   Scrape Women's Apparel:
    ```bash
    bun run scrape:gear -- --category apparel --gender womens
    ```
*   Scrape Watches:
    ```bash
    bun run scrape:gear -- --category watches
    ```

--- 

## 5. Image Optimization Workflow (`optimize:gear-images`)

This script runs *independently* of the main scraper to process original image URLs stored in the `gear` table.

**Process:**

1.  **Initialization:** Invoked via CLI (`bun run optimize:gear-images` or `tsx scripts/optimize-gear-images.ts`). Accepts an optional batch size argument.
2.  **Query Database:** Selects gear items from the `gear` table where the `image` field is NOT NULL, but the `optimizedImageUrl` field IS NULL.
3.  **Batch Processing:** Iterates through the found items in batches.
4.  **Optimization:** For each item:
    a.  Calls the `optimizeImage` function (from `src/lib/server/image-processing`) with the original `image` URL.
    b.  The `optimizeImage` function is expected to handle downloading the image, resizing/optimizing it (e.g., to 1400px width), and uploading it to a designated path in Supabase Storage (currently configured with a prefix of `gear/`).
    c.  It returns the public URL of the newly uploaded image in Supabase Storage.
5.  **Update Database:** If `optimizeImage` returns a URL successfully, the script updates the corresponding `gear` record, setting the `optimizedImageUrl` field to the new URL and updating the `updatedAt` timestamp.
6.  **Logging & Completion:** Logs success or failure for each item and provides a summary at the end.

--- 

## 6. CLI Command: `optimize:gear-images`

Used to manually trigger the optimization process for gear images stored in the database.

**Command Format:**
```bash
bun run optimize:gear-images [<batchSize>]
# OR
tsx scripts/optimize-gear-images.ts [<batchSize>]
```

**Arguments:**

| Argument    | Type   | Default | Description                                                |
| :---------- | :----- | :------ | :--------------------------------------------------------- |
| `batchSize` | Number | `10000` | Optional. Number of images to process in a single batch. |

**Examples:**

*   Optimize images with default batch size:
    ```bash
    bun run optimize:gear-images
    ```
*   Optimize images in batches of 50:
    ```bash
    tsx scripts/optimize-gear-images.ts 50
    ```

--- 

## 7. Data Schema

The primary table involved is `gear`, defined in `src/db/schema.ts`.
Key fields include:
-   `id` (uuid)
-   `slug` (text, unique)
-   `name` (text)
-   `brand` (text)
-   `price` (numeric)
-   `image` (text) - Original scraped image URL
-   `optimizedImageUrl` (text) - URL after processing via `optimize:gear-images`
-   `link` (text) - Link to original product page
-   `category` (enum: shoes, apparel, watches, etc.)
-   `sexAge` (enum: mens, womens, kids, or NULL for category like watches)
-   `rating` (numeric)
-   `reviewCount` (integer)
-   `merchant` (text)
-   `updatedAt` (timestamp)

Validation is handled by a Zod schema defined in `src/lib/validation/gear.ts`.

**Note:** Remember to run database migrations (`bun run db:generate`, `bun run db:push`) after any changes to `src/db/schema.ts`.

--- 

## 8. Future Considerations

-   Add scrapers for remaining categories (race spikes, training tools, fuel, accessories).
-   Implement more robust error handling and retry mechanisms within brand/item loops.
-   Add configuration options for selectors, base URLs, etc.
-   Integrate `scrape:gear` into a scheduled job (e.g., using Trigger.dev or a cron job).
-   Add monitoring for scraping success/failure rates.
-   Support scraping from additional merchants.

--- 

## 9. Important Notes

-   **Concurrency:** Item scraping within a page is concurrent (`Promise.all`), but brand processing (shoes/apparel) and pagination are sequential.
-   **Selector Fragility:** Selectors are based on the current structure of Running Warehouse and may break if the site layout changes.
-   **Ethical Scraping:** The base scraper includes delays (`NAVIGATION_DELAY_MS`) between navigations. Avoid overly aggressive scraping. 