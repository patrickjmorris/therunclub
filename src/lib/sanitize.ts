import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(dirty: string): string {
	return DOMPurify.sanitize(dirty, {
		USE_PROFILES: { html: true },
		ALLOWED_TAGS: [
			"p",
			"br",
			"b",
			"i",
			"em",
			"strong",
			"a",
			"ul",
			"ol",
			"li",
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6",
			"blockquote",
			"img",
			"pre",
			"code",
			"hr",
		],
		ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel"],
	});
}
