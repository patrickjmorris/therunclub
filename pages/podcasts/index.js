import Image from "next/image";
import Link from "next/link";
import { FEEDS, getHomeFeedEpisodes } from "../../lib/podcast";
import Layout from "@/components/content/Layout";
import { orderBy } from "lodash";
import {slugify} from "@/lib/util";
import {  formatDistance } from 'date-fns';
import linkifyHtml from 'linkify-html';

export default function PodcastsIndex({sortedPodcastFeed}) {
  const meta = {
    title: "The Run Club",
    description:
  "Building and supporting the running community",
    logo: "/logo.png",
  }

  const options = {
    rel: 'noopener',
    target: 'blank'
  }

  return (
    <Layout meta={meta}>
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
                <div className="grid max-w-md gap-8 px-4 mx-auto mt-12 sm:max-w-lg sm:px-6 lg:px-8 lg:grid-cols-4 lg:max-w-7xl">
                  {sortedPodcastFeed.map((podcast) => (
                    <div key={podcast.pod.podcastTitle} className="flex flex-col rounded-lg shadow-lg">
                      <div className="flex-shrink-0">
                      <Link href={`/podcasts/${slugify(podcast.pod.podcastTitle)}`} legacyBehavior>

                        <img className="object-cover w-full h-full" src={podcast.pod.podcastImage} alt={podcast.pod.podcastTitle} />

                      </Link>
                      </div>
                      <div className="flex flex-col justify-between flex-1 p-6 bg-white">
                        <div className="flex-1">
                          <Link
                            href={`/podcasts/${slugify(podcast.pod.podcastTitle)}`}
                            className="block mt-2"
                            legacyBehavior>

                            <p className="text-xl font-semibold text-gray-900">{podcast.pod.podcastTitle}</p>

                          </Link>
                        </div>
                        <p>{podcast.pod.podcastAuthor}</p>
                        <div className="flex items-end space-x-1 text-sm text-gray-500">
                            <span>Last Published</span>
                            <time dateTime={podcast.pod.pubDate}>{formatDistance(new Date(podcast.pod.pubDateString), new Date())}</time>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>  
      </Layout>
  );
}

export async function getStaticProps() {
    const podcastHomeFeed = await getHomeFeedEpisodes()
    // console.log(podcastHomeFeed)
    const lastPodcastEpisodes = podcastHomeFeed.map(podcast => {
      const pod = {
        podcastAuthor: podcast.fullThing.itunes.author || null,
        podcastImage: podcast.fullThing.itunes.image,
        podcastTitle: podcast.fullThing.podcastTitle,
        podcastSummary: podcast.fullThing.itunes.summary || null,
        pubDate: JSON.stringify(new Date(podcast.fullThing.lastEpisode.pubDate)),
        pubDateString: podcast.fullThing.lastEpisode.pubDate,
      }
      return { pod };
    })
    const sortedPodcastFeed = orderBy(lastPodcastEpisodes, "pod.pubDate", "desc")
    // console.log(JSON.stringify(sortedPodcastFeed, 0,2))
    return {
      props: {
        sortedPodcastFeed
      },
      revalidate: 60 * 60
    };
  };