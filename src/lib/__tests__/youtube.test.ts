import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	getVideoInfo,
	getVideosInfo,
	getChannelInfo,
	searchVideos,
	getAllPlaylistItems,
	VIDEO_CATEGORIES,
} from "../youtube";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variables
process.env.YOUTUBE_API_KEY = "test-api-key";

describe("youtube", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllTimers();
	});

	describe("getVideoInfo", () => {
		const mockVideoResponse = {
			kind: "youtube#videoListResponse",
			etag: "test-etag",
			items: [
				{
					kind: "youtube#video",
					etag: "test-etag",
					id: "test-video-id",
					snippet: {
						publishedAt: "2024-03-20T00:00:00Z",
						channelId: "test-channel-id",
						title: "Test Video",
						description: "Test Description",
						thumbnails: {
							default: {
								url: "https://test.com/thumb.jpg",
								width: 120,
								height: 90,
							},
						},
						channelTitle: "Test Channel",
						tags: ["test", "video"],
						categoryId: "1",
					},
					statistics: {
						viewCount: "1000",
						likeCount: "100",
						commentCount: "10",
					},
				},
			],
		};

		it("should fetch video info successfully", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockVideoResponse),
			});

			const result = await getVideoInfo("test-video-id");
			expect(result).toEqual(mockVideoResponse);
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining(
					"/videos?part=snippet,statistics&id=test-video-id",
				),
			);
		});

		it("should handle API errors gracefully", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				statusText: "Not Found",
			});

			const result = await getVideoInfo("invalid-id");
			expect(result).toBeNull();
		});

		it("should use cache for repeated requests", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockVideoResponse),
			});

			// First request
			await getVideoInfo("test-video-id");
			// Second request (should use cache)
			await getVideoInfo("test-video-id");

			expect(mockFetch).toHaveBeenCalledTimes(1);
		});
	});

	describe("getVideosInfo", () => {
		it("should fetch multiple videos info", async () => {
			const mockResponse = {
				items: [
					{ id: "video1", snippet: { title: "Video 1" } },
					{ id: "video2", snippet: { title: "Video 2" } },
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await getVideosInfo(["video1", "video2"]);
			expect(result).toEqual(mockResponse.items);
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining(
					"/videos?part=snippet,statistics&id=video1,video2",
				),
			);
		});

		it("should handle empty video list", async () => {
			const result = await getVideosInfo([]);
			expect(result).toEqual([]);
			expect(mockFetch).not.toHaveBeenCalled();
		});
	});

	describe("searchVideos", () => {
		it("should search videos with query", async () => {
			const mockResponse = {
				items: [{ id: { videoId: "test1" }, snippet: { title: "Test Video" } }],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await searchVideos("running tips");
			expect(result).toEqual(mockResponse);
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/search?part=snippet&q=running%20tips"),
			);
		});

		it("should include category in search query when provided", async () => {
			const mockResponse = {
				items: [{ id: { videoId: "test1" }, snippet: { title: "Test Video" } }],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			await searchVideos("marathon", "RACE_RESULTS");
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("videoCategoryId=race-results"),
			);
		});

		it("should handle API errors", async () => {
			const errorResponse = {
				error: {
					code: 400,
					message: "Invalid request",
					errors: [
						{
							message: "Invalid parameter",
							domain: "youtube.search",
							reason: "invalidParameter",
						},
					],
				},
			};

			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve(errorResponse),
			});

			const result = await searchVideos("invalid query");
			expect(result).toEqual(errorResponse);
		});
	});

	describe("getChannelInfo", () => {
		it("should fetch channel info successfully", async () => {
			const mockResponse = {
				items: [
					{
						id: "test-channel",
						snippet: { title: "Test Channel" },
						statistics: {
							subscriberCount: "1000",
							videoCount: "100",
							viewCount: "10000",
							hiddenSubscriberCount: false,
						},
					},
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await getChannelInfo("test-channel");
			expect(result).toEqual(mockResponse);
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining(
					"/channels?part=snippet,contentDetails,statistics",
				),
			);
		});

		it("should handle channel not found", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Channel not found"));

			const result = await getChannelInfo("invalid-channel");
			expect(result).toBeNull();
		});
	});

	describe("getAllPlaylistItems", () => {
		it("should fetch all playlist items", async () => {
			const mockResponse = {
				items: [
					{ snippet: { resourceId: { videoId: "video1" } } },
					{ snippet: { resourceId: { videoId: "video2" } } },
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await getAllPlaylistItems("test-playlist");
			expect(result).toEqual(mockResponse.items);
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/playlistItems?part=snippet"),
			);
		});

		it("should handle playlist not found", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Playlist not found"));

			const result = await getAllPlaylistItems("invalid-playlist");
			expect(result).toBeNull();
		});
	});
});
