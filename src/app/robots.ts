import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: [
				"/api/",
				"/dashboard",
				"/login",
				"/profile",
				"/verify-email",
				"/error",
				"/coming-soon",
				"/clubs/add",
				"/athletes/*/edit",
				"/auth/",
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
