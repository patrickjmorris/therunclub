import { NextResponse } from "next/server";
import { getOpenGraphData } from "@/lib/og";
import { unstable_cache } from "next/cache";

const getOgDataWithCache = unstable_cache(
	async (url: string) => {
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

			return isValid ? ogData : null;
		} catch {
			return null;
		}
	},
	["og-data"],
	{
		revalidate: 86400, // Cache for 24 hours
		tags: ["og-data"],
	},
);

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const url = searchParams.get("url");

	if (!url) {
		return NextResponse.json(
			{ error: "URL parameter is required" },
			{ status: 400 },
		);
	}

	try {
		const ogData = await getOgDataWithCache(url);

		if (!ogData) {
			return NextResponse.json(
				{ error: "No valid OpenGraph data found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(ogData);
	} catch (error) {
		console.error("Error fetching OpenGraph data:", error);
		return NextResponse.json(
			{ error: "Failed to fetch OpenGraph data" },
			{ status: 500 },
		);
	}
}
