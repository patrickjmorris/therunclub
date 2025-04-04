import { describe, it, expect } from "vitest";
import { extractVibrantColors } from "@/lib/server/extract-vibrant-colors";

describe("extractVibrantColors", () => {
	it("should successfully extract colors from a WebP image", async () => {
		// Using a known WebP image URL
		const webpImageUrl = "https://www.gstatic.com/webp/gallery/4.webp";

		const color = await extractVibrantColors(webpImageUrl);

		// Verify we got a valid color
		expect(color).not.toBeNull();
		expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
	});

	it("should handle non-WebP images as well", async () => {
		// Using a known JPEG image URL
		const jpegImageUrl = "https://picsum.photos/300/300";

		const color = await extractVibrantColors(jpegImageUrl);

		// Verify we got a valid color
		expect(color).not.toBeNull();
		expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
	});

	it("should return null for invalid images", async () => {
		const invalidImageUrl = "https://example.com/nonexistent.webp";

		const color = await extractVibrantColors(invalidImageUrl);

		expect(color).toBeNull();
	});
});
