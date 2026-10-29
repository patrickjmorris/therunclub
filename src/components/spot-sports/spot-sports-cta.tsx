import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import {
	type ContextualSpotSportsPlacement,
	spotSportsPlacements,
} from "@/lib/spot-sports";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { SpotSportsLink } from "./spot-sports-link";

interface SpotSportsCtaProps {
	placement: ContextualSpotSportsPlacement;
	className?: string;
}

export function SpotSportsCta({ placement, className }: SpotSportsCtaProps) {
	const { pageType, heading, body, cta } = spotSportsPlacements[placement];
	return (
		<aside
			aria-label={siteConfig.spotSports.name}
			className={cn(
				"flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground sm:flex-row sm:items-center sm:justify-between",
				className,
			)}
		>
			<div className="space-y-1">
				<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					{siteConfig.spotSports.name}
				</p>
				<p className="font-semibold">{heading}</p>
				<p className="text-sm text-muted-foreground">{body}</p>
			</div>
			<SpotSportsLink
				placement={placement}
				pageType={pageType}
				className={cn(
					buttonVariants({ variant: "outline", size: "sm" }),
					"shrink-0",
				)}
			>
				{cta}
				<ArrowUpRight className="h-4 w-4" />
			</SpotSportsLink>
		</aside>
	);
}
