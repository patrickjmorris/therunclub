import { describe, expect, it } from "vitest";
import imageLoader from "./image-loader";

const STORAGE =
	"https://akzhyzwiwjxtjuirmqyx.supabase.co/storage/v1/object/public";

describe("imageLoader", () => {
	it.each(["content-images/podcasts/a.webp", "athlete-images/athletes/b.webp"])(
		"sends %s through Vercel's optimizer",
		(path) => {
			const src = `${STORAGE}/${path}`;
			expect(imageLoader({ src, width: 384, quality: 75 })).toBe(
				`/_next/image?url=${encodeURIComponent(src)}&w=384&q=75`,
			);
		},
	);

	it("defaults quality to 75, the only value Next allows here", () => {
		const url = imageLoader({
			src: `${STORAGE}/athlete-images/athletes/b.webp`,
			width: 64,
		});
		expect(url).toMatch(/&w=64&q=75$/);
	});

	it.each([
		`${STORAGE}/content-images/episodes/c.webp`,
		"https://otherproject.supabase.co/storage/v1/object/public/athlete-images/b.webp",
		"https://img.runningwarehouse.com/shoe.jpg",
	])("leaves %s alone", (src) => {
		expect(imageLoader({ src, width: 384 })).toBe(src);
	});

	it("still resizes YouTube thumbnails and channel art", () => {
		expect(
			imageLoader({
				src: "https://i.ytimg.com/vi/abc/maxresdefault.jpg",
				width: 256,
			}),
		).toBe("https://i.ytimg.com/vi/abc/mqdefault.jpg");
		expect(
			imageLoader({ src: "https://yt3.ggpht.com/x=s88-c", width: 96 }),
		).toBe("https://yt3.ggpht.com/x=s96-c");
	});
});
