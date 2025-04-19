// Utility for extracting ZIP code from Vercel or standard geolocation headers

/**
 * Attempts to extract the user's ZIP code from Vercel Edge headers or standard geolocation headers.
 * @param headers Incoming request headers (lowercase keys)
 * @returns ZIP code string if found, otherwise null
 */
export function getUserZipFromHeaders(
	headers: Record<string, string | string[] | undefined>,
): string | null {
	// Vercel's edge geolocation header (see docs)
	const vercelZip =
		headers["x-vercel-ip-postal-code"] || headers["x-vercel-ip-country-region"]; // Prioritize postal code
	if (typeof vercelZip === "string" && vercelZip.match(/^\d{5}$/)) {
		return vercelZip;
	}
	if (Array.isArray(vercelZip) && vercelZip[0]?.match(/^\d{5}$/)) {
		return vercelZip[0];
	}

	// Common fallback headers (e.g. Cloudflare)
	const cfZip = headers["cf-postal-code"];
	if (typeof cfZip === "string" && cfZip.match(/^\d{5}$/)) {
		return cfZip;
	}
	if (Array.isArray(cfZip) && cfZip[0]?.match(/^\d{5}$/)) {
		return cfZip[0];
	}

	// Not found
	return null;
}
