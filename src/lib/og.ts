import { getLinkPreview } from "link-preview-js";

const HEADERS = {
	userAgent:
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
	accept:
		"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
	acceptLanguage: "en-US,en;q=0.5",
} as const;

export interface OpenGraphData {
	title: string;
	description: string;
	image: string;
	url: string;
}

function cleanContent(content: string | null): string {
	if (!content) return "";
	// Remove excessive whitespace and newlines
	return content.trim().replace(/\s+/g, " ");
}

// Original implementation (commented out for now)
/*
export async function getOpenGraphData(url: string): Promise<OpenGraphData> {
	// ... existing implementation ...
}
*/

// New implementation using link-preview-js with timeout handling
export async function getOpenGraphData(url: string): Promise<OpenGraphData> {
	try {
		const data = await getLinkPreview(url, {
			timeout: 3000,
			followRedirects: "follow",
			headers: {
				"user-agent": HEADERS.userAgent,
				accept: HEADERS.accept,
				"accept-language": HEADERS.acceptLanguage,
			},
		});

		// Handle different response types from link-preview-js
		if ("title" in data && typeof data.title === "string") {
			return {
				title: data.title || new URL(url).hostname,
				description:
					"description" in data && typeof data.description === "string"
						? cleanContent(data.description)
						: "",
				image:
					"images" in data &&
					Array.isArray(data.images) &&
					data.images.length > 0
						? data.images[0]
						: "",
				url: "url" in data && typeof data.url === "string" ? data.url : url,
			};
		}

		// Handle media types (images, videos, etc)
		if ("mediaType" in data) {
			return {
				title: new URL(url).hostname,
				description: data.mediaType || "Media content",
				image: data.mediaType === "image" ? url : "",
				url,
			};
		}

		// Fallback for other types
		return {
			title: new URL(url).hostname,
			description: "",
			image: "",
			url,
		};
	} catch (error: unknown) {
		console.error("Error fetching link preview:", error);
		if (
			error instanceof Error &&
			(error.message?.includes("timeout") || error.message?.includes("aborted"))
		) {
			return {
				title: new URL(url).hostname,
				description: "Preview timed out.",
				image: "",
				url,
			};
		}
		return {
			title: new URL(url).hostname,
			description: "Could not load preview.",
			image: "",
			url,
		};
	}
}
