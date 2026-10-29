import { NextResponse, type NextRequest } from "next/server";
import { getOpenGraphData } from "@/lib/og";

// Previews load on demand from the client; the CDN caches each URL so
// builds and page renders never wait on third-party sites.
const CACHE = "public, s-maxage=604800, stale-while-revalidate=86400";

export async function GET(request: NextRequest) {
	const param = request.nextUrl.searchParams.get("url");
	if (!param || !URL.canParse(param)) {
		return NextResponse.json({ error: "Invalid url" }, { status: 400 });
	}
	// One cache entry per page: fragments never reach the server, so
	// varying them would only bust the CDN cache.
	const target = new URL(param);
	target.hash = "";
	const url = target.href;
	if (url !== param || request.nextUrl.searchParams.size !== 1) {
		const canonical = new URL("/api/link-preview", request.nextUrl);
		canonical.searchParams.set("url", url);
		return NextResponse.redirect(canonical, 308);
	}

	const og = await getOpenGraphData(url);
	// getOpenGraphData falls back to the hostname as title on failure.
	const preview = og.title && og.title !== new URL(url).hostname ? og : null;
	return NextResponse.json(
		{ preview },
		{ headers: { "Cache-Control": CACHE } },
	);
}
