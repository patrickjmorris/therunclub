import { Container } from '@/components/Container'
import { FEEDS, getLastTenEpisodes, getPodcastMetadata } from '@/lib/episodes'
import EpisodeEntry from '@/components/podcasts/EpisodeEntry'
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  
  return FEEDS.map((feed) => ({
    podcast: feed.slug
  }));
}

export default async function Podcast({params}: any) {

  
  // console.log(podcast)
  // let episodes = await parsePodcastFeed('https://anchor.fm/s/9085ecc/podcast/rss')
  // episodes.items = episodes.items.slice(0, 10)
  let feed = FEEDS.find((feed) => feed.slug === params.podcast)
  if (!feed) {
    // Handle the case where feed is undefined
    // Not sure if this is the best way to handle this
      notFound()
  }
  let episodes = await getLastTenEpisodes(feed.url)
  let metadata = await getPodcastMetadata(feed.url)

  return (
    <div className="pt-16 pb-12 sm:pb-4 lg:pt-12">
      <Container>
        <h1 className="text-2xl font-bold leading-7 text-slate-900">
          {metadata.title}
        </h1>
      </Container>
      <div className="divide-y divide-slate-100 sm:mt-4 lg:mt-8 lg:border-t lg:border-slate-100">
        {episodes.map((episode) => (
          <EpisodeEntry key={episode.title} episode={episode} params={params} />
        ))}
      </div>
    </div>
  )
}

export const revalidate = 10
