import { test, expect, waitForHydration } from "./test-utils";

test.describe("Episodes Page", () => {
	test("should render episodes list from server", async ({ page }) => {
		await page.goto("/episodes");
		await waitForHydration(page);

		// Verify episodes list is server rendered
		const episodesList = page.getByRole("list");
		await expect(episodesList).toBeVisible();

		// Check for episode items
		const episodes = await page.getByRole("listitem").all();
		expect(episodes.length).toBeGreaterThan(0);
	});

	test("should handle episode filtering", async ({ page }) => {
		await page.goto("/episodes");
		await waitForHydration(page);

		// Type in search input
		await page.getByRole("searchbox").fill("marathon");
		await page.waitForURL(/.*q=marathon/);

		// Verify filtered results
		const filteredEpisodes = await page.getByRole("listitem").all();
		for (const episode of filteredEpisodes) {
			const text = await episode.textContent();
			expect(text?.toLowerCase()).toContain("marathon");
		}
	});

	test("should handle pagination", async ({ page }) => {
		await page.goto("/episodes");
		await waitForHydration(page);

		// Get initial episodes
		const initialEpisodes = await page.getByRole("listitem").all();
		const initialCount = initialEpisodes.length;

		// Click load more button
		await page.getByRole("button", { name: /load more/i }).click();

		// Verify more episodes loaded
		await page.waitForFunction((count) => {
			return document.querySelectorAll('[role="listitem"]').length > count;
		}, initialCount);

		const newEpisodes = await page.getByRole("listitem").all();
		expect(newEpisodes.length).toBeGreaterThan(initialCount);
	});

	test("should handle episode details view", async ({ page }) => {
		await page.goto("/episodes");
		await waitForHydration(page);

		// Click first episode
		const firstEpisode = await page.getByRole("listitem").first();
		const episodeTitle = await firstEpisode.getByRole("heading").textContent();
		await firstEpisode.click();

		// Verify navigation to episode detail
		await page.waitForURL(/.*episodes\/.*$/);

		// Verify episode content loaded
		if (episodeTitle) {
			await expect(
				page.getByRole("heading", { name: episodeTitle }),
			).toBeVisible();
		}
		await expect(page.getByTestId("episode-content")).toBeVisible();
	});

	test("should handle error states", async ({ page }) => {
		// Force error by navigating to invalid episode
		await page.goto("/episodes/invalid-id");

		// Verify error message is shown
		await expect(page.getByText(/episode not found/i)).toBeVisible();

		// Verify back navigation works
		await page.getByRole("link", { name: /back to episodes/i }).click();
		await expect(page).toHaveURL("/episodes");
	});
});
