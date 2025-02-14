import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProcessingStats, processAllEpisodes } from "../athlete-detection";
import { mockDb } from "./test-helpers";
import { sql } from "drizzle-orm";

// Mock the database client
vi.mock("@/db/client", () => ({
	db: mockDb,
}));

describe("athlete-detection-stats", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getProcessingStats", () => {
		it("should return correct processing statistics", async () => {
			// Mock database counts
			const mockCounts = [
				[{ count: 100 }], // total episodes
				[{ count: 60 }], // processed episodes
				[{ count: 40 }], // unprocessed episodes
				[{ count: 150 }], // total mentions
			];

			mockDb.select.mockImplementation((params) => {
				// Return different counts based on the query
				const queryStr = params.count.toString();
				if (queryStr.includes("athleteMentions")) {
					return Promise.resolve([{ count: 150 }]);
				}
				return Promise.resolve([{ count: 100 }]);
			});

			const stats = await getProcessingStats();

			expect(stats).toEqual({
				total: 100,
				processed: 60,
				unprocessed: 40,
				totalMentions: 150,
			});

			expect(mockDb.select).toHaveBeenCalledTimes(4);
		});

		it("should handle database errors gracefully", async () => {
			mockDb.select.mockRejectedValue(new Error("Database error"));

			const stats = await getProcessingStats();

			expect(stats).toEqual({
				total: 0,
				processed: 0,
				unprocessed: 0,
				totalMentions: 0,
			});
		});

		it("should handle null count values", async () => {
			mockDb.select.mockResolvedValue([{ count: null }]);

			const stats = await getProcessingStats();

			expect(stats).toEqual({
				total: 0,
				processed: 0,
				unprocessed: 0,
				totalMentions: 0,
			});
		});
	});

	describe("processAllEpisodes", () => {
		it("should process episodes in batches", async () => {
			// Mock initial stats
			mockDb.select.mockImplementation((params) => {
				const queryStr = params.count?.toString() || "";
				if (queryStr.includes("athleteMentions")) {
					return Promise.resolve([{ count: 10 }]);
				}
				return Promise.resolve([{ count: 50 }]);
			});

			// Mock unprocessed episodes query
			mockDb.select.mockImplementationOnce(() => ({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi
							.fn()
							.mockResolvedValue([{ id: "1" }, { id: "2" }, { id: "3" }]),
					}),
				}),
			}));

			// Mock episode processing
			const mockProcessEpisode = vi.fn().mockResolvedValue({
				titleMatches: 1,
				contentMatches: 1,
			});

			const result = await processAllEpisodes(2); // batch size of 2

			expect(result).toBeDefined();
			expect(result.processed).toBeGreaterThan(0);
			expect(result.errors).toBeDefined();
			expect(result.stats).toBeDefined();
		});

		it("should handle empty episode list", async () => {
			// Mock empty unprocessed episodes
			mockDb.select.mockImplementationOnce(() => ({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockResolvedValue([]),
					}),
				}),
			}));

			const result = await processAllEpisodes();

			expect(result).toEqual({
				processed: 0,
				errors: 0,
				stats: expect.any(Object),
			});
		});

		it("should handle processing errors", async () => {
			// Mock unprocessed episodes query
			mockDb.select.mockImplementationOnce(() => ({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockResolvedValue([{ id: "1" }, { id: "2" }]),
					}),
				}),
			}));

			// Mock processing error
			const mockProcessEpisode = vi
				.fn()
				.mockRejectedValue(new Error("Processing error"));

			const result = await processAllEpisodes();

			expect(result.errors).toBeGreaterThan(0);
		});

		it("should respect batch size", async () => {
			// Mock 5 unprocessed episodes
			mockDb.select.mockImplementationOnce(() => ({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi
							.fn()
							.mockResolvedValue([
								{ id: "1" },
								{ id: "2" },
								{ id: "3" },
								{ id: "4" },
								{ id: "5" },
							]),
					}),
				}),
			}));

			const batchSize = 2;
			const result = await processAllEpisodes(batchSize);

			// Should process all episodes in batches of 2
			expect(result.processed + result.errors).toBe(5);
		});

		it("should calculate progress correctly", async () => {
			const mockConsoleLog = vi.spyOn(console, "log");

			// Mock 10 unprocessed episodes
			mockDb.select.mockImplementationOnce(() => ({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi
							.fn()
							.mockResolvedValue(
								Array.from({ length: 10 }, (_, i) => ({ id: String(i) })),
							),
					}),
				}),
			}));

			await processAllEpisodes(3); // batch size of 3

			// Verify progress logging
			expect(mockConsoleLog).toHaveBeenCalledWith(
				expect.stringContaining("Progress:"),
				expect.stringContaining("%"),
			);
		});
	});
});
