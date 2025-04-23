import { describe, it, expect, vi, beforeEach } from "vitest";
import { getContent, type OgContent, type ContentType } from "./getContent";

// --- Mocks ---
// Mock the entire service modules
vi.mock("@/lib/services/podcast-service", () => ({
	getPodcastBySlug: vi.fn(),
	getEpisode: vi.fn(),
}));
vi.mock("@/lib/services/video-service", () => ({
	getVideoById: vi.fn(),
}));
vi.mock("@/lib/services/athlete-service", () => ({
	getAthleteData: vi.fn(),
}));

// Import the mocked functions AFTER vi.mock()
// We need to import them to be able to use mockResolvedValue etc.
// but TypeScript might complain if they aren't used directly in tests,
// hence the eslint-disable comments or casting.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getPodcastBySlug, getEpisode } from "@/lib/services/podcast-service";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getVideoById } from "@/lib/services/video-service";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getAthleteData } from "@/lib/services/athlete-service";

// --- Test Suite ---
describe("getContent Helper", () => {
	// Reset mocks before each test
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// --- Podcast Tests ---
	describe("Podcast Content Type", () => {
		const contentType: ContentType = "podcast";
		const podcastSlug = "test-podcast";
		const mockPodcastData = {
			id: "podcast1",
			title: "Test Podcast Title",
			image: "http://example.com/podcast-image.jpg",
			itunesImage: "http://example.com/podcast-itunes.jpg",
			podcastSlug: podcastSlug,
			// other fields...
		};

		it("should return correct OgContent for a valid podcast slug", async () => {
			(getPodcastBySlug as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPodcastData,
			);

			const result = await getContent(contentType, podcastSlug);

			expect(getPodcastBySlug).toHaveBeenCalledWith(podcastSlug);
			expect(result).toEqual<OgContent>({
				title: mockPodcastData.title,
				coverImage: mockPodcastData.image, // Prefers 'image'
				contentType: contentType,
			});
		});

		it("should use itunesImage if image is null", async () => {
			(getPodcastBySlug as ReturnType<typeof vi.fn>).mockResolvedValue({
				...mockPodcastData,
				image: null,
			});
			const result = await getContent(contentType, podcastSlug);
			expect(result?.coverImage).toBe(mockPodcastData.itunesImage);
		});

		it("should return null coverImage if both images are null", async () => {
			(getPodcastBySlug as ReturnType<typeof vi.fn>).mockResolvedValue({
				...mockPodcastData,
				image: null,
				itunesImage: null,
			});
			const result = await getContent(contentType, podcastSlug);
			expect(result?.coverImage).toBeNull();
		});

		it("should return null if podcast is not found", async () => {
			(getPodcastBySlug as ReturnType<typeof vi.fn>).mockResolvedValue(null);
			const result = await getContent(contentType, "invalid-slug");
			expect(result).toBeNull();
		});

		it("should return default title if podcast title is null/undefined", async () => {
			(getPodcastBySlug as ReturnType<typeof vi.fn>).mockResolvedValue({
				...mockPodcastData,
				title: null,
			});
			const result = await getContent(contentType, podcastSlug);
			expect(result?.title).toBe("Podcast");
		});
	});

	// --- Episode Tests ---
	describe("Episode Content Type", () => {
		const contentType: ContentType = "episode";
		const episodeSlug = "test-episode";
		const podcastSlug = "related-podcast";
		const mockEpisodeData = {
			id: "ep1",
			title: "Test Episode Title",
			image: null, // Test fallback
			podcastImage: "http://example.com/episode-podcast-image.jpg",
			episodeSlug: episodeSlug,
			podcastSlug: podcastSlug,
			// other fields...
		};

		it("should return correct OgContent for a valid episode slug", async () => {
			(getEpisode as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockEpisodeData,
			);

			const result = await getContent(contentType, episodeSlug, podcastSlug);

			expect(getEpisode).toHaveBeenCalledWith(episodeSlug);
			expect(result).toEqual<OgContent>({
				title: mockEpisodeData.title,
				coverImage: mockEpisodeData.podcastImage, // Uses 'podcastImage' as fallback
				contentType: contentType,
			});
		});

		it("should return null if episode is not found", async () => {
			(getEpisode as ReturnType<typeof vi.fn>).mockResolvedValue(null);
			const result = await getContent(
				contentType,
				"invalid-episode",
				podcastSlug,
			);
			expect(result).toBeNull();
		});

		it("should return null if podcastSlug is provided but doesn't match episode's podcastSlug", async () => {
			(getEpisode as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockEpisodeData,
			);
			const result = await getContent(
				contentType,
				episodeSlug,
				"wrong-podcast-slug",
			);
			expect(result).toBeNull();
		});

		it("should still return content if podcastSlug is not provided (relies only on getEpisode result)", async () => {
			(getEpisode as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockEpisodeData,
			);

			const consoleWarnSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {}); // Suppress console.warn

			const result = await getContent(contentType, episodeSlug); // No podcastSlug provided

			expect(result).toEqual<OgContent>({
				title: mockEpisodeData.title,
				coverImage: mockEpisodeData.podcastImage,
				contentType: contentType,
			});
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				"getContent: Missing podcastSlug for episode type",
			);
			consoleWarnSpy.mockRestore();
		});
	});

	// --- Video Tests ---
	describe("Video Content Type", () => {
		const contentType: ContentType = "video";
		const videoId = "vid123";
		const mockVideoData = {
			id: videoId,
			title: "Test Video Title",
			thumbnailUrl: "http://example.com/video-thumb.jpg",
			// other fields...
		};

		it("should return correct OgContent for a valid video ID", async () => {
			(getVideoById as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockVideoData,
			);
			const result = await getContent(contentType, videoId);
			expect(getVideoById).toHaveBeenCalledWith(videoId);
			expect(result).toEqual<OgContent>({
				title: mockVideoData.title,
				coverImage: mockVideoData.thumbnailUrl,
				contentType: contentType,
			});
		});

		it("should return null if video is not found", async () => {
			(getVideoById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
			const result = await getContent(contentType, "invalid-id");
			expect(result).toBeNull();
		});
	});

	// --- Athlete Tests ---
	describe("Athlete Content Type", () => {
		const contentType: ContentType = "athlete";
		const athleteSlug = "test-athlete";
		const mockAthleteData = {
			id: "ath1",
			name: "Test Athlete Name",
			imageUrl: "http://example.com/athlete-image.jpg",
			slug: athleteSlug,
			// other fields...
		};

		it("should return correct OgContent for a valid athlete slug", async () => {
			(getAthleteData as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockAthleteData,
			);
			const result = await getContent(contentType, athleteSlug);
			expect(getAthleteData).toHaveBeenCalledWith(athleteSlug);
			expect(result).toEqual<OgContent>({
				title: mockAthleteData.name,
				coverImage: mockAthleteData.imageUrl,
				contentType: contentType,
			});
		});

		it("should return null if athlete is not found", async () => {
			(getAthleteData as ReturnType<typeof vi.fn>).mockResolvedValue(null);
			const result = await getContent(contentType, "invalid-slug");
			expect(result).toBeNull();
		});
	});

	// --- Error Handling ---
	describe("Error Handling", () => {
		it("should return null and log error if a service function throws", async () => {
			const error = new Error("Database connection failed");
			(getPodcastBySlug as ReturnType<typeof vi.fn>).mockRejectedValue(error);

			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {}); // Suppress console.error

			const result = await getContent("podcast", "any-slug");

			expect(result).toBeNull();
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"getContent: Error fetching podcast (any-slug):",
				error,
			);

			consoleErrorSpy.mockRestore();
		});
	});
});
