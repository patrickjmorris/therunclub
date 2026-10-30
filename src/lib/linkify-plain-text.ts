export interface TextSegment {
	type: "text";
	value: string;
}

export interface LinkSegment {
	type: "link";
	value: string;
	href: string;
}

export type PlainTextSegment = TextSegment | LinkSegment;

// Same URL shape the video page previously linkified, limited to http(s).
const URL_PATTERN =
	/(\bhttps?:\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;

function isSafeHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

function pushText(segments: PlainTextSegment[], value: string) {
	if (!value) return;
	const previous = segments[segments.length - 1];
	if (previous?.type === "text") {
		previous.value += value;
		return;
	}
	segments.push({ type: "text", value });
}

/**
 * Split plain text into text and http(s) link segments.
 * Markup in the source stays in text segments so it is never parsed as HTML.
 */
export function linkifyPlainText(text: string): PlainTextSegment[] {
	if (!text) return [];

	const segments: PlainTextSegment[] = [];
	let lastIndex = 0;

	for (const match of text.matchAll(URL_PATTERN)) {
		const url = match[1];
		const index = match.index;
		if (!url || index === undefined) continue;

		pushText(segments, text.slice(lastIndex, index));
		if (isSafeHttpUrl(url)) {
			segments.push({ type: "link", value: url, href: url });
		} else {
			pushText(segments, url);
		}
		lastIndex = index + url.length;
	}

	pushText(segments, text.slice(lastIndex));
	return segments;
}
