import { parse } from "node-html-parser";

const HEADERS = {
	userAgent:
		"Mozilla/5.0 (compatible; TheRunClub/1.0; +https://therunclub.xyz)",
	accept:
		"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
	acceptLanguage: "en-US,en;q=0.5",
} as const;

interface OpenGraphData {
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

export async function getOpenGraphData(url: string): Promise<OpenGraphData> {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

		const response = await fetch(url, {
			headers: {
				"User-Agent": HEADERS.userAgent,
				Accept: HEADERS.accept,
				"Accept-Language": HEADERS.acceptLanguage,
			},
			// Add next.js revalidate for 24 hours
			next: {
				revalidate: 60 * 60 * 24,
			},
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			const errorMessage = `Failed to fetch URL (${response.status}): ${response.statusText}`;
			console.error(errorMessage);
			// Return a more user-friendly response for common status codes
			if (response.status === 404) {
				return {
					title: "Page not found",
					description: "The requested page could not be found.",
					image: "",
					url,
				};
			}
			if (response.status === 403) {
				return {
					title: "Access denied",
					description: "Access to this page is restricted.",
					image: "",
					url,
				};
			}
			if (response.status === 429) {
				return {
					title: "Too many requests",
					description: "Please try again later.",
					image: "",
					url,
				};
			}
			return {
				title: new URL(url).hostname,
				description: "",
				image: "",
				url,
			};
		}

		const contentType = response.headers.get("content-type") || "";
		if (!contentType.includes("text/html")) {
			return {
				title: new URL(url).hostname,
				description: `Content type: ${contentType.split(";")[0]}`,
				image: "",
				url,
			};
		}

		const html = await response.text();
		const root = parse(html);

		// Helper function to get meta content with multiple selectors
		function getMetaContent(selectors: string[]): string | null {
			for (const selector of selectors) {
				const element = root.querySelector(selector);
				if (!element) continue;

				// Try content attribute first
				const content = element.getAttribute("content");
				if (content) return content;

				// For some meta tags, the content might be in other attributes
				const property = element.getAttribute("property");
				const name = element.getAttribute("name");
				if (property || name) {
					const value = element.getAttribute("value");
					if (value) return value;
				}
			}
			return null;
		}

		// Extract OpenGraph data with improved fallbacks
		const ogData = {
			title: cleanContent(
				getMetaContent([
					'meta[property="og:title"]',
					'meta[name="twitter:title"]',
					'meta[property="title"]',
					'meta[name="title"]',
				]) ||
					root.querySelector("title")?.text ||
					new URL(url).hostname,
			),

			description: cleanContent(
				getMetaContent([
					'meta[property="og:description"]',
					'meta[name="twitter:description"]',
					'meta[name="description"]',
					'meta[property="description"]',
				]) || "",
			),

			image: cleanContent(
				getMetaContent([
					'meta[property="og:image"]',
					'meta[property="og:image:secure_url"]',
					'meta[name="twitter:image"]',
					'meta[name="twitter:image:src"]',
					'meta[property="og:image:url"]',
					'meta[property="og:image:src"]',
				]) || "",
			),

			url: cleanContent(
				getMetaContent([
					'meta[property="og:url"]',
					'meta[property="al:web:url"]',
					'meta[property="twitter:url"]',
					'link[rel="canonical"]',
				]) || url,
			),
		};

		// Special handling for Instagram title and description only
		if (url.includes("instagram.com")) {
			// If title is missing or generic, try to get it from meta description
			if (!ogData.title || ogData.title.includes("Instagram")) {
				const metaDescription = getMetaContent(['meta[name="description"]']);
				if (metaDescription) {
					ogData.title = cleanContent(
						metaDescription.match(/from\s+([^)]+)\)/)?.[1] ?? ogData.title,
					);
				}
			}

			// Ensure description is set from meta description if missing
			if (!ogData.description) {
				const metaDescription = getMetaContent(['meta[name="description"]']);
				if (metaDescription) {
					ogData.description = cleanContent(metaDescription);
				}
			}
		}

		return ogData;
	} catch (error) {
		console.error("Error fetching OpenGraph data:", error);
		// Return more informative default data based on error type
		if (error instanceof TypeError && error.message.includes("aborted")) {
			return {
				title: "Request timeout",
				description: "The request took too long to complete.",
				image: "",
				url,
			};
		}
		if (
			error instanceof TypeError &&
			error.message.includes("Failed to fetch")
		) {
			return {
				title: "Connection failed",
				description: "Could not connect to the server.",
				image: "",
				url,
			};
		}
		try {
			const hostname = new URL(url).hostname;
			return {
				title: hostname,
				description: "Could not load preview.",
				image: "",
				url,
			};
		} catch {
			return {
				title: url,
				description: "",
				image: "",
				url,
			};
		}
	}
}
