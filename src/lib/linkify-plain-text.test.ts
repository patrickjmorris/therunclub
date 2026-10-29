import { describe, expect, it } from "vitest";
import { linkifyPlainText } from "@/lib/linkify-plain-text";

describe("linkifyPlainText", () => {
	it("returns no segments for empty text", () => {
		expect(linkifyPlainText("")).toEqual([]);
	});

	it("keeps markup as text and linkifies http(s) urls", () => {
		const segments = linkifyPlainText(
			'See https://example.com/a?b=1&c=2 and <script>alert(1)</script> <img src=x onerror="alert(1)">',
		);

		expect(segments).toEqual([
			{ type: "text", value: "See " },
			{
				type: "link",
				value: "https://example.com/a?b=1&c=2",
				href: "https://example.com/a?b=1&c=2",
			},
			{
				type: "text",
				value: ' and <script>alert(1)</script> <img src=x onerror="alert(1)">',
			},
		]);
	});

	it("never emits a non-http href", () => {
		const segments = linkifyPlainText(
			'javascript:alert(1) and <a href="javascript:alert(1)">click</a> https://ok.example/path',
		);

		for (const segment of segments) {
			if (segment.type !== "link") continue;
			expect(segment.href.startsWith("https://")).toBe(true);
			expect(segment.href.startsWith("javascript:")).toBe(false);
		}

		const text = segments
			.filter((segment) => segment.type === "text")
			.map((segment) => segment.value)
			.join("");
		expect(text).toContain("javascript:alert(1)");
		expect(text).toContain("<a href=");
	});

	it("preserves newlines and ampersands in the surrounding text", () => {
		expect(linkifyPlainText("Tom & Jerry <3\nhttps://example.com")).toEqual([
			{ type: "text", value: "Tom & Jerry <3\n" },
			{
				type: "link",
				value: "https://example.com",
				href: "https://example.com",
			},
		]);
	});
});
