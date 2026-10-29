export const siteConfig = {
	name: "The Run Club",
	url: "https://www.therunclub.xyz",
	ogImage: "https://therunclub.xyz/og.jpg",
	description:
		"The Run Club is a podcast about running, fitness, and everything in between.",
	links: {
		twitter: "https://twitter.com/therunclub",
		github: "https://github.com/patrickjmorris/therunclub",
	},
};

export type SiteConfig = typeof siteConfig;

export function absoluteUrl(path: string) {
	return new URL(path, siteConfig.url).toString();
}
