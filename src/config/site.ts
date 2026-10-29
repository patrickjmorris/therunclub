const url = "https://www.therunclub.xyz";

export const siteConfig = {
	name: "The Run Club",
	url,
	ogImage: `${url}/opengraph-image`,
	description:
		"The Run Club is a podcast about running, fitness, and everything in between.",
	links: {
		twitter: "https://twitter.com/therunclub",
		github: "https://github.com/patrickjmorris/therunclub",
	},
	spotSports: {
		name: "Spot Sports",
		url: "https://www.spotsports.com",
		utmSource: "therunclub",
		utmMedium: "referral",
	},
};

export type SiteConfig = typeof siteConfig;

export function absoluteUrl(path: string) {
	return new URL(path, siteConfig.url).toString();
}
