"use client";

import {
	type SpotSportsPageType,
	type SpotSportsPlacement,
	spotSportsUrl,
} from "@/lib/spot-sports";
import { track } from "@vercel/analytics";

interface SpotSportsLinkProps {
	placement: SpotSportsPlacement;
	pageType: SpotSportsPageType;
	className?: string;
	children: React.ReactNode;
}

export function SpotSportsLink({
	placement,
	pageType,
	className,
	children,
}: SpotSportsLinkProps) {
	return (
		// biome-ignore lint/a11y/useValidAnchor: real outbound link; onClick only records the click
		<a
			href={spotSportsUrl(placement, pageType)}
			target="_blank"
			rel="noopener noreferrer"
			data-spot-sports-placement={placement}
			className={className}
			onClick={() => track("Spot Sports Click", { placement, pageType })}
		>
			{children}
			<span className="sr-only"> (opens in new tab)</span>
		</a>
	);
}
