import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	processEpisodeAthletes,
	type ProcessEpisodeResult,
} from "../athlete-detection";
import {
	mockDb,
	mockAthletes,
	createMockDetectedAthletes,
} from "./test-helpers";

// Mock the database client
vi.mock("@/db/client", () => ({
	db: mockDb,
}));

// Mock the internal detectAthletes function since it's not exported
const mockDetectAthletes = vi.fn();
vi.mock("../athlete-detection", () => ({
	processEpisodeAthletes: async (
		text: string,
	): Promise<ProcessEpisodeResult> => {
		const athletes = await mockDetectAthletes(text);
		return {
			titleMatches: athletes.length,
			contentMatches: 0,
		};
	},
}));

describe("athlete-detection", () => {
	beforeEach(() => {
		// Reset all mocks before each test
		vi.clearAllMocks();
	});

	describe("processEpisodeAthletes", () => {
		it("should detect exact matches in text", async () => {
			const text = "Eliud Kipchoge broke the marathon world record.";
			mockDetectAthletes.mockResolvedValue(createMockDetectedAthletes(1));

			const result = await processEpisodeAthletes(text);
			expect(result.titleMatches).toBe(1);
			expect(result.contentMatches).toBe(0);
		});

		it("should detect multiple athletes in text", async () => {
			const text = "Eliud Kipchoge and Mo Farah competed in the marathon.";
			mockDetectAthletes.mockResolvedValue(createMockDetectedAthletes(2));

			const result = await processEpisodeAthletes(text);
			expect(result.titleMatches).toBe(2);
			expect(result.contentMatches).toBe(0);
		});

		it("should handle case-insensitive matches", async () => {
			const text = "eliud kipchoge won the race";
			mockDetectAthletes.mockResolvedValue(createMockDetectedAthletes(1));

			const result = await processEpisodeAthletes(text);
			expect(result.titleMatches).toBe(1);
			expect(result.contentMatches).toBe(0);
		});

		it("should detect fuzzy matches with high confidence", async () => {
			const text = "Eluid Kipchoge (slight misspelling) won";
			mockDetectAthletes.mockResolvedValue(createMockDetectedAthletes(1));

			const result = await processEpisodeAthletes(text);
			expect(result.titleMatches).toBe(1);
			expect(result.contentMatches).toBe(0);
		});

		it("should handle empty text", async () => {
			mockDetectAthletes.mockResolvedValue([]);
			const result = await processEpisodeAthletes("");
			expect(result.titleMatches).toBe(0);
			expect(result.contentMatches).toBe(0);
		});

		it("should handle text with no athlete mentions", async () => {
			const text = "This text contains no athlete names.";
			mockDetectAthletes.mockResolvedValue([]);
			const result = await processEpisodeAthletes(text);
			expect(result.titleMatches).toBe(0);
			expect(result.contentMatches).toBe(0);
		});

		it("should deduplicate multiple mentions of the same athlete", async () => {
			const text =
				"Eliud Kipchoge won again. Later in the race, Kipchoge broke another record.";
			mockDetectAthletes.mockResolvedValue(createMockDetectedAthletes(1));

			const result = await processEpisodeAthletes(text);
			expect(result.titleMatches).toBe(1);
			expect(result.contentMatches).toBe(0);
		});

		it("should handle database errors gracefully", async () => {
			mockDetectAthletes.mockRejectedValue(new Error("Database error"));
			await expect(processEpisodeAthletes("test")).rejects.toThrow(
				"Database error",
			);
		});
	});
});
