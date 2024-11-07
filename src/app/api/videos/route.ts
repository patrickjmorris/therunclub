import { NextRequest } from "next/server";
import { searchVideos, getVideoInfo } from "@/lib/youtube";
import { headers } from "next/headers";

export const runtime = "edge";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const videoId = searchParams.get("videoId");
	const query = searchParams.get("q");

	try {
		if (videoId) {
			const video = await getVideoInfo(videoId);
			return Response.json(video);
		}

		if (query) {
			const results = await searchVideos(query);
			return Response.json(results);
		}

		return Response.json(
			{ error: "Missing videoId or query parameter" },
			{ status: 400 },
		);
	} catch (error) {
		return Response.json(
			{ error: "Failed to fetch video data" },
			{ status: 500 },
		);
	}
}
