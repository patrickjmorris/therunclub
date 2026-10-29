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
	experimental: {
		serverActions: {
			allowedOrigins: ["therunclub.xyz"],
			bodySizeLimit: "3mb",
		},
		reactCompiler: true,
		// ppr: "incremental",
	},
	serverExternalPackages: ["whatwg-url"],
	async headers() {
		return [{ source: "/:path*", headers: securityHeaders }];
	},
};

export default nextConfig;
