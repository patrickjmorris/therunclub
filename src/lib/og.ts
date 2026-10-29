import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { get as httpGet } from "node:http";
import { get as httpsGet } from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";
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
				new Error(`Refusing private address for ${hostname}`),
				"",
				0,
			);
		}
		if (options.all) return callback(null, list);
		callback(null, list[0].address, list[0].family);
	});
};

const MAX_REDIRECTS = 5;
const MAX_BYTES = 1_000_000;
const TIMEOUT_MS = 3000;

interface FetchedPage {
	url: string;
	status: number;
	headers: Record<string, string>;
	data: string;
}

function requestOnce(url: URL): Promise<FetchedPage & { location?: string }> {
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		return Promise.reject(new Error(`Unsupported protocol for ${url.href}`));
	}
	// IP literals skip DNS lookup, so check them directly. URL.hostname
	// keeps brackets on IPv6 literals.
	const host = url.hostname.replace(/^\[(.*)\]$/, "$1");
	const family = isIP(host);
	if (family && isPrivate(host, family)) {
		return Promise.reject(
			new Error(`Refusing private address for ${url.href}`),
		);
	}
	const get = url.protocol === "https:" ? httpsGet : httpGet;
	return new Promise((resolve, reject) => {
		const request = get(
			url,
			{
				lookup: publicLookup,
				timeout: TIMEOUT_MS,
				headers: {
					"user-agent": HEADERS.userAgent,
					accept: HEADERS.accept,
					"accept-language": HEADERS.acceptLanguage,
				},
			},
			(response) => {
				const headers: Record<string, string> = {};
				for (const [key, value] of Object.entries(response.headers)) {
					if (value !== undefined) headers[key] = String(value);
				}
				const status = response.statusCode ?? 0;
				if (status >= 300 && status < 400 && headers.location) {
					response.resume();
					return resolve({
						url: url.href,
						status,
						headers,
						data: "",
						location: headers.location,
					});
				}
				const chunks: Buffer[] = [];
				let size = 0;
				// OG tags live in <head>, so a capped body is still enough.
				const finish = () =>
					resolve({
						url: url.href,
						status,
						headers,
						data: Buffer.concat(chunks).toString("utf8"),
					});
				response.on("data", (chunk: Buffer) => {
					chunks.push(chunk);
					size += chunk.length;
					if (size >= MAX_BYTES) {
						finish();
						request.destroy();
					}
				});
				response.on("end", finish);
				response.on("error", reject);
			},
		);
		request.on("timeout", () =>
			request.destroy(
				Object.assign(new Error("Request timed out"), {
					name: "TimeoutError",
				}),
			),
		);
		request.on("error", reject);
	});
}

async function fetchPublicPage(target: string): Promise<FetchedPage> {
	let url = new URL(target);
	for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
		const { location, ...page } = await requestOnce(url);
		if (!location) return page;
		url = new URL(location, url);
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
		const page = await fetchPublicPage(url);
		// Error pages ("Page not found") aren't a preview of the site.
		if (page.status >= 400) throw new Error(`HTTP ${page.status}`);
		const data = await getPreviewFromContent(page);

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
