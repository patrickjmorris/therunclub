import { Metadata } from 'next';
import { Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { AudioProvider } from '@/components/AudioProvider'
import { AudioPlayer } from '@/components/player/AudioPlayer'
 
export const metadata: Metadata = {
  title: 'Next.js',
}

export default async function PodcastLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <AudioProvider>
      <main className="border-t border-slate-200">

        <div className="relative">{children}</div>
      </main>
      
      <div className="fixed inset-x-0 bottom-0 z-10 ">
        <AudioPlayer />
      </div>
    </AudioProvider>
  )
}