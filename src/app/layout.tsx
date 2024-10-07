import "@/styles/tailwind.css";
import { AudioProvider } from "@/components/AudioProvider";
import { AudioPlayer } from "@/components/player/AudioPlayer";

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en" className="h-full antialiased bg-white">
//       <head>
//         <link
//           rel="preconnect"
//           href="https://cdn.fontshare.com"
//           crossOrigin="anonymous"
//         />
//         <link
//           rel="stylesheet"
//           href="https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap"
//         />
//       </head>
//       <body className="flex min-h-full">
//       <AudioProvider>
//         <Navigation />
//         <div className="w-full md:pt-16">{children}</div>
//         <div className="fixed inset-x-0 bottom-0 z-10 lg:left-112 xl:left-120">
//         <AudioPlayer />
//       </div>
//       </AudioProvider>
//       <Analytics />
//       </body>
//     </html>
//   )
// }
import { Metadata, Viewport } from "next";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { Analytics } from "@/components/analytics";
import { ThemeProvider } from "@/components/providers";
import { TailwindIndicator } from "@/components/tailwind-indicator";

export const metadata: Metadata = {
	title: {
		default: siteConfig.name,
		template: `%s - ${siteConfig.name}`,
	},
	metadataBase: new URL(siteConfig.url),
	description: siteConfig.description,
	keywords: ["Running", "Track", "Athletics", "Marathon", "Fitness"],
	authors: [
		{
			name: "The Run Club",
			url: "https://therunclub.xyz",
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
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "white" },
		{ media: "(prefers-color-scheme: dark)", color: "black" },
	],
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
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<AudioProvider>
							<div vaul-drawer-wrapper="">
								<div className="relative flex min-h-screen flex-col bg-background">
									{children}
								</div>
								<AudioPlayer />
							</div>
							<TailwindIndicator />

							<Analytics />
						</AudioProvider>
					</ThemeProvider>
				</body>
			</html>
		</>
	);
}
