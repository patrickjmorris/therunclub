import { SiteHeader } from "@/components/site-header";
import { AudioProvider } from "@/components/AudioProvider";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { SpeedInsights } from "@vercel/speed-insights/next";
interface AppLayoutProps {
	children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
	return (
		<AudioProvider>
			<SiteHeader />
			<main className="flex-1">{children}</main>
			<div className="fixed inset-x-0 bottom-0 z-10 lg:right-0 lg:left-auto lg:w-3/4">
				<AudioPlayer />
			</div>
			<SpeedInsights />
		</AudioProvider>
	);
}
