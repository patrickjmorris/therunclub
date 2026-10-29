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
		loader: "custom",
		loaderFile: "./src/lib/image-loader.ts",
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
