import { test, expect, waitForHydration, isServerRendered } from "./test-utils";

test.describe("Home Page", () => {
	test("should render server components correctly", async ({ page }) => {
		await page.goto("/");
		await waitForHydration(page);

		// Test server-side rendering
		const isHeaderServerRendered = await isServerRendered(page, "header");
		expect(isHeaderServerRendered).toBe(true);

		// Test content is visible
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

		// Test navigation works
		await page.getByRole("link", { name: /episodes/i }).click();
		await expect(page).toHaveURL(/.*episodes/);
	});

	test("should work without JavaScript (Progressive Enhancement)", async ({
		page,
	}) => {
		// Disable JavaScript
		await page.context().route("**/*.js", (route) => route.abort());

		// Navigate to home page
		await page.goto("/");

		// Verify critical content is visible
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		await expect(page.getByRole("navigation")).toBeVisible();
	});

	test("should handle streaming content", async ({ page }) => {
		const response = await page.goto("/");
		expect(response?.ok()).toBe(true);

		// Wait for streaming content to load
		await expect(
			page.getByTestId("streaming-content"),
			"Streaming content should be visible",
		).toBeVisible();
	});

	test("should maintain interactivity after hydration", async ({ page }) => {
		await page.goto("/");
		await waitForHydration(page);

		// Test interactive elements
		const button = page.getByRole("button", { name: /menu/i });
		await button.click();

		// Verify client-side updates
		await expect(page.getByRole("menu")).toBeVisible();
	});
});
