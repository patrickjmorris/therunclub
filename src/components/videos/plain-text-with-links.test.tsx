import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlainTextWithLinks } from "@/components/videos/plain-text-with-links";

describe("PlainTextWithLinks", () => {
	it("escapes markup and still linkifies https urls", () => {
		const html = renderToStaticMarkup(
			<PlainTextWithLinks
				text={
					'See <script>alert(1)</script> <img src=x onerror="alert(1)"> https://example.com/a?b=1&c=2'
				}
			/>,
		);

		expect(html).not.toContain("<script");
		expect(html).not.toContain("<img");
		expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
		expect(html).toContain("&lt;img");
		expect(html).toContain('href="https://example.com/a?b=1&amp;c=2"');
		expect(html).toContain('target="_blank"');
		expect(html).toContain('rel="noopener noreferrer"');
	});
});
