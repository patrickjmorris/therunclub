import { test, expect, waitForHydration, isServerRendered } from "./test-utils";

test.describe("Athletes Page", () => {
	test("should render athletes list from server", async ({ page }) => {
		await page.goto("/athletes");
		await waitForHydration(page);

		// Verify server-side rendering
		const isListServerRendered = await isServerRendered(
			page,
			"[data-testid='athletes-list']",
		);
		expect(isListServerRendered).toBe(true);

		// Check for athlete cards
		const athletes = await page.getByTestId("athlete-card").all();
		expect(athletes.length).toBeGreaterThan(0);
	});

	test("should handle athlete search and filtering", async ({ page }) => {
		await page.goto("/athletes");
		await waitForHydration(page);

		// Test search functionality
		await page.getByRole("searchbox").fill("Kipchoge");
		await page.waitForURL(/.*q=Kipchoge/);

		// Verify filtered results
		const filteredAthletes = await page.getByTestId("athlete-card").all();
		for (const athlete of filteredAthletes) {
			const text = await athlete.textContent();
			expect(text?.toLowerCase()).toContain("kipchoge");
		}

		// Test category filtering
		await page.getByRole("button", { name: /filter/i }).click();
		await page.getByRole("option", { name: /marathon/i }).click();
		await page.waitForURL(/.*category=marathon/);

		// Verify category filtered results
		const categoryAthletes = await page.getByTestId("athlete-card").all();
		expect(categoryAthletes.length).toBeGreaterThan(0);
	});

	test("should handle athlete profile view", async ({ page }) => {
		await page.goto("/athletes");
		await waitForHydration(page);

		// Click first athlete
		const firstAthlete = await page.getByTestId("athlete-card").first();
		const athleteName = await firstAthlete.getByRole("heading").textContent();
		await firstAthlete.click();

		// Verify navigation to athlete profile
		await page.waitForURL(/.*athletes\/.*$/);

		// Verify profile sections are server rendered
		if (athleteName) {
			await expect(
				page.getByRole("heading", { name: athleteName }),
			).toBeVisible();
		}
		await expect(page.getByTestId("athlete-stats")).toBeVisible();
		await expect(page.getByTestId("athlete-mentions")).toBeVisible();
	});

	test("should handle infinite scroll loading", async ({ page }) => {
		await page.goto("/athletes");
		await waitForHydration(page);

		// Get initial count
		const initialAthletes = await page.getByTestId("athlete-card").all();
		const initialCount = initialAthletes.length;

		// Scroll to bottom to trigger load more
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

		// Wait for more athletes to load
		await page.waitForFunction((count) => {
			return (
				document.querySelectorAll("[data-testid='athlete-card']").length > count
			);
		}, initialCount);

		const newAthletes = await page.getByTestId("athlete-card").all();
		expect(newAthletes.length).toBeGreaterThan(initialCount);
	});

	test("should handle athlete mentions tab", async ({ page }) => {
		await page.goto("/athletes");
		await waitForHydration(page);

		// Navigate to first athlete
		await page.getByTestId("athlete-card").first().click();
		await page.waitForURL(/.*athletes\/.*$/);

		// Click mentions tab
		await page.getByRole("tab", { name: /mentions/i }).click();

		// Verify mentions content
		await expect(page.getByTestId("mentions-list")).toBeVisible();
		const mentions = await page.getByTestId("mention-item").all();
		expect(mentions.length).toBeGreaterThan(0);
	});

	test("should handle empty states", async ({ page }) => {
		// Test with search that returns no results
		await page.goto("/athletes?q=nonexistentathlete");
		await waitForHydration(page);

		await expect(page.getByText(/no athletes found/i)).toBeVisible();
		await expect(page.getByTestId("empty-state")).toBeVisible();
	});
});
