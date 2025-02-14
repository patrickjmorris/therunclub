export interface DetectedAthlete {
	athleteId: string;
	confidence: number;
	context: string;
}

export interface ProcessEpisodeResult {
	titleMatches: number;
	contentMatches: number;
}
