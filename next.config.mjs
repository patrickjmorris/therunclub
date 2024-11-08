/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "abs.twimg.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "pbs.twimg.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "yt3.ggpht.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "i.ytimg.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "api.producthunt.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "d3t3ozftmdmh3i.cloudfront.net",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "i1.sndcdn.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "media.rss.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "feeds.podcastmirror.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "ssl-static.libsyn.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "static.libsyn.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "megaphone.imgix.net",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "storage.pinecast.net",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "storage.buzzsprout.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "pbcdn1.podbean.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "image.simplecastcdn.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "media.redcircle.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "assets.pippa.io",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "www.omnycontent.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "images.transistor.fm",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "images.squarespace-cdn.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "cloud259.com",
				port: "",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "deow9bq0xqvbj.cloudfront.net",
				port: "",
				pathname: "**",
			},
		],
	},
	experimental: {
		serverActions: {
			allowedOrigins: ["therunclub.xyz"],
			bodySizeLimit: "3mb",
		},
	},
};

export default nextConfig;
