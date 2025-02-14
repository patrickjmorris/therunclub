import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractVibrantColors } from "../extract-vibrant-colors";
import Vibrant from "node-vibrant";
import sharp from "sharp";
import type { Palette, Swatch } from "node-vibrant/lib/color";

// Create a minimal mock of the Vibrant.Swatch class
class MockSwatch implements Partial<Swatch> {
	private _rgb: number[];
	private _hsl: number[];
	private _hex: string;
	private _population: number;

	constructor(hex: string, rgb: number[], hsl: number[], population: number) {
		this._hex = hex;
		this._rgb = rgb;
		this._hsl = hsl;
		this._population = population;
	}

	get hex(): string {
		return this._hex;
	}
}

type MockPalette = Record<keyof Palette, MockSwatch | null>;

// Mock dependencies
vi.mock("node-vibrant", () => ({
	default: {
		from: vi.fn().mockReturnValue({
			_src: "test",
			_opts: {},
			maxColorCount: 0,
			maxDimension: 0,
			addFilter: vi.fn(),
			removeFilter: vi.fn(),
			clearFilters: vi.fn(),
			useQuantizer: vi.fn(),
			useGenerator: vi.fn(),
			getQuantizer: vi.fn(),
			getGenerator: vi.fn(),
			getPalette: vi.fn(),
		}),
	},
}));

vi.mock("sharp", () => ({
	default: vi.fn().mockReturnValue({
		resize: vi.fn().mockReturnThis(),
		toBuffer: vi.fn(),
	}),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("extract-vibrant-colors", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetch.mockReset();
	});

	it("should extract vibrant color from image", async () => {
		// Mock fetch response
		mockFetch.mockResolvedValueOnce({
			arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
		});

		// Mock sharp processing
		const mockSharp = sharp as unknown as ReturnType<typeof vi.fn>;
		mockSharp.mockReturnValue({
			resize: vi.fn().mockReturnThis(),
			toBuffer: vi.fn().mockResolvedValue(Buffer.from("test")),
		});

		// Mock Vibrant palette
		const mockPalette = {
			Vibrant: new MockSwatch("#ff0000", [255, 0, 0], [0, 100, 50], 100),
			DarkVibrant: null,
			LightVibrant: null,
			Muted: null,
			DarkMuted: null,
			LightMuted: null,
		} as unknown as Palette;

		const mockBuilder = Vibrant.from("test");
		vi.mocked(mockBuilder.getPalette).mockResolvedValue(mockPalette);
		vi.mocked(Vibrant.from).mockReturnValue(mockBuilder);

		const result = await extractVibrantColors("https://example.com/image.jpg");
		expect(result).toBe("#ff0000");

		// Verify the processing pipeline
		expect(mockFetch).toHaveBeenCalledWith("https://example.com/image.jpg");
		expect(sharp).toHaveBeenCalled();
		expect(Vibrant.from).toHaveBeenCalled();
	});

	it("should return fallback color when no vibrant color found", async () => {
		// Mock fetch response
		mockFetch.mockResolvedValueOnce({
			arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
		});

		// Mock sharp processing
		const mockSharp = sharp as unknown as ReturnType<typeof vi.fn>;
		mockSharp.mockReturnValue({
			resize: vi.fn().mockReturnThis(),
			toBuffer: vi.fn().mockResolvedValue(Buffer.from("test")),
		});

		// Mock Vibrant palette with no vibrant color
		const mockPalette = {
			Vibrant: null,
			DarkVibrant: null,
			LightVibrant: null,
			Muted: null,
			DarkMuted: null,
			LightMuted: null,
		} as unknown as Palette;

		const mockBuilder = Vibrant.from("test");
		vi.mocked(mockBuilder.getPalette).mockResolvedValue(mockPalette);
		vi.mocked(Vibrant.from).mockReturnValue(mockBuilder);

		const result = await extractVibrantColors("https://example.com/image.jpg");
		expect(result).toBe("#1e3a8a"); // Fallback color
	});

	it("should handle fetch errors", async () => {
		mockFetch.mockRejectedValueOnce(new Error("Network error"));

		const result = await extractVibrantColors("https://example.com/image.jpg");
		expect(result).toBeNull();
	});

	it("should handle image processing errors", async () => {
		// Mock fetch success but sharp processing error
		mockFetch.mockResolvedValueOnce({
			arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
		});

		const mockSharp = sharp as unknown as ReturnType<typeof vi.fn>;
		mockSharp.mockImplementation(() => {
			throw new Error("Processing error");
		});

		const result = await extractVibrantColors("https://example.com/image.jpg");
		expect(result).toBeNull();
	});

	it("should handle color extraction errors", async () => {
		// Mock fetch and sharp success but Vibrant error
		mockFetch.mockResolvedValueOnce({
			arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
		});

		const mockSharp = sharp as unknown as ReturnType<typeof vi.fn>;
		mockSharp.mockReturnValue({
			resize: vi.fn().mockReturnThis(),
			toBuffer: vi.fn().mockResolvedValue(Buffer.from("test")),
		});

		const mockBuilder = Vibrant.from("test");
		vi.mocked(mockBuilder.getPalette).mockRejectedValue(
			new Error("Extraction error"),
		);
		vi.mocked(Vibrant.from).mockReturnValue(mockBuilder);

		const result = await extractVibrantColors("https://example.com/image.jpg");
		expect(result).toBeNull();
	});

	it("should resize image before processing", async () => {
		// Mock fetch response
		mockFetch.mockResolvedValueOnce({
			arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
		});

		// Mock sharp processing with spy on resize
		const resizeSpy = vi.fn().mockReturnThis();
		const mockSharp = sharp as unknown as ReturnType<typeof vi.fn>;
		mockSharp.mockReturnValue({
			resize: resizeSpy,
			toBuffer: vi.fn().mockResolvedValue(Buffer.from("test")),
		});

		// Mock successful color extraction
		const mockBuilder = Vibrant.from("test");
		vi.mocked(mockBuilder.getPalette).mockResolvedValue({
			Vibrant: new MockSwatch("#ff0000", [255, 0, 0], [0, 100, 50], 100),
			DarkVibrant: null,
			LightVibrant: null,
			Muted: null,
			DarkMuted: null,
			LightMuted: null,
		} as any);
		vi.mocked(Vibrant.from).mockReturnValue(mockBuilder);

		await extractVibrantColors("https://example.com/image.jpg");

		// Verify resize was called with correct parameters
		expect(resizeSpy).toHaveBeenCalledWith(300, 300, { fit: "inside" });
	});
});
