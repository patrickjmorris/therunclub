import { describe, it, expect } from "vitest";
import { createFuzzyMatcher } from "../fuzzy-matcher";

describe("fuzzy-matcher", () => {
	describe("createFuzzyMatcher", () => {
		it("should create a fuzzy matcher with search function", () => {
			const matcher = createFuzzyMatcher(["test"]);
			expect(matcher).toHaveProperty("search");
			expect(typeof matcher.search).toBe("function");
		});

		it("should find exact matches with high confidence", () => {
			const targets = ["Eliud Kipchoge", "Mo Farah", "Brigid Kosgei"];
			const matcher = createFuzzyMatcher(targets);

			const results = matcher.search("Eliud Kipchoge");
			expect(results).toHaveLength(1);
			expect(results[0].target).toBe("Eliud Kipchoge");
			expect(results[0].score).toBe(1);
		});

		it("should find close matches with reasonable confidence", () => {
			const targets = ["Eliud Kipchoge", "Mo Farah", "Brigid Kosgei"];
			const matcher = createFuzzyMatcher(targets);

			const results = matcher.search("Eliud Kipchog");
			expect(results).toHaveLength(1);
			expect(results[0].target).toBe("Eliud Kipchoge");
			expect(results[0].score).toBeGreaterThan(0.8);
		});

		it("should handle case insensitive matching", () => {
			const targets = ["Eliud Kipchoge", "Mo Farah", "Brigid Kosgei"];
			const matcher = createFuzzyMatcher(targets);

			const results = matcher.search("eliud kipchoge");
			expect(results).toHaveLength(1);
			expect(results[0].target).toBe("Eliud Kipchoge");
			expect(results[0].score).toBe(1);
		});

		it("should return multiple matches sorted by score", () => {
			const targets = ["Eliud Kipchoge", "Eliud Kipsang", "Eliud Kipruto"];
			const matcher = createFuzzyMatcher(targets);

			const results = matcher.search("Eliud K");
			expect(results.length).toBeGreaterThan(1);

			// Verify results are sorted by score
			for (let i = 1; i < results.length; i++) {
				expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
			}
		});

		it("should handle empty input", () => {
			const targets = ["Eliud Kipchoge", "Mo Farah", "Brigid Kosgei"];
			const matcher = createFuzzyMatcher(targets);

			const results = matcher.search("");
			expect(results).toHaveLength(0);
		});

		it("should handle empty target list", () => {
			const matcher = createFuzzyMatcher([]);
			const results = matcher.search("test");
			expect(results).toHaveLength(0);
		});

		it("should not return matches below threshold", () => {
			const targets = ["Eliud Kipchoge", "Mo Farah", "Brigid Kosgei"];
			const matcher = createFuzzyMatcher(targets);

			const results = matcher.search("completely different");
			expect(results).toHaveLength(0);
		});

		it("should handle partial word matches", () => {
			const targets = ["Eliud Kipchoge", "Mo Farah", "Brigid Kosgei"];
			const matcher = createFuzzyMatcher(targets);

			const results = matcher.search("Kipchoge");
			expect(results).toHaveLength(1);
			expect(results[0].target).toBe("Eliud Kipchoge");
			expect(results[0].score).toBeGreaterThan(0.5);
		});

		it("should handle special characters", () => {
			const targets = ["O'Sullivan", "Smith-Jones", "García"];
			const matcher = createFuzzyMatcher(targets);

			const results1 = matcher.search("O'Sullivan");
			expect(results1).toHaveLength(1);
			expect(results1[0].score).toBe(1);

			const results2 = matcher.search("Smith-Jones");
			expect(results2).toHaveLength(1);
			expect(results2[0].score).toBe(1);

			const results3 = matcher.search("Garcia");
			expect(results3).toHaveLength(1);
			expect(results3[0].target).toBe("García");
			expect(results3[0].score).toBeGreaterThan(0.8);
		});
	});
});
