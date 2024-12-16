import { z } from "zod";

export const addPodcastSchema = z.object({
	feedUrl: z.string().url("Please enter a valid URL"),
});

export const addChannelSchema = z.object({
	url: z.string().min(1, "Please enter a YouTube channel URL"),
});
