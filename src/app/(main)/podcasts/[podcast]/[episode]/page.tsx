import { cache } from 'react'
import { notFound } from 'next/navigation'

import { Container } from '@/components/Container'
import { EpisodePlayButton } from '@/components/EpisodePlayButton'
import { FormattedDate } from '@/components/FormattedDate'
import { PauseIcon } from '@/components/PauseIcon'
import { PlayIcon } from '@/components/PlayIcon'
import { FEEDS, getEpisodeTitles, getEpisode } from '@/lib/episodes'
import { slugify } from '@/lib/utils'
// Generate segments for [podcast] using the `params` passed from
// the parent segment's `generateStaticParams` function
export async function generateStaticParams({
  params: { podcast },
}: {
  params: { podcast: string }
}) {
  // get all episodes for the podcast using getEpisodeTitles
  // We need to pass the podcast url to getEpisodeTitles so that it can get the metadata for the podcast
  // This is because getEpisodeTitles uses the podcast url to get the metadata for the podcast  
  const feed = FEEDS.find((feed) => feed.slug === podcast)
  if (!feed) {
    return []
  }
  const episodes = await getEpisodeTitles(feed.url)
  return episodes.map((episode) => ({
    episode: slugify(episode),
  }))
}

export default async function Episode({
  params,
}: {
  params: { podcast: string, episode: string }
}) 

{
  // console.log('Episode Params', params)
  let feed = FEEDS.find((feed) => feed.slug === params.podcast)
  if (!feed) {
    // Handle the case where feed is undefined
    // Not sure if this is the best way to handle this
      notFound()
  }
  let episode = await getEpisode(feed.url, params.episode)
  // let episode = await getEpisode("https://media.rss.com/coffeeclub/feed.xml", "first-place-losers")
  // let fullthing = await getFullFeed(feed.url)
  // console.log('Episode', episode)
  // console.log('Full Feed', fullthing.items[0])
  if (!episode) {
    // Handle the case where episode is undefined
    // Not sure if this is the best way to handle this
      notFound()
  }
  let date = new Date(episode.pubDate)
  
  return (
    <article className="py-16 lg:py-36">
      <Container>
        <header className="flex flex-col">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/2">
            <img
              className="w-full sm:rounded-xl lg:rounded-2xl"
              src={episode.itunes.image}
              alt={episode.title}
              width={500}
              height={500}
              sizes="(min-width: 1024px) 20rem, (min-width: 640px) 16rem, 12rem"
            
            />
          </div>
          <div className="lg:w-1/2">
            <h1 className="mt-2 text-4xl font-bold text-slate-900">
              {episode.title}
            </h1>
            <FormattedDate
              date={date}
              className="order-first font-mono text-sm leading-7 text-slate-500"
            />
          </div>
        </div>
          <EpisodePlayButton
              episode={episode}
              className="relative flex items-center justify-center flex-shrink-0 mt-4 rounded-full group h-18 w-18 bg-slate-700 hover:bg-slate-900 focus:outline-none focus:ring focus:ring-slate-700 focus:ring-offset-4"
              playing={
                <PauseIcon className="h-9 w-9 fill-white group-active:fill-white/80" />
              }
              paused={
                <PlayIcon className="h-9 w-9 fill-white group-active:fill-white/80" />
              }
            />
        </header>
        <hr className="my-12 border-gray-200" />
        <div
          className="prose prose-slate mt-14 [&>h2:nth-of-type(3n)]:before:bg-violet-200 [&>h2:nth-of-type(3n+2)]:before:bg-indigo-200 [&>h2]:mt-12 [&>h2]:flex [&>h2]:items-center [&>h2]:font-mono [&>h2]:text-sm [&>h2]:font-medium [&>h2]:leading-7 [&>h2]:text-slate-900 [&>h2]:before:mr-3 [&>h2]:before:h-3 [&>h2]:before:w-1.5 [&>h2]:before:rounded-r-full [&>h2]:before:bg-cyan-200 [&>ul]:mt-6 [&>ul]:list-['\2013\20'] [&>ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: episode.description }}
        />
      </Container>
    </article>
  )
}
