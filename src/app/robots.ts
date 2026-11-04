import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: [
				"/api/",
				"/error",
				"/coming-soon",
				"/*?search=",
				"/*?sort=",
				"/*?filter=",
				"/*?utm_",
				"/*?ref=",
				"/*?source=",
				"/*?fbclid=",
			],
		},
		sitemap: absoluteUrl("/sitemap.xml"),
	};
}
