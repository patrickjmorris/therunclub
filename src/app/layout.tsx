import "@/styles/tailwind.css";

import { Metadata, Viewport } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
// import { Analytics } from "@/components/common/analytics";
import { ThemeProvider } from "@/components/common/theme-provider";
import { ServerAuthWrapper } from "@/components/auth/server-auth-provider";
import { TailwindIndicator } from "@/components/common/tailwind-indicator";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteHeader } from "@/components/common/site-header";
import { AudioPlayer } from "@/components/podcasts/player/AudioPlayer";
import { AudioProvider } from "@/components/podcasts/audio-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
	metadataBase: new URL(siteConfig.url),
	title: {
		default: siteConfig.name,
		template: `%s | ${siteConfig.name}`,
	},
	description: siteConfig.description,
	keywords: [
		"Running Podcast",
		"Running Tips",
		"Marathon Training",
		"Track and Field",
		"Fitness Podcast",
		"Runner Stories",
		"Athletic Training",
		"Running Community",
	],
	authors: [
		{
			name: "The Run Club",
			url: siteConfig.url,
		},
	],
	creator: "The Run Club",
	openGraph: {
		type: "website",
		locale: "en_US",
		url: siteConfig.url,
		title: siteConfig.name,
		description: siteConfig.description,
		siteName: siteConfig.name,
		images: [
			{
				url: siteConfig.ogImage,
				width: 1200,
				height: 630,
				alt: siteConfig.name,
				type: "image/jpeg",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: siteConfig.name,
		description: siteConfig.description,
		images: [siteConfig.ogImage],
		creator: "@therunclub",
	},
	icons: {
		icon: "/favicon.ico",
		shortcut: "/favicon-16x16.png",
		apple: "/apple-touch-icon.png",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "white" },
		{ media: "(prefers-color-scheme: dark)", color: "black" },
	],
	width: "device-width",
	initialScale: 1,
};

interface RootLayoutProps {
	children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
	return (
		<>
			<html lang="en" suppressHydrationWarning>
				<head />
				<body
					className={cn(
						"min-h-screen bg-background font-sans antialiased",
						fontSans.variable,
					)}
				>
					<ServerAuthWrapper>
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							enableSystem
							disableTransitionOnChange
						>
							<AudioProvider>
								<SiteHeader />
								<main className="relative flex flex-1 min-h-screen flex-col bg-background">
									<NuqsAdapter>{children}</NuqsAdapter>
								</main>
								<div className="fixed inset-x-0 bottom-0 z-50 lg:right-0 lg:left-auto lg:w-3/4">
									<AudioPlayer />
								</div>
								<Toaster />
								<TailwindIndicator />
								
								<SpeedInsights />
							</AudioProvider>
						</ThemeProvider>
					</ServerAuthWrapper>
				</body>
			</html>
		</>
	);
}
