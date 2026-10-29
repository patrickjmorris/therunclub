import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

type OgImage = { url: string; width?: number; height?: number; alt?: string };

interface PageMetadataInput {
	title: string;
	description: string;
	path: string;
	images?: OgImage[];
	type?: "website" | "article" | "profile" | "video.other";
}

// Next replaces a parent's openGraph object wholesale, so every page that
// sets one must also carry url, siteName, and images.
export function pageMetadata({
	title,
	description,
	path,
	images,
	type = "website",
}: PageMetadataInput): Metadata {
	const ogImages = images?.length
		? images
		: [{ url: siteConfig.ogImage, width: 1200, height: 630 }];
	return {
		title,
		description,
		alternates: { canonical: path },
		openGraph: {
			type,
			title,
			description,
			url: path,
			siteName: siteConfig.name,
			locale: "en_US",
			images: ogImages,
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: ogImages.map((image) => image.url),
		},
	};
}

export function plainText(html: string) {
	return html
		.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#0?39;|&apos;/g, "'")
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
		.replace(/\s+/g, " ")
		.trim();
}

export function truncate(text: string, max = 155) {
	if (text.length <= max) return text;
	const cut = text.slice(0, max - 1);
	const lastSpace = cut.lastIndexOf(" ");
	return `${(lastSpace > max * 0.6
		? cut.slice(0, lastSpace)
		: cut
	).trimEnd()}…`;
}

export function metaDescription(
	html: string | null | undefined,
	fallback: string,
) {
	const text = html ? plainText(html) : "";
	return text ? truncate(text) : fallback;
}
