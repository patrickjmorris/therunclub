import { type NextRequest, NextResponse } from "next/server";
import { getUserZipFromHeaders } from "@/lib/geolocation";

// Enforce Edge runtime for accessing geolocation headers
export const runtime = "edge";

/**
 * Converts Headers object to a plain Record<string, string>.
 * Handles potential string[] values by taking the first element.
 */
function headersToRecord(headers: Headers): Record<string, string> {
	const record: Record<string, string> = {};
	headers.forEach((value, key) => {
		// RunSignup expects single string values
		record[key] = Array.isArray(value) ? value[0] : value;
	});
	return record;
}

export async function GET(request: NextRequest) {
	// Get headers from the incoming request object
	const headersRecord = headersToRecord(request.headers);

	const zipCode = getUserZipFromHeaders(headersRecord);

	// Return the ZIP code or a default/null if not found
	return NextResponse.json({ zipCode: zipCode ?? null });
}
