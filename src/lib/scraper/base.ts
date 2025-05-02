import { Stagehand, Page } from "@browserbasehq/stagehand";
import pRetry, { FailedAttemptError } from "p-retry";
import { sleep } from "../../utils/sleep";

const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY;
const BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID;
const NAVIGATION_DELAY_MS = 2000;
const MAX_RETRIES = 3;

let validatedApiKey: string;
let validatedProjectId: string;

if (!BROWSERBASE_API_KEY || !BROWSERBASE_PROJECT_ID) {
	console.warn(
		"BROWSERBASE_API_KEY or BROWSERBASE_PROJECT_ID is not set. Scraper functionality will be disabled.",
	);
	validatedApiKey = "disabled";
	validatedProjectId = "disabled";
} else {
	validatedApiKey = BROWSERBASE_API_KEY;
	validatedProjectId = BROWSERBASE_PROJECT_ID;
}

export abstract class BaseScraper {
	protected stagehand: Stagehand;
	protected page: Page | null = null;

	constructor() {
		if (validatedApiKey === "disabled" || validatedProjectId === "disabled") {
			throw new Error(
				"Browserbase API Key and Project ID required for Stagehand.",
			);
		}
		this.stagehand = new Stagehand({
			env: "LOCAL",
			modelName: "gpt-4o",
			modelClientOptions: {
				apiKey: process.env.OPENAI_API_KEY,
			},
		});
		console.log("BaseScraper initialized with Stagehand (env: LOCAL).");
	}

	async init() {
		if (!this.page) {
			console.log("Initializing Stagehand session...");
			await this.stagehand.init();
			this.page = this.stagehand.page;
			console.log("Stagehand session initialized.");
			if (!this.page) {
				throw new Error("Failed to get Stagehand page object after init.");
			}
		}
		return this.page;
	}

	protected async getPage(): Promise<Page> {
		if (!this.page) {
			return await this.init();
		}
		return this.page;
	}

	protected async navigateWithRetry(url: string) {
		const page = await this.getPage();

		console.log(`Navigating to: ${url}`);
		return pRetry(
			async () => {
				await page.goto(url, { waitUntil: "domcontentloaded" });
				console.log(`Successfully navigated to: ${url}`);
				await sleep(NAVIGATION_DELAY_MS);
			},
			{
				retries: MAX_RETRIES,
				onFailedAttempt: (error: FailedAttemptError) => {
					console.warn(
						`Navigation attempt ${error.attemptNumber} failed. Retrying... Error: ${error.message}`,
					);
				},
			},
		);
	}

	protected async goToNextPage(
		nextLinkSelector = 'a:contains("Next")',
	): Promise<boolean> {
		const page = await this.getPage();

		console.log("Checking for next page link...");
		try {
			const locator = page.locator(nextLinkSelector);
			const hasNext = await locator.isVisible();
			if (hasNext) {
				console.log("Next page link found, clicking...");
				await locator.click();
				console.log("Clicked next page link.");
				await sleep(NAVIGATION_DELAY_MS);
				return true;
			}
			console.log("No next page link found.");
			return false;
		} catch (error) {
			console.error("Error checking/clicking next page link:", error);
			return false;
		}
	}

	abstract run(entryUrl: string): Promise<void>;

	async closeSession() {
		console.log("Attempting to close Stagehand session...");
		try {
			await this.stagehand.close();
			this.page = null;
			console.log("Stagehand session closed.");
		} catch (error) {
			console.error("Error closing Stagehand session:", error);
		}
	}
}
