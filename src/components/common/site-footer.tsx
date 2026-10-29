"use client";

import { SpotSportsLink } from "@/components/spot-sports/spot-sports-link";
import { siteConfig } from "@/config/site";
import { pageTypeFromPathname } from "@/lib/spot-sports";
import { usePathname } from "next/navigation";

export function SiteFooter() {
	const pageType = pageTypeFromPathname(usePathname());
	return (
		<footer className="border-t border-border/40 bg-background">
			<div className="container flex max-w-screen-2xl flex-col gap-2 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
				<p>© {siteConfig.name}</p>
				<p>
					Live scores, highlights, and sports podcasts beyond running.{" "}
					<SpotSportsLink
						placement="site_footer"
						pageType={pageType}
						className="font-medium text-foreground underline-offset-4 hover:underline"
					>
						Visit {siteConfig.spotSports.name} ↗
					</SpotSportsLink>
				</p>
			</div>
		</footer>
	);
}
