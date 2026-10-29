import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { get as httpGet } from "node:http";
import { get as httpsGet } from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";
import type { Transform } from "node:stream";
import {
	createBrotliDecompress,
	createGunzip,
	createInflate,
} from "node:zlib";
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

// A failure retrying won't fix (blocked host, unreadable response).
class NoPreviewError extends Error {}

function isPrivate(address: string, family: number) {
	const v4Mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
	if (v4Mapped) return PRIVATE.check(v4Mapped[1], "ipv4");
	return PRIVATE.check(address, family === 6 ? "ipv6" : "ipv4");
}

// Used as the socket's DNS lookup, so the address that is checked is the
// one connected to (no rebinding window). TLS still verifies the hostname.
const publicLookup: LookupFunction = (hostname, options, callback) => {
	dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
		if (error) return callback(error, "", 0);
		const list = addresses as LookupAddress[];
		if (list.length === 0 || list.some((a) => isPrivate(a.address, a.family))) {
			return callback(
				new NoPreviewError(`Refusing private address for ${hostname}`),
				"",
				0,
			);
		}
		if (options.all) return callback(null, list);
		callback(null, list[0].address, list[0].family);
	});
};

const MAX_REDIRECTS = 5;
// Decompressed bytes; OG tags live in <head>, so a capped body is enough.
const MAX_BYTES = 1_000_000;
// Wall-clock budget for the whole fetch, redirects included, so a slow
// drip of bytes can't hold the function open.
const DEADLINE_MS = 5000;

interface FetchedPage {
	url: string;
	status: number;
	headers: Record<string, string>;
	data: string;
}

// Content-Encoding lists codings in the order applied, so undo them in
// reverse. Unknown codings can't be read, so they fail the preview.
function decoders(contentEncoding: string | undefined): Transform[] {
	const codings = (contentEncoding ?? "")
		.split(",")
		.map((coding) => coding.trim().toLowerCase())
		.filter((coding) => coding && coding !== "identity");
	return codings.reverse().map((coding) => {
		if (coding === "gzip" || coding === "x-gzip") return createGunzip();
		if (coding === "deflate") return createInflate();
		if (coding === "br") return createBrotliDecompress();
		throw new NoPreviewError(`Unsupported content-encoding ${coding}`);
	});
}

function requestOnce(
	url: URL,
	signal: AbortSignal,
): Promise<FetchedPage & { location?: string }> {
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		return Promise.reject(new NoPreviewError(`Unsupported protocol for ${url.href}`));
	}
	// IP literals skip DNS lookup, so check them directly. URL.hostname
	// keeps brackets on IPv6 literals.
	const host = url.hostname.replace(/^\[(.*)\]$/, "$1");
	const family = isIP(host);
	if (family && isPrivate(host, family)) {
		return Promise.reject(
			new NoPreviewError(`Refusing private address for ${url.href}`),
		);
	}
	const get = url.protocol === "https:" ? httpsGet : httpGet;
	return new Promise((resolve, reject) => {
		let responded = false;
		let streams: Transform[] = [];
		// Every exit closes the socket and any decoders.
		const cleanup = () => {
			for (const stream of streams) stream.destroy();
			request.destroy();
		};
		const done = (page: FetchedPage & { location?: string }) => {
			resolve(page);
			cleanup();
		};
		const fail = (error: Error) => {
			reject(error);
			cleanup();
		};

		const request = get(
			url,
			{
				// One-off fetches to arbitrary hosts: no pooled sockets.
				agent: false,
				lookup: publicLookup,
				signal,
				headers: {
					"user-agent": HEADERS.userAgent,
					accept: HEADERS.accept,
					"accept-language": HEADERS.acceptLanguage,
					"accept-encoding": "gzip, deflate, br",
				},
			},
			(response) => {
				responded = true;
				const headers: Record<string, string> = {};
				for (const [key, value] of Object.entries(response.headers)) {
					if (value !== undefined) headers[key] = String(value);
				}
				const status = response.statusCode ?? 0;
				const page = { url: url.href, status, headers };
				if (status >= 300 && status < 400 && headers.location) {
					return done({ ...page, data: "", location: headers.location });
				}
				try {
					streams = decoders(headers["content-encoding"]);
				} catch (error) {
					return fail(error as Error);
				}
				const chunks: Buffer[] = [];
				let size = 0;
				const finish = () =>
					done({ ...page, data: Buffer.concat(chunks).toString("utf8") });
				let body: NodeJS.ReadableStream = response;
				for (const stream of streams) {
					stream.on("error", fail);
					body = body.pipe(stream);
				}
				body.on("data", (chunk: Buffer) => {
					if (size >= MAX_BYTES) return;
					chunks.push(chunk);
					size += chunk.length;
					if (size >= MAX_BYTES) finish();
				});
				body.on("end", finish);
				response.on("error", fail);
				// A body cut off mid-stream; no-op once settled.
				response.on("close", () => {
					if (!response.complete) {
						fail(new Error(`Connection closed by ${url.href}`));
					}
				});
			},
		);
		// Covers upgrades (101) and sockets closed before any response,
		// which otherwise never settle.
		request.on("upgrade", (_response, socket) => {
			socket.destroy();
			fail(new Error(`Unexpected upgrade from ${url.href}`));
		});
		request.on("close", () => {
			if (!responded) fail(new Error(`Connection closed by ${url.href}`));
		});
		request.on("error", fail);
	});
}

async function fetchPublicPage(target: string): Promise<FetchedPage> {
	const signal = AbortSignal.timeout(DEADLINE_MS);
	let url = new URL(target);
	for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
		const { location, ...page } = await requestOnce(url, signal);
		if (!location) return page;
		url = new URL(location, url);
	}
	throw new NoPreviewError(`Too many redirects for ${target}`);
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

// HTTP statuses worth retrying; any other 4xx/5xx is a page with no
// preview.
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

// Resolves to the preview, or null when the page definitively has none
// (error page, no title, blocked or dead host): safe to cache. Throws on
// failures that may pass (timeouts, resets, 5xx), so they aren't cached.
export async function getOpenGraphData(
	url: string,
): Promise<OpenGraphData | null> {
	let page: FetchedPage;
	try {
		page = await fetchPublicPage(url);
	} catch (error) {
		if (error instanceof NoPreviewError) return null;
		if ((error as NodeJS.ErrnoException).code === "ENOTFOUND") return null;
		throw error;
	}
	if (RETRYABLE_STATUS.has(page.status)) {
		throw new Error(`HTTP ${page.status} from ${url}`);
	}
	// Error pages ("Page not found") aren't a preview of the site.
	if (page.status >= 400) return null;

	const data = await getPreviewFromContent(page);
	if (!("title" in data) || typeof data.title !== "string" || !data.title) {
		return null;
	}
	return {
		title: data.title,
		description:
			"description" in data && typeof data.description === "string"
				? cleanContent(data.description)
				: "",
		image:
			"images" in data && Array.isArray(data.images) && data.images.length > 0
				? data.images[0]
				: "",
		url: "url" in data && typeof data.url === "string" ? data.url : url,
	};
}
