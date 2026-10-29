import { lookup } from "node:dns/promises";
import { BlockList } from "node:net";
import { getPreviewFromContent } from "link-preview-js";

// Previews fetch user-supplied URLs server-side, so refuse any host that
// resolves to a private, loopback or link-local address (SSRF).
const PRIVATE = new BlockList();
for (const [net, prefix] of [
	["0.0.0.0", 8],
	["10.0.0.0", 8],
	["100.64.0.0", 10],
	["127.0.0.0", 8],
	["169.254.0.0", 16],
	["172.16.0.0", 12],
	["192.168.0.0", 16],
] as const) {
	PRIVATE.addSubnet(net, prefix, "ipv4");
}
for (const [net, prefix] of [
	["::", 128],
	["::1", 128],
	["fc00::", 7],
	["fe80::", 10],
] as const) {
	PRIVATE.addSubnet(net, prefix, "ipv6");
}

async function assertPublicHost(url: URL) {
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw new Error(`Unsupported protocol for ${url.href}`);
	}
	const addresses = await lookup(url.hostname, { all: true });
	for (const { address, family } of addresses) {
		const v4Mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
		const blocked = v4Mapped
			? PRIVATE.check(v4Mapped[1], "ipv4")
			: PRIVATE.check(address, family === 6 ? "ipv6" : "ipv4");
		if (blocked) throw new Error(`Refusing private address for ${url.href}`);
	}
}

const MAX_REDIRECTS = 3;

// Fetches by hostname (keeps TLS valid) after checking each hop's DNS.
async function fetchPublicPage(target: string) {
	let url = new URL(target);
	for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
		await assertPublicHost(url);
		const response = await fetch(url, {
			redirect: "manual",
			signal: AbortSignal.timeout(3000),
			headers: {
				"user-agent": HEADERS.userAgent,
				accept: HEADERS.accept,
				"accept-language": HEADERS.acceptLanguage,
			},
		});
		const location = response.headers.get("location");
		if (response.status >= 300 && response.status < 400 && location) {
			url = new URL(location, url);
			continue;
		}
		return {
			url: url.href,
			status: response.status,
			headers: Object.fromEntries(response.headers),
			data: await response.text(),
		};
	}
	throw new Error(`Too many redirects for ${target}`);
}

const HEADERS = {
	userAgent:
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
	accept:
		"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
	acceptLanguage: "en-US,en;q=0.5",
} as const;

export interface OpenGraphData {
	title: string;
	description: string;
	image: string;
	url: string;
}

function cleanContent(content: string | null): string {
	if (!content) return "";
	// Remove excessive whitespace and newlines
	return content.trim().replace(/\s+/g, " ");
}

export async function getOpenGraphData(url: string): Promise<OpenGraphData> {
	try {
		const data = await getPreviewFromContent(await fetchPublicPage(url));

		// Handle different response types from link-preview-js
		if ("title" in data && typeof data.title === "string") {
			return {
				title: data.title || new URL(url).hostname,
				description:
					"description" in data && typeof data.description === "string"
						? cleanContent(data.description)
						: "",
				image:
					"images" in data &&
					Array.isArray(data.images) &&
					data.images.length > 0
						? data.images[0]
						: "",
				url: "url" in data && typeof data.url === "string" ? data.url : url,
			};
		}

		// Handle media types (images, videos, etc)
		if ("mediaType" in data) {
			return {
				title: new URL(url).hostname,
				description: data.mediaType || "Media content",
				image: data.mediaType === "image" ? url : "",
				url,
			};
		}

		// Fallback for other types
		return {
			title: new URL(url).hostname,
			description: "",
			image: "",
			url,
		};
	} catch (error: unknown) {
		console.warn(
			`Link preview failed for ${url}: ${error instanceof Error ? error.message : error}`,
		);
		if (
			error instanceof Error &&
			(error.name === "TimeoutError" || error.message?.includes("aborted"))
		) {
			return {
				title: new URL(url).hostname,
				description: "Preview timed out.",
				image: "",
				url,
			};
		}
		return {
			title: new URL(url).hostname,
			description: "Could not load preview.",
			image: "",
			url,
		};
	}
}
