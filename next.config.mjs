const securityHeaders = [
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "X-Frame-Options", value: "SAMEORIGIN" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
