import '@/styles/tailwind.css'
import { AudioProvider } from '@/components/AudioProvider'
import { AudioPlayer } from '@/components/player/AudioPlayer'
import { TinyWaveFormIcon } from '@/components/TinyWaveFormIcon'
import { Waveform } from '@/components/Waveform'
import Navigation from '@/components/ui/nav'
import { Analytics } from "@vercel/analytics/react"

export const metadata = {
  title: {
    template: '%s - The Run Club',
    default:
      'The Run Club - Where Runners Run',
  },
  description:
    'The Run Club gathers runners from all over the world to share their stories, experiences, and tips for running.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased bg-white">
      <head>
        <link
          rel="preconnect"
          href="https://cdn.fontshare.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap"
        />
      </head>
      <body className="flex min-h-full">
      <AudioProvider>
        <Navigation />
        <div className="w-full md:pt-16">{children}</div>
        <div className="fixed inset-x-0 bottom-0 z-10 lg:left-112 xl:left-120">
        <AudioPlayer />
      </div>
      </AudioProvider>
      <Analytics />
      </body>
    </html>
  )
}
