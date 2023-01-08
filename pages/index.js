import Link from 'next/link';
import { ChevronRightIcon, ExternalLinkIcon } from '@heroicons/react/solid'
import { getChannelInfo, getPlaylistItems, CHANNELS } from "lib/youtube";
import {getHomeFeedEpisodes} from "@/lib/podcast"
import { orderBy } from "lodash";
import {slugify} from "@/lib/util";
import Layout from "@/components/content/Layout";
import Footer from '@/components/content/Footer';
import {  formatDistance } from 'date-fns';

export default function HomePage({sortedHomeData, sortedPodcastFeed}) {
  const meta = {
    title: "The Run Club",
    description:
  "Building and supporting the running community",
    logo: "/logo.png",
  }

  return (
    <Layout meta={meta}>
          <main>
            <div className="pt-10 bg-gray-900 sm:pt-16 lg:pt-8 lg:pb-14 lg:overflow-hidden">
              <div className="mx-auto max-w-7xl lg:px-8">
                <div className="lg:grid lg:grid-cols-2 lg:gap-8">
                  <div className="max-w-md px-4 mx-auto sm:max-w-2xl sm:px-6 sm:text-center lg:px-0 lg:text-left lg:flex lg:items-center">
                    <div className="lg:py-24">
                      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:mt-5 sm:text-6xl lg:mt-6 xl:text-6xl">
                        <span className="block">A better way for</span>
                        <span className="block pb-3 text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-cyan-400 sm:pb-5">
                          runners to connect
                        </span>
                      </h1>
                      <p className="text-base text-gray-300 sm:text-xl lg:text-lg xl:text-xl">
                        Find, listen and watch to the best running content all in one spot. Jump into the chat to talk about the latest gear, training questions, and race results.
                      </p>
                      <div className="mt-10 sm:mt-12">
                        <form action="#" className="sm:max-w-xl sm:mx-auto lg:mx-0">
                          <div className="sm:flex">
                            <div className="flex-1 min-w-0">
                              <label htmlFor="email" className="sr-only">
                                Email address
                              </label>
                              <input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                className="block w-full px-4 py-3 text-base text-gray-900 placeholder-gray-500 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 focus:ring-offset-gray-900"
                              />
                            </div>
                            <div className="mt-3 sm:mt-0 sm:ml-3">
                              <button
                                type="submit"
                                className="block w-full px-4 py-3 font-medium text-white rounded-md shadow bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 focus:ring-offset-gray-900"
                              >
                                Start free trial
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                  <div className="mt-12 -mb-16 sm:-mb-48 lg:m-0 lg:relative">
                    <div className="max-w-md px-4 mx-auto sm:max-w-2xl sm:px-6 lg:max-w-none lg:px-0">
                      <img
                        className="w-full rounded-lg lg:absolute lg:inset-y-0 lg:left-0 lg:h-full lg:w-auto lg:max-w-none"
                        src="https://cdn.dribbble.com/users/29836/screenshots/4532142/media/4bb496e2fe6d15a2c391fd6e7f32859f.jpg"
                        alt=""
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
                            <Link href={`/podcasts/slugify(${podcast.pod.podcastTitle})`}>
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

            {/* Video section */}
            <div className="relative py-16 bg-gray-50 sm:py-24 lg:py-32">
              <div className="relative">
                <div className="max-w-md px-4 mx-auto text-center sm:max-w-3xl sm:px-6 lg:px-8 lg:max-w-7xl">
                  <h2 className="text-base font-semibold tracking-wider uppercase text-cyan-600">Videos</h2>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                    The Best of Running Youtube
                  </p>
                  <p className="mx-auto mt-5 text-xl text-gray-500 max-w-prose">
                    Catch the latest race highlights and newest shoe and gear releases. 
                  </p>
                </div>
                <div className="grid max-w-md gap-8 px-4 mx-auto mt-12 sm:max-w-lg sm:px-6 lg:px-8 lg:grid-cols-3 lg:max-w-7xl">
                  {sortedHomeData.map((video) => (
                    <div key={video.channelSummary.title} className="flex flex-col overflow-hidden rounded-lg shadow-lg">
                      <div className="flex-shrink-0">
                        <img className="object-cover w-full h-full" src={video.channelSummary.videos.snippet.thumbnails.medium.url} alt="" />
                      </div>
                      <div className="flex flex-col justify-between flex-1 p-6 bg-white">
                        <div className="flex-1">
                          <Link href={`/videos/${video.channelSummary.videos.snippet.videoOwnerChannelId}/${video.channelSummary.videos.snippet.resourceId.videoId}`}>
                            <a className="block mt-2">
                              <p className="text-xl font-semibold text-gray-900">{video.channelSummary.videos.snippet.title}</p>
                            </a>
                          </Link>
                        </div>
                        <div className="flex items-center mt-6">
                          <div className="flex-shrink-0">
                            <Link href={`/videos/${video.channelSummary.videos.snippet.videoOwnerChannelId}`}>
                              <a>
                                <img className="w-10 h-10 rounded-full" src={video.channelSummary.thumbnail} alt={video.channelSummary.title} />
                              </a>
                            </Link>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              <Link href={`/videos/${video.channelSummary.videos.snippet.videoOwnerChannelId}`}>
                                <a className="hover:underline">
                                  {video.channelSummary.title}
                                </a>
                              </Link>
                            </p>
                            <div className="flex space-x-1 text-sm text-gray-500">
                              <span>Published</span>
                              <time dateTime={video.channelSummary.videos.snippet.publishedAt}>{formatDistance(new Date(video.channelSummary.videos.snippet.publishedAt), new Date())}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="relative bg-gray-900">
              <div className="relative h-56 bg-indigo-600 sm:h-72 md:absolute md:left-0 md:h-full md:w-1/2">
                <img
                  className="object-cover w-full h-full"
                  src="https://images.unsplash.com/photo-1509486432407-f8fb9cc99acd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=798&q=80"
                  alt="Track"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-red-500 to-blue-600 mix-blend-multiply"
                />
              </div>
              <div className="relative max-w-md px-4 py-12 mx-auto sm:max-w-7xl sm:px-6 sm:py-20 md:py-28 lg:px-8 lg:py-32">
                <div className="md:ml-auto md:w-1/2 md:pl-10">
                  <h2 className="text-base font-semibold tracking-wider text-gray-300 uppercase">
                    Chat with runners
                  </h2>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">The Voice of Runners</p>
                  <p className="mt-3 text-lg text-gray-300">
                    We provide a moderated, and civilized space to talk all things running and athletics. Join topics that are relevant to your interests and geographic region.
                  </p>
                  <div className="mt-8">
                    <div className="inline-flex rounded-md shadow">
                      <a
                        href="#"
                        className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-gray-900 bg-white border border-transparent rounded-md hover:bg-gray-50"
                      >
                        Join our Discord
                        <ExternalLinkIcon className="w-5 h-5 ml-3 -mr-1 text-gray-400" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
          <Footer />
    </Layout>
  )
}



export async function getStaticProps() {
  const channelInfos = await Promise.all(
    CHANNELS.map((channelId) => getChannelInfo(channelId)
    ));
    
  const channelPlaylists = 
    channelInfos.map( async (channel) => {
      const videos = await getPlaylistItems(channel.items[0].contentDetails.relatedPlaylists.uploads)
      const channelSummary = {};
      channelSummary.title = channel.items[0].snippet.title;
      channelSummary.thumbnail = channel.items[0].snippet.thumbnails.medium.url;
      channelSummary.playlistId = channel.items[0].contentDetails.relatedPlaylists.uploads
      channelSummary.videos = videos[0];
      return {
         channelSummary
        }
    }
    );

    const homeData = await Promise.all(channelPlaylists)
    const sortedHomeData = orderBy(homeData, "channelSummary.videos.snippet.publishedAt", "desc").slice(0,6)

    const podcastHomeFeed = await getHomeFeedEpisodes()
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
        sortedHomeData,
        sortedPodcastFeed
      },
      revalidate: 60 * 60
    };
  };