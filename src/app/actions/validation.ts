import { z } from "zod";

export const addPodcastSchema = z.object({
	feedUrl: z.string().url("Please enter a valid URL"),
});

export const addVideoSchema = z.object({
	url: z
		.string()
		.min(1, "URL is required")
		.transform((url) => url.trim()),
	forceUpdate: z.preprocess(
		(val) => val === "true" || val === true,
		z.boolean().default(false),
	),
});
