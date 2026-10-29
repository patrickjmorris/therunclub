import { NextResponse, type NextRequest } from "next/server";
import { getOpenGraphData } from "@/lib/og";
import { createWeeklyCache } from "@/lib/utils/cache";

// Previews load on demand from the client. The CDN caches each request
// URL; the data cache keys on the canonical page URL, so differently
// spelled requests for one page still fetch it at most once a week.
// Transient failures throw past the data cache and get a short CDN TTL.
const CACHED = "public, s-maxage=604800, stale-while-revalidate=86400";
const RETRY_SOON = "public, s-maxage=300";

const getPreview = createWeeklyCache(
	(url: string) => getOpenGraphData(url),
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

	try {
		const preview = await getPreview(target.href);
		return NextResponse.json(
			{ preview },
			{ headers: { "Cache-Control": CACHED } },
		);
	} catch (error) {
		console.warn(
			`Link preview failed for ${target.href}: ${error instanceof Error ? error.message : error}`,
		);
		return NextResponse.json(
			{ preview: null },
			{ headers: { "Cache-Control": RETRY_SOON } },
		);
	}
}
