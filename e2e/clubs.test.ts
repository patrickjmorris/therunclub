import { test, expect, waitForHydration, isServerRendered } from "./test-utils";

test.describe("Clubs Page", () => {
	test("should render clubs list from server", async ({ page }) => {
		await page.goto("/clubs");
		await waitForHydration(page);

		// Verify server-side rendering
		const isListServerRendered = await isServerRendered(
			page,
			"[data-testid='clubs-grid']",
		);
		expect(isListServerRendered).toBe(true);

		// Check for club cards
		const clubs = await page.getByTestId("club-card").all();
		expect(clubs.length).toBeGreaterThan(0);
	});

	test("should handle location-based filtering", async ({ page }) => {
		await page.goto("/clubs");
		await waitForHydration(page);

		// Test location search
		await page.getByRole("searchbox", { name: /location/i }).fill("London");
		await page.waitForURL(/.*location=London/);

		// Verify filtered results
		const filteredClubs = await page.getByTestId("club-card").all();
		for (const club of filteredClubs) {
			const text = await club.textContent();
			expect(text?.toLowerCase()).toContain("london");
		}
	});

	test("should handle club details view", async ({ page }) => {
		await page.goto("/clubs");
		await waitForHydration(page);

		// Click first club
		const firstClub = await page.getByTestId("club-card").first();
		const clubName = await firstClub.getByRole("heading").textContent();
		await firstClub.click();

		// Verify navigation to club detail
		await page.waitForURL(/.*clubs\/.*$/);

		// Verify club details are server rendered
		if (clubName) {
			await expect(page.getByRole("heading", { name: clubName })).toBeVisible();
		}
		await expect(page.getByTestId("club-info")).toBeVisible();
		await expect(page.getByTestId("club-location")).toBeVisible();
		await expect(page.getByTestId("club-contact")).toBeVisible();
	});

	test("should handle map view toggle", async ({ page }) => {
		await page.goto("/clubs");
		await waitForHydration(page);

		// Toggle map view
		await page.getByRole("button", { name: /show map/i }).click();

		// Verify map is visible
		await expect(page.getByTestId("clubs-map")).toBeVisible();

		// Verify map markers
		const markers = await page.getByTestId("map-marker").all();
		expect(markers.length).toBeGreaterThan(0);

		// Test marker interaction
		await markers[0].click();
		await expect(page.getByTestId("map-popup")).toBeVisible();
	});

	test("should handle club filtering by type", async ({ page }) => {
		await page.goto("/clubs");
		await waitForHydration(page);

		// Select club type filter
		await page.getByRole("button", { name: /filter/i }).click();
		await page.getByRole("option", { name: /track club/i }).click();
		await page.waitForURL(/.*type=track/);

		// Verify filtered results
		const filteredClubs = await page.getByTestId("club-card").all();
		expect(filteredClubs.length).toBeGreaterThan(0);

		// Verify filter tags are visible
		await expect(page.getByTestId("filter-tag")).toBeVisible();
	});

	test("should handle progressive enhancement for map view", async ({
		page,
	}) => {
		// Disable JavaScript
		await page.context().route("**/*.js", (route) => route.abort());

		await page.goto("/clubs");

		// Verify fallback list view is visible
		await expect(page.getByTestId("clubs-grid")).toBeVisible();
		await expect(page.getByTestId("club-card")).toBeVisible();

		// Verify static map image is shown instead of interactive map
		await expect(page.getByTestId("static-map")).toBeVisible();
	});

	test("should handle empty search results", async ({ page }) => {
		await page.goto("/clubs?location=NonexistentPlace");
		await waitForHydration(page);

		// Verify empty state
		await expect(page.getByText(/no clubs found/i)).toBeVisible();
		await expect(page.getByTestId("empty-state")).toBeVisible();

		// Test clear filters
		await page.getByRole("button", { name: /clear filters/i }).click();
		await page.waitForURL("/clubs");

		// Verify clubs are shown after clearing filters
		const clubs = await page.getByTestId("club-card").all();
		expect(clubs.length).toBeGreaterThan(0);
	});
});
