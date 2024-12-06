import { z } from "zod";

export const raceFiltersSchema = z.object({
	location: z.string().optional(),
	distance: z.number().optional(),
	type: z.enum(["road", "trail", "track", "cross_country"]).optional(),
	terrain: z.enum(["road", "trail", "track", "mixed"]).optional(),
});

export type RaceFilters = z.infer<typeof raceFiltersSchema>;
