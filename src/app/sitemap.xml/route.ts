import { absoluteUrl } from "@/config/site";
import { generateSitemaps } from "../sitemap";

// Next generates /sitemap/<id>.xml for each id but no index, so this route
// serves the index that robots.txt points at.
export const revalidate = 86400;

export async function GET() {
	const sitemaps = await generateSitemaps();
	const entries = sitemaps
		.map(
			({ id }) =>
				`<sitemap><loc>${absoluteUrl(`/sitemap/${id}.xml`)}</loc></sitemap>`,
		)
		.join("");
	const xml = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
	return new Response(xml, {
		headers: { "Content-Type": "application/xml" },
	});
}
