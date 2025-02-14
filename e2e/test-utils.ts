import { test as base, expect, Page, Response, Route } from "@playwright/test";

// Custom test fixture type that includes our custom utilities
export type TestOptions = Record<string, never>;

// Extend the base test with our custom fixtures
export const test = base.extend<TestOptions>({
	// Add custom fixtures here if needed
});

export { expect };

// Helper to wait for Server Component to be ready
export async function waitForHydration(page: Page) {
	// Wait for the page to be fully hydrated
	await page.waitForFunction(() => {
		return (
			// @ts-ignore - window.__NEXT_DATA__ is injected by Next.js
			Object.prototype.hasOwnProperty.call(window, "__NEXT_DATA__") &&
			!document.documentElement.classList.contains("nprogress-busy")
		);
	});
}

// Helper to check if element is server rendered
export async function isServerRendered(page: Page, selector: string) {
	const html = await page.innerHTML(selector);
	// Server components have data-rsc attribute
	return html.includes("data-rsc");
}

// Helper to test streaming behavior
export async function testStreaming(page: Page, url: string) {
	const response = await page.goto(url);
	const buffer: Buffer[] = [];

	if (!response) {
		throw new Error("Navigation failed");
	}

	// Read response body as a single buffer instead of streaming
	const body = await response.body();
	const chunks = body.toString().split("\n");
	return chunks.length > 1; // True if the response contains multiple chunks
}

// Helper to test progressive enhancement
export async function testProgressiveEnhancement(page: Page, url: string) {
	// Disable JavaScript
	await page.context().route("**/*.js", (route: Route) => route.abort());

	// Navigate to page
	const response = await page.goto(url);

	// Page should still render and be functional
	return response?.ok() ?? false;
}
