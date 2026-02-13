"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type AthleteImageBaseProps = {
	src?: string | null;
	name?: string | null;
	alt?: string;
	className?: string;
	priority?: boolean;
};

type AthleteImageFillProps = AthleteImageBaseProps & {
	fill: true;
	sizes: string;
	width?: never;
	height?: never;
};

type AthleteImageFixedProps = AthleteImageBaseProps & {
	fill?: false;
	width: number;
	height: number;
	sizes?: never;
};

export type AthleteImageProps = AthleteImageFillProps | AthleteImageFixedProps;

function normalizeSrc(src?: string | null) {
	const trimmed = (src ?? "").trim();
	return trimmed.length > 0 ? trimmed : null;
}

function getInitials(name?: string | null) {
	const n = (name ?? "").trim();
	if (!n) return "?";

	const parts = n.split(/\s+/).filter(Boolean);
	if (parts.length >= 2) {
		const first = parts[0]?.[0] ?? "";
		const last = parts[parts.length - 1]?.[0] ?? "";
		return `${first}${last}`.toUpperCase() || "?";
	}

	// Single token: take up to first 2 alphanumeric characters.
	const letters = parts[0]?.replace(/[^a-zA-Z0-9]/g, "") ?? "";
	return (letters.slice(0, 2) || parts[0].slice(0, 2)).toUpperCase() || "?";
}

function hashStringToInt(input: string) {
	let h = 0;
	for (let i = 0; i < input.length; i++) {
		h = (h << 5) - h + input.charCodeAt(i);
		h |= 0; // force 32-bit
	}
	return Math.abs(h);
}

function athletePlaceholderDataUrl(name?: string | null) {
	const label = (name ?? "Athlete").trim() || "Athlete";
	const initials = getInitials(label);

	const hash = hashStringToInt(label);
	const h1 = hash % 360;
	const h2 = (h1 + 35) % 360;

	const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${escapeXml(
		label,
	)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${h1},70%,45%)"/>
      <stop offset="1" stop-color="hsl(${h2},70%,35%)"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="50" fill="url(#g)"/>
  <text x="50" y="58" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" font-size="42" font-weight="700" fill="rgba(255,255,255,0.92)" letter-spacing="1">${escapeXml(
		initials,
	)}</text>
</svg>`;

	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(input: string) {
	return input
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

export function AthleteImage({
	src,
	name,
	alt,
	className,
	priority,
	...rest
}: AthleteImageProps) {
	const fallbackSrc = useMemo(
		() => athletePlaceholderDataUrl(name ?? alt ?? "Athlete"),
		[name, alt],
	);

	const [imgSrc, setImgSrc] = useState(() => normalizeSrc(src) ?? fallbackSrc);

	useEffect(() => {
		setImgSrc(normalizeSrc(src) ?? fallbackSrc);
	}, [src, fallbackSrc]);

	const imageAlt = alt ?? name ?? "Athlete";

	return (
		<Image
			{...rest}
			src={imgSrc}
			alt={imageAlt}
			priority={priority}
			className={className}
			onError={() => {
				if (imgSrc !== fallbackSrc) setImgSrc(fallbackSrc);
			}}
		/>
	);
}
