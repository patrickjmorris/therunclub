/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		// remotePatterns: [
		// 	{
		// 		protocol: "https",
		// 		hostname: "res.cloudinary.com",
		// 		port: "",
		// 		pathname: "**",
		// 	},
		// 	{
		// 		protocol: "https",
		// 		hostname: "abs.twimg.com",
		// 		port: "",
		// 		pathname: "**",
		// 	},

		// 	{
		// 		protocol: "https",
		// 		hostname: "i.ytimg.com",
		// 		port: "",
		// 		pathname: "**",
		// 	},
		// 	{
		// 		protocol: "https",
		// 		hostname: "yt3.ggpht.com",
		// 		port: "",
		// 		pathname: "**",
		// 	},
		// 	{
		// 		protocol: "https",
		// 		hostname: "akzhyzwiwjxtjuirmqyx.supabase.co",
		// 		port: "",
		// 		pathname: "/storage/v1/object/public/*/**",
		// 	},
		// 	{
		// 		protocol: "https",
		// 		hostname: "is1-ssl.mzstatic.com",
		// 		port: "",
		// 		pathname: "**",
		// 	},
		// ],
		unoptimized: true,
	},
	experimental: {
		serverActions: {
			allowedOrigins: ["therunclub.xyz"],
			bodySizeLimit: "3mb",
		},
		reactCompiler: true,
		// ppr: "incremental",
	},
	serverExternalPackages: ["whatwg-url"],
};

export default nextConfig;
