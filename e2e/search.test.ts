import { test, expect, waitForHydration, isServerRendered } from "./test-utils";

test.describe("Search Functionality", () => {
	test("should render search results from server", async ({ page }) => {
		await page.goto("/search?q=marathon");
		await waitForHydration(page);

		// Verify server-side rendering
		const isResultsServerRendered = await isServerRendered(
			page,
			"[data-testid='search-results']",
		);
		expect(isResultsServerRendered).toBe(true);

		// Check for search results
		const results = await page.getByTestId("search-result").all();
		expect(results.length).toBeGreaterThan(0);
	});

	test("should handle multi-category search results", async ({ page }) => {
		await page.goto("/search?q=london");
		await waitForHydration(page);

		// Verify different result categories
		await expect(page.getByTestId("episodes-results")).toBeVisible();
		await expect(page.getByTestId("athletes-results")).toBeVisible();
		await expect(page.getByTestId("clubs-results")).toBeVisible();

		// Test category tabs
		await page.getByRole("tab", { name: /episodes/i }).click();
		await expect(page.getByTestId("episodes-results")).toBeVisible();

		await page.getByRole("tab", { name: /athletes/i }).click();
		await expect(page.getByTestId("athletes-results")).toBeVisible();

		await page.getByRole("tab", { name: /clubs/i }).click();
		await expect(page.getByTestId("clubs-results")).toBeVisible();
	});

	test("should handle search suggestions", async ({ page }) => {
		await page.goto("/");
		await waitForHydration(page);

		// Focus search input
		await page.getByRole("searchbox").click();
		await page.getByRole("searchbox").fill("mar");

		// Verify suggestions appear
		await expect(page.getByTestId("search-suggestions")).toBeVisible();
		const suggestions = await page.getByTestId("suggestion-item").all();
		expect(suggestions.length).toBeGreaterThan(0);

		// Test suggestion navigation
		await suggestions[0].click();
		await expect(page).toHaveURL(/.*search\?q=.*/);
	});

	test("should handle search filters", async ({ page }) => {
		await page.goto("/search?q=running");
		await waitForHydration(page);

		// Test date filter
		await page.getByRole("button", { name: /date/i }).click();
		await page.getByRole("option", { name: /last month/i }).click();
		await page.waitForURL(/.*date=last-month/);

		// Test sort order
		await page.getByRole("button", { name: /sort/i }).click();
		await page.getByRole("option", { name: /most relevant/i }).click();
		await page.waitForURL(/.*sort=relevant/);

		// Verify filtered results
		const results = await page.getByTestId("search-result").all();
		expect(results.length).toBeGreaterThan(0);
	});

	test("should handle real-time search updates", async ({ page }) => {
		await page.goto("/search");
		await waitForHydration(page);

		// Type search query
		await page.getByRole("searchbox").fill("marathon");
		await page.waitForURL(/.*q=marathon/);

		// Verify results update without page reload
		await expect(page.getByTestId("search-results")).toBeVisible();
		const results = await page.getByTestId("search-result").all();
		expect(results.length).toBeGreaterThan(0);
	});

	test("should handle empty search results", async ({ page }) => {
		await page.goto("/search?q=nonexistentquery123");
		await waitForHydration(page);

		// Verify empty state
		await expect(page.getByText(/no results found/i)).toBeVisible();
		await expect(page.getByTestId("empty-state")).toBeVisible();

		// Verify search suggestions for empty results
		await expect(page.getByTestId("search-suggestions")).toBeVisible();
		await expect(page.getByText(/try these suggestions/i)).toBeVisible();
	});

	test("should maintain search history", async ({ page }) => {
		await page.goto("/search");
		await waitForHydration(page);

		// Perform multiple searches
		const searches = ["marathon", "5k", "track"];
		for (const search of searches) {
			await page.getByRole("searchbox").fill(search);
			await page.waitForURL(new RegExp(`.*q=${search}`));
		}

		// Clear search and check history
		await page.getByRole("searchbox").click();
		await page.getByRole("searchbox").clear();

		// Verify recent searches
		await expect(page.getByTestId("recent-searches")).toBeVisible();
		for (const search of searches.reverse()) {
			await expect(page.getByText(search)).toBeVisible();
		}
	});

	test("should handle keyboard navigation", async ({ page }) => {
		await page.goto("/search");
		await waitForHydration(page);

		// Focus search input
		await page.getByRole("searchbox").click();
		await page.getByRole("searchbox").fill("run");

		// Wait for suggestions
		await expect(page.getByTestId("search-suggestions")).toBeVisible();

		// Test keyboard navigation
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		// Verify navigation occurred
		await expect(page).toHaveURL(/.*search\?q=.*/);
	});
});
