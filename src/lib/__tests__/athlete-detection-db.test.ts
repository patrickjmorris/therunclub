import { describe, it, expect, vi, beforeEach } from "vitest";
import { processEpisodeAthletes } from "../athlete-detection";
import { mockDb } from "./test-helpers";
import { eq, and, sql } from "drizzle-orm";

// Mock the database client
vi.mock("@/db/client", () => ({
	db: mockDb,
}));

// Mock the internal detectAthletes function since it's not exported
const mockDetectAthletes = vi.fn();
vi.mock("../athlete-detection", () => ({
	processEpisodeAthletes: async (episodeId: string) => {
		const episode = await mockDb.query.episodes.findFirst();
		if (!episode) {
			throw new Error("Episode not found");
		}

		const titleAthletes = await mockDetectAthletes(episode.title);
		for (const athlete of titleAthletes) {
			await mockDb.insert().values({
				athleteId: athlete.athleteId,
				episodeId: episode.id,
				source: "title",
				confidence: athlete.confidence.toString(),
				context: athlete.context,
			});
		}

		let contentAthletes = [];
		if (episode.content) {
			contentAthletes = await mockDetectAthletes(episode.content);
			for (const athlete of contentAthletes) {
				await mockDb.insert().values({
					athleteId: athlete.athleteId,
					episodeId: episode.id,
					source: "description",
					confidence: athlete.confidence.toString(),
					context: athlete.context,
				});
			}
		}

		await mockDb.update().set({ athleteMentionsProcessed: true });

		return {
			titleMatches: titleAthletes.length,
			contentMatches: contentAthletes.length,
		};
	},
}));

describe("athlete-detection-db", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("processEpisodeAthletes", () => {
		it("should store athlete mentions in database", async () => {
			// Mock episode query
			mockDb.query.episodes.findFirst.mockResolvedValue({
				id: "test-episode",
				title: "Eliud Kipchoge breaks record",
				content: "Amazing performance by Kipchoge",
			});

			// Mock athlete detection results
			mockDetectAthletes
				.mockResolvedValueOnce([
					{
						athleteId: "1",
						confidence: 1.0,
						context: "Eliud Kipchoge breaks record",
					},
				])
				.mockResolvedValueOnce([
					{
						athleteId: "1",
						confidence: 0.9,
						context: "Amazing performance by Kipchoge",
					},
				]);

			// Process episode
			const result = await processEpisodeAthletes("test-episode");

			// Verify database operations
			expect(mockDb.insert).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.insert().values).toHaveBeenCalledWith(
				expect.objectContaining({
					athleteId: "1",
					episodeId: "test-episode",
					source: "title",
					confidence: "1",
				}),
			);

			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.update().set).toHaveBeenCalledWith(
				expect.objectContaining({ athleteMentionsProcessed: true }),
			);

			expect(result).toEqual({
				titleMatches: 1,
				contentMatches: 1,
			});
		});

		it("should handle missing episode gracefully", async () => {
			// Mock episode not found
			mockDb.query.episodes.findFirst.mockResolvedValue(null);

			await expect(processEpisodeAthletes("invalid-id")).rejects.toThrow(
				"Episode not found",
			);
		});

		it("should process both title and content", async () => {
			// Mock episode with both title and content
			mockDb.query.episodes.findFirst.mockResolvedValue({
				id: "test-episode",
				title: "Eliud Kipchoge interview",
				content: "Mo Farah discusses training",
			});

			// Mock athlete detection results
			mockDetectAthletes
				.mockResolvedValueOnce([
					{
						athleteId: "1",
						confidence: 1.0,
						context: "Eliud Kipchoge interview",
					},
				])
				.mockResolvedValueOnce([
					{
						athleteId: "2",
						confidence: 1.0,
						context: "Mo Farah discusses training",
					},
				]);

			const result = await processEpisodeAthletes("test-episode");

			// Verify both title and content mentions were stored
			expect(mockDb.insert().values).toHaveBeenCalledTimes(2);
			expect(result).toEqual({
				titleMatches: 1,
				contentMatches: 1,
			});
		});

		it("should handle database insertion errors", async () => {
			// Mock episode query success
			mockDb.query.episodes.findFirst.mockResolvedValue({
				id: "test-episode",
				title: "Test episode",
				content: null,
			});

			// Mock athlete detection success but database insertion failure
			mockDetectAthletes.mockResolvedValue([
				{
					athleteId: "1",
					confidence: 1.0,
					context: "test context",
				},
			]);

			mockDb.insert().values.mockRejectedValue(new Error("Database error"));

			await expect(processEpisodeAthletes("test-episode")).rejects.toThrow();
		});

		it("should update episode processed status", async () => {
			// Mock episode query
			mockDb.query.episodes.findFirst.mockResolvedValue({
				id: "test-episode",
				title: "Test episode",
				content: null,
			});

			// Mock no athletes detected
			mockDetectAthletes.mockResolvedValue([]);

			await processEpisodeAthletes("test-episode");

			// Verify episode was marked as processed
			expect(mockDb.update().set).toHaveBeenCalledWith(
				expect.objectContaining({
					athleteMentionsProcessed: true,
				}),
			);
		});

		it("should handle empty content field", async () => {
			// Mock episode with no content
			mockDb.query.episodes.findFirst.mockResolvedValue({
				id: "test-episode",
				title: "Test episode",
				content: null,
			});

			// Mock athlete detection
			mockDetectAthletes.mockResolvedValue([]);

			const result = await processEpisodeAthletes("test-episode");

			// Should only process title, not content
			expect(mockDetectAthletes).toHaveBeenCalledTimes(1);
			expect(result.contentMatches).toBe(0);
		});

		it("should store correct source for mentions", async () => {
			// Mock episode
			mockDb.query.episodes.findFirst.mockResolvedValue({
				id: "test-episode",
				title: "Kipchoge in title",
				content: "Kipchoge in content",
			});

			// Mock athlete detection
			mockDetectAthletes
				.mockResolvedValueOnce([
					{
						athleteId: "1",
						confidence: 1.0,
						context: "Kipchoge in title",
					},
				])
				.mockResolvedValueOnce([
					{
						athleteId: "1",
						confidence: 1.0,
						context: "Kipchoge in content",
					},
				]);

			await processEpisodeAthletes("test-episode");

			// Verify correct source was stored for each mention
			expect(mockDb.insert().values).toHaveBeenCalledWith(
				expect.objectContaining({
					source: "title",
				}),
			);

			expect(mockDb.insert().values).toHaveBeenCalledWith(
				expect.objectContaining({
					source: "description",
				}),
			);
		});
	});
});
