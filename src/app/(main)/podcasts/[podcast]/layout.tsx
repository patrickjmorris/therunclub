import { Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { AboutSection } from '@/components/AboutSection'
import { AudioProvider } from '@/components/AudioProvider'
import { AudioPlayer } from '@/components/player/AudioPlayer'
import { getPodcastMetadata, FEEDS } from '@/lib/episodes'
import { slugify } from '@/lib/utils'



function PersonIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 11 12" {...props}>
      <path d="M5.019 5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm3.29 7c1.175 0 2.12-1.046 1.567-2.083A5.5 5.5 0 0 0 5.019 7 5.5 5.5 0 0 0 .162 9.917C-.39 10.954.554 12 1.73 12h6.578Z" />
    </svg>
  )
}

export default async function PodcastLayout({
  children,
  params,
}: {
  children: React.ReactNode,
  params: {
    podcast: string
  }
}) {
  let feed = FEEDS.find((feed) => feed.slug === params.podcast)
  if (feed) {
    let data = await getPodcastMetadata(feed.url)
    return (
      <AudioProvider>
        <div className="min-h-screen flex flex-col lg:flex-row">
          <header className="bg-slate-50 w-full lg:w-112 xl:w-120 lg:fixed lg:inset-y-0 lg:left-0 lg:flex">
            <div className="hidden lg:sticky lg:top-0 lg:flex lg:w-16 lg:flex-none lg:items-center lg:whitespace-nowrap lg:py-12 lg:text-sm lg:leading-7 lg:[writing-mode:vertical-rl]">
              <span className="font-mono text-slate-500">Hosted by</span>
              <span className="flex gap-6 mt-6 font-bold text-slate-900">
                {data.author}
              </span>
            </div>
            <div className="relative z-10 px-4 pt-10 pb-4 mx-auto sm:px-6 md:max-w-2xl md:px-4 lg:min-h-0 lg:flex-auto lg:border-x lg:border-slate-200 lg:px-8 lg:py-12 xl:px-12">
              <Link
                href={`/podcasts/${slugify(data.title)}`}
                className="relative block w-48 mx-auto overflow-hidden rounded-lg shadow-xl bg-slate-200 shadow-slate-200 sm:w-64 sm:rounded-xl lg:w-auto lg:rounded-2xl"
                aria-label="Homepage"
              >
                <img
                  className="w-full"
                  src={data.image}
                  alt=""
                  width={400}
                  height={4000}
                  sizes="(min-width: 1024px) 20rem, (min-width: 640px) 16rem, 12rem"
                />
                <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10 sm:rounded-xl lg:rounded-2xl" />
              </Link>
              <div className="mt-10 text-center lg:mt-12 lg:text-left">
                <p className="text-xl font-bold text-slate-900">
                  <Link href={`/podcasts/${slugify(data.title)}`}>{data.title}</Link>
                </p>
                <p className="mt-3 text-lg font-medium leading-8 text-slate-700"
                dangerouslySetInnerHTML={{
                      __html: data.description,
                    }}>
                </p>
              </div>
            </div>
          </header>
          <main className="flex-grow lg:ml-112 xl:ml-120">
            <div className="relative pt-20 lg:pt-0">
              <div className="relative px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
          <footer className="mt-auto border-t border-slate-200 bg-slate-50 py-10 pb-40 sm:py-16 sm:pb-32 lg:hidden">
            <div className="px-4 mx-auto sm:px-6 md:max-w-2xl md:px-4">
              <h2 className="flex items-center mt-8 font-mono text-sm font-medium leading-7 text-slate-900">
                <PersonIcon className="w-auto h-3 fill-slate-300" />
                <span className="ml-2.5">Hosted by</span>
              </h2>
              <div className="flex gap-6 mt-2 text-sm font-bold leading-7 text-slate-900">
                {data.author}
              </div>
            </div>
          </footer>
          <div className="fixed inset-x-0 bottom-0 z-10 lg:left-112 xl:left-120">
            <AudioPlayer />
          </div>
        </div>
      </AudioProvider>
    )
  }
}
