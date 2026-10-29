import { NextResponse, type NextRequest } from "next/server";
import { getOpenGraphData } from "@/lib/og";

// Previews load on demand from the client; the CDN caches each URL so
// builds and page renders never wait on third-party sites.
const CACHE = "public, s-maxage=604800, stale-while-revalidate=86400";

export async function GET(request: NextRequest) {
	const url = request.nextUrl.searchParams.get("url");
	if (!url || !URL.canParse(url)) {
		return NextResponse.json({ error: "Invalid url" }, { status: 400 });
	}

	const og = await getOpenGraphData(url);
	// getOpenGraphData falls back to the hostname as title on failure.
	const preview = og.title && og.title !== new URL(url).hostname ? og : null;
	return NextResponse.json(
		{ preview },
		{ headers: { "Cache-Control": CACHE } },
	);
}
