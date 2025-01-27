"use server";

import { getOpenGraphData } from "@/lib/og";

export async function fetchLinkPreviews(urls: string[]) {
	try {
		const previews = await Promise.allSettled(
			urls.map(async (url) => {
				try {
					const ogData = await getOpenGraphData(url);
					// Only include previews that have at least a title and aren't error states
					const isValid =
						ogData.title &&
						ogData.title !== url &&
						ogData.title !== new URL(url).hostname &&
						!ogData.title.includes("Request timeout") &&
						!ogData.title.includes("Connection failed") &&
						!ogData.title.includes("Page not found") &&
						!ogData.title.includes("Access denied") &&
						!ogData.title.includes("Too many requests");

					return {
						url,
						preview: isValid
							? {
									title: ogData.title,
									description: ogData.description,
									image: ogData.image,
									url: ogData.url,
							  }
							: null,
						error: isValid ? null : "Invalid preview data",
					};
				} catch (error) {
					console.error("Error fetching preview for URL:", url, error);
					return { url, preview: null, error: "Failed to fetch preview" };
				}
			}),
		);

		const results = previews.map((result) => {
			if (result.status === "fulfilled") {
				return result.value;
			}
			return { url: "", preview: null, error: "Failed to fetch preview" };
		});

		return { previews: results };
	} catch (error) {
		console.error("Error processing link previews:", error);
		throw new Error("Failed to process link previews");
	}
}
