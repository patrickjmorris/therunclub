const securityHeaders = [
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "X-Frame-Options", value: "SAMEORIGIN" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

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
	reactCompiler: true,
	experimental: {
		serverActions: {
			allowedOrigins: ["therunclub.xyz"],
			bodySizeLimit: "3mb",
		},
		// ppr: "incremental",
	},
	serverExternalPackages: ["whatwg-url"],
	async headers() {
		return [{ source: "/:path*", headers: securityHeaders }];
	},
};

export default nextConfig;
