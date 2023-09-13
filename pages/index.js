import Link from 'next/link';
import {getHomeFeedEpisodes} from "@/lib/podcast"
import { orderBy } from "lodash";
import {slugify} from "@/lib/util";
import Layout from "@/components/content/Layout";
import Footer from '@/components/content/Footer';
import {  formatDistance } from 'date-fns';

export default function HomePage({ sortedPodcastFeed}) {
  const meta = {
    title: "The Run Club",
    description:
  "Building and supporting the running community",
    logo: "/logo.png",
  }

  return (
    <Layout meta={meta}>
          <main>
            {/* Podcast section */}
            <div className="relative py-16 bg-gray-50 sm:py-24 lg:py-32">
              <div className="relative">
                <div className="max-w-md px-4 mx-auto text-center sm:max-w-3xl sm:px-6 lg:px-8 lg:max-w-7xl">
                  <h2 className="text-base font-semibold tracking-wider uppercase text-cyan-600">Podcasts</h2>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                    Find your favorite running podcasts
                  </p>
                  <p className="mx-auto mt-5 text-xl text-gray-500 max-w-prose">
                    For some people, running is a great way to socialize and talk about whatever is on one's mind. A lot of times those chats are abaout running! For the moments when you're not running or when you're out solo, find your next podast on The Run Club.
                  </p>
                </div>
                <div className="grid max-w-md gap-8 px-4 mx-auto mt-12 sm:max-w-lg sm:px-6 lg:px-8 md:grid-cols-2 lg:grid-cols-3 lg:max-w-7xl">
                  {sortedPodcastFeed.map((podcast) => (
                    <div key={podcast.pod.podcastTitle} className="flex flex-col overflow-hidden rounded-lg shadow-lg">
                      <div className="flex-shrink-0">
                      <Link href={`/podcasts/${slugify(podcast.pod.podcastTitle)}/${slugify(podcast.pod.lastEpisodeTitle)}`}>
                        <a>
                        <img className="object-cover w-full h-full" src={podcast.pod.lastEpisodeImage ?? podcast.pod.podcastImage} alt={podcast.pod.lastEpisodeTitle} />
                        </a>
                        </Link>
                      </div>
                      <div className="flex flex-col justify-between flex-1 p-6 bg-white">
                        <div className="flex-1">
                          <Link href={`/podcasts/${slugify(podcast.pod.podcastTitle)}/${slugify(podcast.pod.lastEpisodeTitle)}`}>
                            <a className="block mt-2">
                              <p className="text-xl font-semibold text-gray-900">{podcast.pod.lastEpisodeTitle}</p>
                            </a>
                          </Link>
                        </div>
                        <div className="flex items-center mt-6">
                          <div className="flex-shrink-0">
                            <Link href={`/podcasts/${slugify(podcast.pod.podcastTitle)}`}>
                              <a>
                                <img className="w-10 h-10 rounded-full" src={podcast.pod.podcastImage} alt={podcast.pod.podcastTitle} />
                              </a>
                            </Link>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              <Link href={`/podcasts/${slugify(podcast.pod.podcastTitle)}`}>
                                <a className="hover:underline">
                                  {podcast.pod.podcastTitle}
                                </a>
                              </Link>
                            </p>
                            <div className="flex space-x-1 text-sm text-gray-500">
                              <span>Published</span>
                              <time dateTime={podcast.pod.pubDate}>{formatDistance(new Date(podcast.pod.pubDateString), new Date())}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pb-16 bg-gradient-to-r from-teal-500 to-cyan-600 lg:pb-0 lg:z-10 lg:relative">
              <div className="pb-16"></div>
            </div>
          </main>
          <Footer />
    </Layout>
  )
}



export async function getStaticProps() {
    const podcastHomeFeed = await getHomeFeedEpisodes()
    console.log(podcastHomeFeed)
    const lastPodcastEpisodes = podcastHomeFeed.map(podcast => {
      const pod = {
        podcastImage: podcast.fullThing.itunes.image,
        podcastTitle: podcast.fullThing.podcastTitle,
        lastEpisodeImage: podcast.fullThing.lastEpisode.itunes.image || null,
        lastEpisodeTitle: podcast.fullThing.lastEpisode.title,
        pubDate: JSON.stringify(new Date(podcast.fullThing.lastEpisode.pubDate)),
        pubDateString: podcast.fullThing.lastEpisode.pubDate
      }
      return { pod };
    })
    const sortedPodcastFeed = orderBy(lastPodcastEpisodes, "pod.pubDate", "desc").slice(0,6)
    
    return {
      props: {
        sortedPodcastFeed
      },
      revalidate: 60 * 60
    };
  };