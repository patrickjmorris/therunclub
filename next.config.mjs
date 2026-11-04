const securityHeaders = [
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "X-Frame-Options", value: "SAMEORIGIN" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
	// Scripts, images and audio come from many hosts (podcast feeds, YouTube),
	// so the policy only locks down plugins, base/form targets and framing.
	{
		key: "Content-Security-Policy",
		value:
			"base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'self'",
	},
];

/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		// Not loader: "custom": that turns off /_next/image on Vercel.
		loaderFile: "./src/lib/image-loader.ts",
		remotePatterns: [
			{
				protocol: "https",
				hostname: "akzhyzwiwjxtjuirmqyx.supabase.co",
				pathname: "/storage/v1/object/public/content-images/podcasts/**",
			},
			{
				protocol: "https",
				hostname: "akzhyzwiwjxtjuirmqyx.supabase.co",
				pathname: "/storage/v1/object/public/athlete-images/**",
			},
		],
		// Supabase sends no-cache on these objects. Vercel bills a transformation
		// on every cache miss or stale read, so hold results for a month.
		minimumCacheTTL: 2678400,
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
	async rewrites() {
		return {
			beforeFiles: [{ source: "/sitemap.xml", destination: "/sitemap-index.xml" }],
		};
	},
	async headers() {
		return [{ source: "/:path*", headers: securityHeaders }];
	},
};

export default nextConfig;
