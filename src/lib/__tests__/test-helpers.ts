import { vi } from "vitest";
import type { DetectedAthlete } from "../athlete-detection";

export const mockAthletes = [
	{ id: "1", name: "Eliud Kipchoge" },
	{ id: "2", name: "Mo Farah" },
	{ id: "3", name: "Brigid Kosgei" },
];

export const mockDb = {
	select: vi.fn().mockReturnValue({
		from: vi.fn().mockReturnValue(mockAthletes),
	}),
	insert: vi.fn().mockReturnValue({
		values: vi.fn().mockResolvedValue(undefined),
	}),
	update: vi.fn().mockReturnValue({
		set: vi.fn().mockReturnValue({
			where: vi.fn().mockResolvedValue(undefined),
		}),
	}),
	query: {
		athletes: {
			findMany: vi.fn().mockResolvedValue(mockAthletes),
		},
		episodes: {
			findFirst: vi.fn(),
		},
	},
};

export function createMockDetectedAthletes(count: number): DetectedAthlete[] {
	return Array.from({ length: count }, (_, i) => ({
		athleteId: mockAthletes[i].id,
		confidence: 1.0,
		context: `Context for ${mockAthletes[i].name}`,
	}));
}
