import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

const FALLBACK = "/dashboard";
const ORIGIN = "https://app.example.com";

function resolvedOrigin(path: string): string {
	return new URL(path, ORIGIN).origin;
}

describe("getSafeRedirectPath", () => {
	it("uses the fallback when next is missing or blank", () => {
		expect(getSafeRedirectPath(null, FALLBACK)).toBe(FALLBACK);
		expect(getSafeRedirectPath(undefined, FALLBACK)).toBe(FALLBACK);
		expect(getSafeRedirectPath("", FALLBACK)).toBe(FALLBACK);
		expect(getSafeRedirectPath("   ", FALLBACK)).toBe(FALLBACK);
	});

	it("allows same-site relative paths, including search and hash", () => {
		expect(getSafeRedirectPath("/dashboard", FALLBACK)).toBe("/dashboard");
		expect(getSafeRedirectPath("/", "/")).toBe("/");
		expect(getSafeRedirectPath("/dashboard?tab=1", FALLBACK)).toBe(
			"/dashboard?tab=1",
		);
		expect(getSafeRedirectPath("/dashboard#section", FALLBACK)).toBe(
			"/dashboard#section",
		);
		expect(getSafeRedirectPath("/videos/abc?x=1#y", FALLBACK)).toBe(
			"/videos/abc?x=1#y",
		);
		expect(getSafeRedirectPath("  /dashboard  ", FALLBACK)).toBe("/dashboard");
	});

	it("keeps a protocol-relative value in the query on our path", () => {
		expect(getSafeRedirectPath("/dashboard?next=//evil.com", FALLBACK)).toBe(
			"/dashboard?next=//evil.com",
		);
	});

	it("rejects open-redirect payloads", () => {
		const rejected = [
			"//evil.com",
			"///evil.com",
			"////evil.com",
			"/\\evil.com",
			"/\\\\evil.com",
			"\\\\evil.com",
			"\\/\\/evil.com",
			"https://evil.com",
			"http://evil.com",
			"https://app.example.com/dashboard",
			"javascript:alert(1)",
			"javascript:alert(1)//",
			"dashboard",
			"https:evil.com",
			"//evil.com\\@app.example.com",
			"/\n/evil.com",
			"/\t/evil.com",
			"/foo\\bar",
			"/.//evil.com",
			"/foo/..//evil.com",
			"/foo/%2e%2e//evil.com",
			"/%2f%2fevil.com",
			"/%252f%252fevil.com",
			"/%5cevil.com",
			"/%09/evil.com",
			"/%0a/evil.com",
			"/dashboard%00",
		];

		for (const candidate of rejected) {
			expect(getSafeRedirectPath(candidate, FALLBACK), candidate).toBe(
				FALLBACK,
			);
		}
	});

	it("only returns paths that stay on the app origin", () => {
		const candidates = [
			null,
			"/dashboard",
			"/dashboard?tab=1#h",
			"//evil.com",
			"/\\evil.com",
			"https://evil.com",
			"/.//evil.com",
			"/foo/..//evil.com",
			"/%2f%2fevil.com",
			"/%0a/evil.com",
		];

		for (const candidate of candidates) {
			const path = getSafeRedirectPath(candidate, FALLBACK);
			expect(resolvedOrigin(path), `${candidate} -> ${path}`).toBe(ORIGIN);
			expect(path.startsWith("//")).toBe(false);
			expect(path.includes("\\")).toBe(false);
		}
	});
});
