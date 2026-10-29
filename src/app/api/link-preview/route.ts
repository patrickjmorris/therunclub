import { NextResponse, type NextRequest } from "next/server";
import { getOpenGraphData } from "@/lib/og";
import { createWeeklyCache } from "@/lib/utils/cache";

// Previews load on demand from the client. The CDN caches each request
// URL; the data cache keys on the canonical page URL, so differently
// spelled requests for one page still fetch it at most once a week.
const CACHE = "public, s-maxage=604800, stale-while-revalidate=86400";

const getPreview = createWeeklyCache(
	async (url: string) => {
		const og = await getOpenGraphData(url);
		// getOpenGraphData falls back to the hostname as title on failure.
		return og.title && og.title !== new URL(url).hostname ? og : null;
	},
	["link-preview"],
	["link-preview"],
);

export async function GET(request: NextRequest) {
	const param = request.nextUrl.searchParams.get("url");
	if (!param || !URL.canParse(param)) {
		return NextResponse.json({ error: "Invalid url" }, { status: 400 });
	}
	// Fragments never reach the server, so drop them from the key.
	const target = new URL(param);
	target.hash = "";

	const preview = await getPreview(target.href);
	return NextResponse.json(
		{ preview },
		{ headers: { "Cache-Control": CACHE } },
	);
}
