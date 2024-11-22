import { iTunesSearchResponse } from "@/lib/itunes-types";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const response = await fetch(
			"https://itunes.apple.com/search?term=podcast&genreId=1551&limit=200",
			{ next: { revalidate: 3600 } }, // Cache for 1 hour
		);

		if (!response.ok) {
			throw new Error(`iTunes API error: ${response.statusText}`);
		}

		const data = (await response.json()) as iTunesSearchResponse;
		console.log("data", JSON.stringify(data.results[7], null, 2));
		return NextResponse.json(data);
	} catch (error) {
		console.error("iTunes search error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch iTunes podcasts" },
			{ status: 500 },
		);
	}
}
