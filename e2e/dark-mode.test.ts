import { test, expect, waitForHydration } from "./test-utils";
import type { Page } from "@playwright/test";

// Helper function to verify dark mode classes and styles
async function verifyDarkMode(page: Page, isDark: boolean) {
	// Check html class
	const htmlClass = await page.evaluate(() =>
		document.documentElement.classList.contains("dark"),
	);
	expect(htmlClass).toBe(isDark);

	// Verify background color
	const bgColor = await page.evaluate(() => {
		const body = document.body;
		return window.getComputedStyle(body).backgroundColor;
	});

	// Dark mode should have a dark background (rgb values for slate-950)
	if (isDark) {
		expect(bgColor).toBe("rgb(2, 6, 23)");
	} else {
		expect(bgColor).toBe("rgb(255, 255, 255)");
	}
}

// List of all major routes to test
const routes = ["/", "/episodes", "/athletes", "/clubs", "/videos", "/search"];

test.describe("Dark Mode", () => {
	test("should persist dark mode preference across pages", async ({ page }) => {
		// Start with homepage
		await page.goto("/");
		await waitForHydration(page);

		// Toggle dark mode
		await page.getByRole("button", { name: /toggle theme/i }).click();
		await verifyDarkMode(page, true);

		// Visit each route and verify dark mode persists
		for (const route of routes) {
			await page.goto(route);
			await waitForHydration(page);
			await verifyDarkMode(page, true);
		}

		// Toggle back to light mode
		await page.getByRole("button", { name: /toggle theme/i }).click();
		await verifyDarkMode(page, false);

		// Verify light mode persists across routes
		for (const route of routes) {
			await page.goto(route);
			await waitForHydration(page);
			await verifyDarkMode(page, false);
		}
	});

	test("should respect system preference", async ({ page }) => {
		// Emulate system dark mode preference
		await page.emulateMedia({ colorScheme: "dark" });
		await page.goto("/");
		await waitForHydration(page);
		await verifyDarkMode(page, true);

		// Emulate system light mode preference
		await page.emulateMedia({ colorScheme: "light" });
		await page.goto("/");
		await waitForHydration(page);
		await verifyDarkMode(page, false);
	});

	test("should apply dark mode to all UI components", async ({ page }) => {
		await page.goto("/");
		await waitForHydration(page);

		// Enable dark mode
		await page.getByRole("button", { name: /toggle theme/i }).click();

		// Test navigation components
		await expect(page.getByRole("navigation")).toHaveCSS(
			"background-color",
			"rgb(2, 6, 23)",
		);
		await expect(page.getByRole("banner")).toHaveCSS(
			"border-color",
			"rgb(51, 65, 85)",
		);

		// Test cards and containers
		await expect(page.getByTestId("content-card")).toHaveCSS(
			"background-color",
			"rgb(15, 23, 42)",
		);
		await expect(page.getByTestId("sidebar")).toHaveCSS(
			"background-color",
			"rgb(15, 23, 42)",
		);

		// Test text colors
		await expect(page.getByRole("heading")).toHaveCSS(
			"color",
			"rgb(248, 250, 252)",
		);
		await expect(page.getByTestId("body-text")).toHaveCSS(
			"color",
			"rgb(203, 213, 225)",
		);

		// Test form elements
		await expect(page.getByRole("searchbox")).toHaveCSS(
			"background-color",
			"rgb(30, 41, 59)",
		);
		await expect(page.getByRole("button")).toHaveCSS(
			"border-color",
			"rgb(51, 65, 85)",
		);
	});

	test("should handle dynamic content in dark mode", async ({ page }) => {
		await page.goto("/videos");
		await waitForHydration(page);

		// Enable dark mode
		await page.getByRole("button", { name: /toggle theme/i }).click();

		// Load more content via infinite scroll
		const initialVideos = await page.getByTestId("video-card").count();
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

		// Wait for new content
		await page.waitForFunction((count) => {
			return (
				document.querySelectorAll("[data-testid='video-card']").length > count
			);
		}, initialVideos);

		// Verify new content respects dark mode
		const newCards = await page.getByTestId("video-card").all();
		for (const card of newCards) {
			await expect(card).toHaveCSS("background-color", "rgb(15, 23, 42)");
			await expect(card.getByTestId("video-title")).toHaveCSS(
				"color",
				"rgb(248, 250, 252)",
			);
		}
	});

	test("should handle modals and overlays in dark mode", async ({ page }) => {
		await page.goto("/");
		await waitForHydration(page);

		// Enable dark mode
		await page.getByRole("button", { name: /toggle theme/i }).click();

		// Open mobile menu
		await page.getByRole("button", { name: /open menu/i }).click();
		await expect(page.getByRole("dialog")).toHaveCSS(
			"background-color",
			"rgb(15, 23, 42)",
		);

		// Test search overlay
		await page.getByRole("searchbox").click();
		await expect(page.getByTestId("search-overlay")).toHaveCSS(
			"background-color",
			"rgb(2, 6, 23)",
		);
		await expect(page.getByTestId("search-suggestions")).toHaveCSS(
			"background-color",
			"rgb(15, 23, 42)",
		);
	});

	test("should handle error states in dark mode", async ({ page }) => {
		await page.goto("/videos/invalid-id");
		await waitForHydration(page);

		// Enable dark mode
		await page.getByRole("button", { name: /toggle theme/i }).click();

		// Verify error state styling
		await expect(page.getByTestId("error-state")).toHaveCSS(
			"background-color",
			"rgb(15, 23, 42)",
		);
		await expect(page.getByTestId("error-heading")).toHaveCSS(
			"color",
			"rgb(248, 250, 252)",
		);
		await expect(page.getByTestId("error-message")).toHaveCSS(
			"color",
			"rgb(203, 213, 225)",
		);
	});

	test("should handle loading states in dark mode", async ({ page }) => {
		// Enable dark mode via local storage before navigation
		await page.evaluate(() => {
			localStorage.setItem("theme", "dark");
		});

		await page.goto("/videos");

		// Verify loading skeleton styling
		await expect(page.getByTestId("loading-skeleton")).toHaveCSS(
			"background-color",
			"rgb(30, 41, 59)",
		);
		await expect(page.getByTestId("loading-pulse")).toHaveCSS(
			"background-color",
			"rgb(51, 65, 85)",
		);
	});

	test("should maintain dark mode after page refresh", async ({ page }) => {
		await page.goto("/");
		await waitForHydration(page);

		// Enable dark mode
		await page.getByRole("button", { name: /toggle theme/i }).click();
		await verifyDarkMode(page, true);

		// Refresh page
		await page.reload();
		await waitForHydration(page);
		await verifyDarkMode(page, true);

		// Navigate and refresh on different routes
		for (const route of routes) {
			await page.goto(route);
			await waitForHydration(page);
			await verifyDarkMode(page, true);
			await page.reload();
			await waitForHydration(page);
			await verifyDarkMode(page, true);
		}
	});
});
