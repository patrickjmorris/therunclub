export function extractUrlsFromHtml(html: string): string[] {
	// First extract URLs from href attributes
	const hrefRegex = /href=["'](https?:\/\/[^"']+)["']/g;
	const hrefUrls = Array.from(html.matchAll(hrefRegex)).map(
		(match) => match[1],
	);

	// Then extract URLs from text content (for plain text URLs)
	const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
	const textUrls = Array.from(html.matchAll(urlRegex)).map((match) => match[1]);

	// Combine and deduplicate URLs
	const allUrls = [...new Set([...hrefUrls, ...textUrls])];

	return allUrls;
}

export function extractUrlsFromText(text: string): string[] {
	const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
	const urls = Array.from(text.matchAll(urlRegex)).map((match) => match[1]);
	return [...new Set(urls)];
}
