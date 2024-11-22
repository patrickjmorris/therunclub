import { createPodcastIndexClient } from "@/lib/podcast-index";
import { NextResponse } from "next/server";

const podcastIndex = createPodcastIndexClient({
	key: process.env.PODCAST_INDEX_API_KEY || "",
	secret: process.env.PODCAST_INDEX_API_SECRET || "",
});

export async function GET(request: Request) {
	console.log("podcastIndex", JSON.stringify(podcastIndex, null, 2));
	const { searchParams } = new URL(request.url);
	const query = searchParams.get("q");

	if (!query) {
		return NextResponse.json(
			{ error: "Query parameter required" },
			{ status: 400 },
		);
	}

	try {
		const results = await podcastIndex.searchPodcasts(query);
		return NextResponse.json({ results });
	} catch (error) {
		console.error("Podcast search error:", error);
		return NextResponse.json(
			{ error: "Failed to search podcasts" },
			{ status: 500 },
		);
	}
}
