import { test, expect, waitForHydration, isServerRendered } from "./test-utils";

test.describe("Videos Page", () => {
	test("should render videos grid from server", async ({ page }) => {
		await page.goto("/videos");
		await waitForHydration(page);

		// Verify server-side rendering
		const isGridServerRendered = await isServerRendered(
			page,
			"[data-testid='videos-grid']",
		);
		expect(isGridServerRendered).toBe(true);

		// Check for video cards
		const videos = await page.getByTestId("video-card").all();
		expect(videos.length).toBeGreaterThan(0);

		// Verify video metadata is present
		const firstVideo = videos[0];
		await expect(firstVideo.getByTestId("video-title")).toBeVisible();
		await expect(firstVideo.getByTestId("video-duration")).toBeVisible();
		await expect(firstVideo.getByTestId("video-channel")).toBeVisible();
		await expect(firstVideo.getByTestId("video-views")).toBeVisible();
	});

	test("should handle video category filtering", async ({ page }) => {
		await page.goto("/videos");
		await waitForHydration(page);

		// Test category selection
		await page.getByRole("button", { name: /categories/i }).click();
		await page.getByRole("option", { name: /race highlights/i }).click();
		await page.waitForURL(/.*category=race-highlights/);

		// Verify filtered results
		const filteredVideos = await page.getByTestId("video-card").all();
		expect(filteredVideos.length).toBeGreaterThan(0);

		// Verify category tag is visible
		await expect(page.getByTestId("active-category")).toBeVisible();
		await expect(page.getByText(/race highlights/i)).toBeVisible();
	});

	test("should handle video player interaction", async ({ page }) => {
		await page.goto("/videos");
		await waitForHydration(page);

		// Click first video
		const firstVideo = await page.getByTestId("video-card").first();
		const videoTitle = await firstVideo
			.getByTestId("video-title")
			.textContent();
		await firstVideo.click();

		// Verify navigation to video page
		await page.waitForURL(/.*videos\/.*$/);

		// Verify video player is loaded
		await expect(page.getByTestId("video-player")).toBeVisible();
		if (videoTitle) {
			await expect(
				page.getByRole("heading", { name: videoTitle }),
			).toBeVisible();
		}

		// Verify video metadata and description
		await expect(page.getByTestId("video-info")).toBeVisible();
		await expect(page.getByTestId("video-description")).toBeVisible();
		await expect(page.getByTestId("channel-info")).toBeVisible();
	});

	test("should handle video recommendations", async ({ page }) => {
		await page.goto("/videos");
		await waitForHydration(page);

		// Navigate to a video
		await page.getByTestId("video-card").first().click();
		await page.waitForURL(/.*videos\/.*$/);

		// Verify recommendations are loaded
		await expect(page.getByTestId("video-recommendations")).toBeVisible();
		const recommendations = await page.getByTestId("recommendation-card").all();
		expect(recommendations.length).toBeGreaterThan(0);

		// Test recommendation navigation
		const recommendedVideo = recommendations[0];
		const recommendedTitle = await recommendedVideo
			.getByTestId("video-title")
			.textContent();
		await recommendedVideo.click();

		// Verify navigation to recommended video
		await page.waitForURL(/.*videos\/.*$/);
		if (recommendedTitle) {
			await expect(
				page.getByRole("heading", { name: recommendedTitle }),
			).toBeVisible();
		}
	});

	test("should handle video search and filtering", async ({ page }) => {
		await page.goto("/videos");
		await waitForHydration(page);

		// Test search functionality
		await page.getByRole("searchbox").fill("marathon");
		await page.waitForURL(/.*q=marathon/);

		// Verify filtered results
		const searchResults = await page.getByTestId("video-card").all();
		expect(searchResults.length).toBeGreaterThan(0);

		// Test multiple filters
		await page.getByRole("button", { name: /sort/i }).click();
		await page.getByRole("option", { name: /most viewed/i }).click();
		await page.waitForURL(/.*sort=views/);

		// Test date filter
		await page.getByRole("button", { name: /date/i }).click();
		await page.getByRole("option", { name: /this year/i }).click();
		await page.waitForURL(/.*date=year/);

		// Verify filter tags
		await expect(page.getByTestId("filter-tags")).toBeVisible();
	});

	test("should handle infinite scroll loading", async ({ page }) => {
		await page.goto("/videos");
		await waitForHydration(page);

		// Get initial count
		const initialVideos = await page.getByTestId("video-card").all();
		const initialCount = initialVideos.length;

		// Scroll to bottom
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

		// Wait for more videos to load
		await page.waitForFunction((count) => {
			return (
				document.querySelectorAll("[data-testid='video-card']").length > count
			);
		}, initialCount);

		const newVideos = await page.getByTestId("video-card").all();
		expect(newVideos.length).toBeGreaterThan(initialCount);
	});

	test("should handle video playback controls", async ({ page }) => {
		await page.goto("/videos");
		await waitForHydration(page);

		// Navigate to a video
		await page.getByTestId("video-card").first().click();
		await page.waitForURL(/.*videos\/.*$/);

		// Wait for player to load
		await expect(page.getByTestId("video-player")).toBeVisible();

		// Test player controls
		await expect(page.getByTestId("play-button")).toBeVisible();
		await expect(page.getByTestId("volume-control")).toBeVisible();
		await expect(page.getByTestId("progress-bar")).toBeVisible();
		await expect(page.getByTestId("fullscreen-button")).toBeVisible();

		// Test quality selection
		await page.getByTestId("quality-settings").click();
		await expect(page.getByTestId("quality-options")).toBeVisible();
	});

	test("should handle empty states and errors", async ({ page }) => {
		// Test with search that returns no results
		await page.goto("/videos?q=nonexistentvideo123");
		await waitForHydration(page);

		// Verify empty state
		await expect(page.getByText(/no videos found/i)).toBeVisible();
		await expect(page.getByTestId("empty-state")).toBeVisible();

		// Test invalid video ID
		await page.goto("/videos/invalid-id");
		await expect(page.getByText(/video not found/i)).toBeVisible();
		await expect(page.getByTestId("error-state")).toBeVisible();

		// Verify back navigation
		await page.getByRole("link", { name: /back to videos/i }).click();
		await expect(page).toHaveURL("/videos");
	});

	test("should handle progressive enhancement", async ({ page }) => {
		// Disable JavaScript
		await page.context().route("**/*.js", (route) => route.abort());

		await page.goto("/videos");

		// Verify server-rendered content is visible
		await expect(page.getByTestId("videos-grid")).toBeVisible();
		await expect(page.getByTestId("video-card")).toBeVisible();

		// Verify static video thumbnails are shown
		await expect(page.getByTestId("video-thumbnail")).toBeVisible();

		// Verify fallback for video duration
		await expect(page.getByTestId("video-duration")).toBeVisible();
	});
});
