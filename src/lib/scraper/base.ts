import { chromium, type Browser, type Page } from "playwright";
import pRetry, { FailedAttemptError } from "p-retry";
import { sleep } from "../../utils/sleep";

const NAVIGATION_DELAY_MS = 2000;
const MAX_RETRIES = 3;

export abstract class BaseScraper {
	protected browser: Browser | null = null;
	protected page: Page | null = null;

	async init() {
		if (!this.page) {
			console.log("Launching browser...");
			this.browser = await chromium.launch({
				headless: false,
				args: ["--disable-blink-features=AutomationControlled"],
			});
			this.page = await this.browser.newPage({
				viewport: { width: 1288, height: 711 },
				locale: "en-US",
				timezoneId: "America/New_York",
				hasTouch: true,
				bypassCSP: true,
				ignoreHTTPSErrors: true,
			});
			console.log("Browser launched.");
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
		console.log("Closing browser...");
		try {
			await this.browser?.close();
			this.browser = null;
			this.page = null;
			console.log("Browser closed.");
		} catch (error) {
			console.error("Error closing browser:", error);
		}
	}
}
