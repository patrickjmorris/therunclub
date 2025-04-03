import { z } from "zod";

export const addPodcastSchema = z.object({
	feedUrl: z.string().url("Please enter a valid URL"),
});

export const addChannelSchema = z.object({
	url: z
		.string()
		.min(1, "URL is required")
		.transform((val) => {
			const trimmed = val.trim();
			console.log("Transformed URL value:", trimmed);
			console.log("URL length:", trimmed.length);
			console.log(
				"URL character codes:",
				[...trimmed].map((c) => c.charCodeAt(0)),
			);
			return trimmed;
		})
		.refine((val) => {
			console.log("Validating channel URL:", val);
			console.log("URL type:", typeof val);

			// More permissive patterns
			const fullUrlPattern =
				/^(https?:\/\/)?(www\.)?(youtube\.com)\/@([^\/\s?&]+)/i;
			const channelUrlPattern =
				/^(https?:\/\/)?(www\.)?(youtube\.com)\/(channel)\/([^\/\s?&]+)/i;
			const cUrlPattern =
				/^(https?:\/\/)?(www\.)?(youtube\.com)\/(c)\/([^\/\s?&]+)/i;
			const userUrlPattern =
				/^(https?:\/\/)?(www\.)?(youtube\.com)\/(user)\/([^\/\s?&]+)/i;
			const domainPattern = /^(https?:\/\/)?(www\.)?(youtube\.com)\/?$/i;
			const channelIdPattern = /^UC[\w-]{21,22}$/i;
			const handlePattern = /^@[\w\.-]+$/i;

			// Test each pattern and log the match groups
			const fullUrlMatch = val.match(fullUrlPattern);
			console.log("Full URL match:", fullUrlMatch);

			const channelUrlMatch = val.match(channelUrlPattern);
			console.log("Channel URL match:", channelUrlMatch);

			const cUrlMatch = val.match(cUrlPattern);
			console.log("Custom URL match:", cUrlMatch);

			const userUrlMatch = val.match(userUrlPattern);
			console.log("User URL match:", userUrlMatch);

			// Test simple patterns
			const isFullUrl = fullUrlPattern.test(val);
			const isChannelUrl = channelUrlPattern.test(val);
			const isCUrl = cUrlPattern.test(val);
			const isUserUrl = userUrlPattern.test(val);
			const isDomain = domainPattern.test(val);
			const isChannelId = channelIdPattern.test(val);
			const isHandle = handlePattern.test(val);

			console.log("URL validation results:", {
				isFullUrl,
				isChannelUrl,
				isCUrl,
				isUserUrl,
				isDomain,
				isChannelId,
				isHandle,
			});

			// Try direct string matching for common patterns
			const isHandleUrl = val.includes("youtube.com/@");
			console.log("Direct handle URL check:", isHandleUrl);

			// Accept any of these formats
			return (
				isFullUrl ||
				isChannelUrl ||
				isCUrl ||
				isUserUrl ||
				isDomain ||
				isChannelId ||
				isHandle ||
				isHandleUrl
			);
		}, "Invalid YouTube channel URL or handle. Valid formats: full YouTube channel URL, @username, or channel ID"),
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
