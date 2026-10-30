// Fixed base so a candidate can be resolved without inheriting the request host.
const REDIRECT_BASE = "https://redirect.invalid";

function isSingleSlashPath(value: string): boolean {
	return (
		value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
	);
}

function hasControlChar(value: string): boolean {
	for (const char of value) {
		const code = char.charCodeAt(0);
		if (code <= 31 || code === 127) return true;
	}
	return false;
}

// Decode twice so %2F%2F and %252F%252F cannot hide a protocol-relative path.
function decodePath(pathname: string): string | null {
	let decoded = pathname;
	for (let i = 0; i < 2; i++) {
		try {
			const next = decodeURIComponent(decoded);
			if (next === decoded) return decoded;
			decoded = next;
		} catch {
			return null;
		}
	}
	return decoded;
}

function isSafePath(value: string): boolean {
	if (!isSingleSlashPath(value)) return false;
	if (value.includes("\\") || hasControlChar(value)) return false;

	const decoded = decodePath(value);
	if (decoded == null) return false;
	if (!isSingleSlashPath(decoded)) return false;
	if (decoded.includes("\\") || hasControlChar(decoded)) return false;

	return true;
}

/**
 * Accept only a same-site relative path. Protocol-relative URLs (`//evil.com`),
 * backslashes, absolute URLs, and control characters fall back to `fallback`.
 */
export function getSafeRedirectPath(
	candidate: string | null | undefined,
	fallback: string,
): string {
	if (typeof candidate !== "string") return fallback;

	const value = candidate.trim();
	if (!isSafePath(value)) return fallback;

	let url: URL;
	try {
		url = new URL(value, REDIRECT_BASE);
	} catch {
		return fallback;
	}

	if (url.origin !== REDIRECT_BASE) return fallback;

	const path = `${url.pathname}${url.search}${url.hash}`;
	if (!isSafePath(url.pathname)) return fallback;
	if (url.search.includes("\\") || url.hash.includes("\\")) return fallback;

	// Callers pass this string to `new URL(path, origin)`. Reject it when
	// that resolution leaves the base, as with a pathname of "//evil.com".
	let resolved: URL;
	try {
		resolved = new URL(path, REDIRECT_BASE);
	} catch {
		return fallback;
	}
	if (resolved.origin !== REDIRECT_BASE) return fallback;

	return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}
