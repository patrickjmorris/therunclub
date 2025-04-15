# Athlete Import Script (`scripts/import-athletes.ts`)

## Overview

This script manages the process of importing and enriching athlete data for the application. It interacts with the World Athletics API to fetch initial athlete information, personal bests, and honors. It also utilizes the OpenAI Batch API to generate athlete biographies and potential social media links based on their profiles and achievements.

## Dependencies

-   **Database:** Uses the application's database client (`src/db/client`) and schema (`@/db/schema`) powered by Drizzle ORM and Postgres (via Supabase).
-   **World Athletics API:** Fetches athlete data using a GraphQL client (`@/lib/world-athletics`).
-   **OpenAI API:** Uses the `openai` Node.js library (`src/lib/openai`) to interact with the Batch API for generating text content.
-   **Node.js:** Core modules `fs` for file system operations and `path` for handling file paths.
-   **Utilities:** Helper functions like `slugify` from `@/lib/utils`.

## Features

1.  **Import Athlete Data:**
    -   Fetches athlete IDs from the World Athletics API, either globally or filtered by specific countries.
    -   Retrieves detailed information for each athlete, including basic profile data, personal bests, and competitive honors.
    -   Inserts or updates athlete records, results (`athleteResults`), and honors (`athleteHonors`) in the database.
    -   Handles potential rate limiting with delays between API calls.
    -   Generates unique slugs for athletes based on their name and World Athletics ID.

2.  **Generate Athlete Bios & Social Media Links:**
    -   Identifies prominent athletes (based on World Championship or Olympic honors) who are missing a biography in the database.
    -   Constructs prompts for the OpenAI API to generate a concise bio and suggest potential social media handles (Twitter, Instagram, Facebook, Website).
    -   Creates a batch input file (`athlete_bios.jsonl`) formatted for the OpenAI Batch API.
    -   Uploads the batch file to OpenAI and initiates a batch processing job.
    -   Polls the OpenAI API until the batch job is complete.
    -   Downloads the results file (`athlete_bios_results.jsonl`) containing the generated content.

3.  **Process Batch Results:**
    -   Reads the results file downloaded from OpenAI.
    -   Parses each line (representing one athlete's generated content).
    -   Updates the corresponding athlete record in the database with the generated `bio` and `socialMedia` JSON object.
    -   Includes error handling for JSON parsing and database updates.

## Usage

The script is run from the command line using `bun run scripts/import-athletes.ts <operation> [options]`.

### Operations

-   `import [limit] [country]`: Imports athlete data.
    -   `limit` (optional): Maximum number of athletes to import.
    -   `country` (optional): 3-letter country code (e.g., `USA`) to import athletes only from that country. If omitted, imports globally based on representative search and major countries.
-   `generate-bios [limit]`: Generates bios for athletes missing them.
    -   `limit` (optional): Maximum number of bios to generate (defaults to 100 if omitted).
-   `test-bios`: Runs `generate-bios` with a fixed limit of 98 for testing purposes.
-   `process-results <file>`: Processes a completed OpenAI batch job results file.
    -   `file`: Path to the downloaded JSONL results file (e.g., `scripts/athlete_bios_results.jsonl`).

### Examples

```bash
# Import all athletes (might take a long time)
bun run scripts/import-athletes.ts import

# Import up to 50 athletes from Kenya
bun run scripts/import-athletes.ts import 50 KEN

# Generate bios for up to 200 athletes
bun run scripts/import-athletes.ts generate-bios 200

# Process results from a downloaded file
bun run scripts/import-athletes.ts process-results scripts/athlete_bios_results.jsonl
```

## Workflow

1.  **Initial Import:** Run the `import` operation first to populate the database with athlete data from World Athletics. This can be done incrementally or by country.
2.  **Bio Generation:** Periodically run the `generate-bios` operation. This identifies eligible athletes, creates an OpenAI batch job, waits for completion, downloads the results, and automatically triggers the processing step.
3.  **Manual Result Processing (Optional):** If a `generate-bios` run is interrupted after the batch job completes but before processing, or if you need to re-process results, use the `process-results` operation with the path to the downloaded results file.

## File Management

-   `scripts/athlete_bios.jsonl`: Temporarily created during the `generate-bios` operation to hold the input data for the OpenAI Batch API. Automatically deleted after successful processing.
-   `scripts/athlete_bios_results.jsonl`: Downloaded from OpenAI after a batch job completes. Contains the generated bios and social media links. Automatically deleted after successful processing. 