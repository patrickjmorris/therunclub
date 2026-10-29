import { siteConfig } from "@/config/site";

export type SpotSportsPageType =
	| "home"
	| "athlete"
	| "race"
	| "podcast"
	| "video"
	| "club"
	| "other";

const PAGE_TYPE_BY_SEGMENT: Record<string, SpotSportsPageType> = {
	"": "home",
	athletes: "athlete",
	races: "race",
	podcasts: "podcast",
	videos: "video",
	clubs: "club",
};

export function pageTypeFromPathname(pathname: string): SpotSportsPageType {
	return PAGE_TYPE_BY_SEGMENT[pathname.split("/")[1] ?? ""] ?? "other";
}

export const spotSportsPlacements = {
	site_footer: { path: "/" },
	athlete_detail: {
		path: "/",
		pageType: "athlete",
		heading: "Follow your other teams",
		body: "Live scores, instant highlights, and sports podcasts in one place.",
		cta: "Explore Spot Sports",
	},
	race_detail: {
		path: "/scores",
		pageType: "race",
		heading: "Off the course",
		body: "Catch live scores and instant highlights from across sports.",
		cta: "See live scores",
	},
	episode_detail: {
		path: "/podcasts",
		pageType: "podcast",
		heading: "More sports podcasts",
		body: "Sports podcasts and creator takes tailored to what you watch.",
		cta: "Listen on Spot Sports",
	},
	video_detail: {
		path: "/videos",
		pageType: "video",
		heading: "More highlights",
		body: "Instant highlights and creator takes from across sports.",
		cta: "Watch on Spot Sports",
	},
} as const;

export type SpotSportsPlacement = keyof typeof spotSportsPlacements;

export type ContextualSpotSportsPlacement = Exclude<
	SpotSportsPlacement,
	"site_footer"
>;

export function spotSportsUrl(
	placement: SpotSportsPlacement,
	pageType: SpotSportsPageType,
): string {
	const { url, utmSource, utmMedium } = siteConfig.spotSports;
	const href = new URL(spotSportsPlacements[placement].path, url);
	href.searchParams.set("utm_source", utmSource);
	href.searchParams.set("utm_medium", utmMedium);
	href.searchParams.set("utm_campaign", placement);
	href.searchParams.set("utm_content", pageType);
	return href.toString();
}
