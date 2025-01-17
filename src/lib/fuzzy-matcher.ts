interface FuzzyMatch {
	target: string;
	score: number;
}

interface FuzzyMatcher {
	search: (query: string) => FuzzyMatch[];
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = [];

	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}

	for (let j = 0; j <= a.length; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1, // substitution
					matrix[i][j - 1] + 1, // insertion
					matrix[i - 1][j] + 1, // deletion
				);
			}
		}
	}

	return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
	const maxLength = Math.max(str1.length, str2.length);
	if (maxLength === 0) return 1.0;
	const distance = levenshteinDistance(str1, str2);
	return 1 - distance / maxLength;
}

/**
 * Create a fuzzy matcher for a list of target strings
 */
export function createFuzzyMatcher(targets: string[]): FuzzyMatcher {
	// Normalize targets
	const normalizedTargets = targets.map((t) => t.toLowerCase());

	return {
		search: (query: string): FuzzyMatch[] => {
			const normalizedQuery = query.toLowerCase();
			const matches: FuzzyMatch[] = [];

			for (let i = 0; i < normalizedTargets.length; i++) {
				const target = normalizedTargets[i];
				const score = calculateSimilarity(normalizedQuery, target);

				if (score > 0.5) {
					// Only include somewhat relevant matches
					matches.push({
						target: targets[i], // Return original (non-normalized) target
						score,
					});
				}
			}

			// Sort by score descending
			return matches.sort((a, b) => b.score - a.score);
		},
	};
}
