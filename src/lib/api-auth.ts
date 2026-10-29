import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

function safeEqual(given: string | null, expected: string | undefined) {
	if (!given || !expected) return false;
	const a = Buffer.from(given);
	const b = Buffer.from(expected);
	return a.length === b.length && timingSafeEqual(a, b);
}

export function isAuthorizedJob(request: NextRequest | Request): boolean {
	return (
		safeEqual(request.headers.get("x-api-key"), process.env.UPDATE_API_KEY) ||
		safeEqual(
			request.headers.get("authorization"),
			process.env.CRON_SECRET && `Bearer ${process.env.CRON_SECRET}`,
		)
	);
}
