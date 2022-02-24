import { Fragment } from 'react'
import { Popover, Transition } from '@headlessui/react'
import {
  MenuIcon,
  XIcon,
} from '@heroicons/react/outline'
import { ChevronRightIcon, ExternalLinkIcon } from '@heroicons/react/solid'
import { getChannelInfo, getPlaylistItems, CHANNELS } from "lib/youtube";
import {getHomeFeedEpisodes} from "@/lib/podcast"
import { orderBy } from "lodash";
import {slugify} from "@/lib/util"

const navigation = [
  { name: 'Podcasts', href: '/podcasts' },
  { name: 'Videos', href: '/videos' },
  { name: 'About', href: '/about' },
]

const footerNavigation = {
  solutions: [
    { name: 'Marketing', href: '#' },
    { name: 'Analytics', href: '#' },
    { name: 'Commerce', href: '#' },
    { name: 'Insights', href: '#' },
  ],
  support: [
    { name: 'Pricing', href: '#' },
    { name: 'Documentation', href: '#' },
    { name: 'Guides', href: '#' },
    { name: 'API Status', href: '#' },
  ],
  social: [
    {
      name: 'Facebook',
      href: '#',
      icon: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: '#',
      icon: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: 'Twitter',
      href: '#',
      icon: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      ),
    },
    {
      name: 'GitHub',
      href: '#',
      icon: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  ],
}

export default function HomePage({sortedHomeData, sortedPodcastFeed}) {
  return (
    <div className="bg-white">
      <div className="relative overflow-hidden">
        <Popover as="header" className="relative">
          <div className="pt-6 bg-gray-900">
            <nav
              className="relative flex items-center justify-between px-4 mx-auto max-w-7xl sm:px-6"
              aria-label="Global"
            >
              <div className="flex items-center flex-1">
                <div className="flex items-center justify-between w-full md:w-auto">
                  <a href="#">
                    <span className="sr-only">The Run Club</span>
                    <img
                      className="w-auto h-8 sm:h-10"
                      src="https://tailwindui.com/img/logos/workflow-mark-teal-200-cyan-400.svg"
                      alt=""
                    />
                  </a>
                  <div className="flex items-center -mr-2 md:hidden">
                    <Popover.Button className="inline-flex items-center justify-center p-2 text-gray-400 bg-gray-900 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus-ring-inset focus:ring-white">
                      <span className="sr-only">Open main menu</span>
                      <MenuIcon className="w-6 h-6" aria-hidden="true" />
                    </Popover.Button>
                  </div>
                </div>
                <div className="hidden space-x-8 md:flex md:ml-10">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="text-base font-medium text-white hover:text-gray-300"
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>
              <div className="hidden md:flex md:items-center md:space-x-6">
                <a href="#" className="text-base font-medium text-white hover:text-gray-300">
                  Log in
                </a>
                <a
                  href="/discord"
                  className="inline-flex items-center px-4 py-2 text-base font-medium text-white bg-gray-600 border border-transparent rounded-md hover:bg-gray-700"
                >
                  Sign Up
                </a>
              </div>
            </nav>
          </div>

          <Transition
            as={Fragment}
            enter="duration-150 ease-out"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="duration-100 ease-in"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Popover.Panel focus className="absolute inset-x-0 top-0 p-2 transition origin-top transform md:hidden">
              <div className="overflow-hidden bg-white rounded-lg shadow-md ring-1 ring-black ring-opacity-5">
                <div className="flex items-center justify-between px-5 pt-4">
                  <div>
                    <img
                      className="w-auto h-8"
                      src="https://tailwindui.com/img/logos/workflow-mark-teal-500-cyan-600.svg"
                      alt=""
                    />
                  </div>
                  <div className="-mr-2">
                    <Popover.Button className="inline-flex items-center justify-center p-2 text-gray-400 bg-white rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-600">
                      <span className="sr-only">Close menu</span>
                      <XIcon className="w-6 h-6" aria-hidden="true" />
                    </Popover.Button>
                  </div>
                </div>
                <div className="pt-5 pb-6">
                  <div className="px-2 space-y-1">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className="block px-3 py-2 text-base font-medium text-gray-900 rounded-md hover:bg-gray-50"
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                  <div className="px-5 mt-6">
                    <a
                      href="#"
                      className="block w-full px-4 py-3 font-medium text-center text-white rounded-md shadow bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
                    >
                      Sign up
                    </a>
                  </div>
                  <div className="px-5 mt-6">
                    <p className="text-base font-medium text-center text-gray-500">
                      Existing customer?{' '}
                      <a href="#" className="text-gray-900 hover:underline">
                        Login
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </Popover>
        <main>
          <div className="pt-10 bg-gray-900 sm:pt-16 lg:pt-8 lg:pb-14 lg:overflow-hidden">
            <div className="mx-auto max-w-7xl lg:px-8">
              <div className="lg:grid lg:grid-cols-2 lg:gap-8">
                <div className="max-w-md px-4 mx-auto sm:max-w-2xl sm:px-6 sm:text-center lg:px-0 lg:text-left lg:flex lg:items-center">
                  <div className="lg:py-24">
                    {/* <a
                      href="#"
                      className="inline-flex items-center p-1 pr-2 text-white bg-black rounded-full sm:text-base lg:text-sm xl:text-base hover:text-gray-200"
                    >
                      <span className="px-3 py-0.5 text-white text-xs font-semibold leading-5 uppercase tracking-wide bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full">
                        We're hiring
                      </span>
                      <span className="ml-4 text-sm">Visit our careers page</span>
                      <ChevronRightIcon className="w-5 h-5 ml-2 text-gray-500" aria-hidden="true" />
                    </a> */}
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
                    {/* Illustration taken from Lucid Illustrations: https://lucid.pixsellz.io/ */}
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

          {/* Feature section with screenshot */}
          <div className="relative pt-16 bg-gray-50 sm:pt-24 lg:pt-32">
            <div className="max-w-md px-4 mx-auto text-center sm:px-6 sm:max-w-3xl lg:px-8 lg:max-w-7xl">
              <div>
                <h2 className="text-base font-semibold tracking-wider uppercase text-cyan-600">Running Content</h2>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                  Your favorite running podcasts and videos
                </p>
                <p className="mx-auto mt-5 text-xl text-gray-500 max-w-prose">
                  Enjoy and explore all the amazing content being produced for runners. Whether it's a podcasts of some friends chatting about the latest race results or a video about the latest shoe release, we've got you covered. 
                </p>
              </div>
              <div className="mt-12 -mb-10 sm:-mb-24 lg:-mb-80">
                <img
                  className="rounded-lg shadow-xl ring-1 ring-black ring-opacity-5"
                  src="https://tailwindui.com/img/component-images/green-project-app-screenshot.jpg"
                  alt=""
                />
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
              <div className="grid max-w-md gap-8 px-4 mx-auto mt-12 sm:max-w-lg sm:px-6 lg:px-8 lg:grid-cols-3 lg:max-w-7xl">
                {sortedPodcastFeed.map((podcast) => (
                  <div key={podcast.fullThing.podcastTitle} className="flex flex-col overflow-hidden rounded-lg shadow-lg">
                    <div className="flex-shrink-0">
                      <img className="object-cover w-full h-48" src={podcast.fullThing.lastEpisode.itunes.image ?? podcast.fullThing.itunes.image} alt={podcast.fullThing.lastEpisode.title} />
                    </div>
                    <div className="flex flex-col justify-between flex-1 p-6 bg-white">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-cyan-600">
                          <a href={`/podcasts/${slugify(podcast.fullThing.podcastTitle)}`} className="hover:underline">
                            {podcast.fullThing.podcastTitle}
                          </a>
                        </p>
                        <a href={`/podcasts/${slugify(podcast.fullThing.podcastTitle)}/${slugify(podcast.fullThing.lastEpisode.title)}`} className="block mt-2">
                          <p className="text-xl font-semibold text-gray-900">{podcast.fullThing.lastEpisode.title}</p>
                        </a>
                      </div>
                      <div className="flex items-center mt-6">
                        <div className="flex-shrink-0">
                          <a href={`/podcasts/slugify(${podcast.fullThing.podcastTitle})`}>
                            <img className="w-10 h-10 rounded-full" src={podcast.fullThing.itunes.image} alt={podcast.fullThing.podcastTitle} />
                          </a>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            <a href={`/podcasts/slugify(${podcast.fullThing.podcastTitle})`} className="hover:underline">
                              {podcast.fullThing.podcastTitle}
                            </a>
                          </p>
                          <div className="flex space-x-1 text-sm text-gray-500">
                            <time dateTime={podcast.fullThing.lastEpisode.pubDate}>{podcast.fullThing.lastEpisode.pubDate}</time>
                            <span aria-hidden="true">&middot;</span>
                            <span>{podcast.fullThing.lastEpisode.enclosure.length} read</span>
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
                      <img className="object-cover w-full h-48" src={video.channelSummary.videos.snippet.thumbnails.medium.url} alt="" />
                    </div>
                    <div className="flex flex-col justify-between flex-1 p-6 bg-white">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-cyan-600">
                          <a href={`/videos/${video.channelSummary.videos.snippet.videoOwnerChannelId}`} className="hover:underline">
                            {video.channelSummary.title}
                          </a>
                        </p>
                        <a href={`/videos/${video.channelSummary.videos.snippet.videoOwnerChannelId}/${video.channelSummary.videos.snippet.resourceId.videoId}`} className="block mt-2">
                          <p className="text-xl font-semibold text-gray-900">{video.channelSummary.videos.snippet.title}</p>
                        </a>
                      </div>
                      <div className="flex items-center mt-6">
                        <div className="flex-shrink-0">
                          <a href={`/videos/${video.channelSummary.videos.snippet.videoOwnerChannelId}`}>
                            <img className="w-10 h-10 rounded-full" src={video.channelSummary.thumbnail} alt={video.channelSummary.title} />
                          </a>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            <a href='#' className="hover:underline">
                              {video.channelSummary.title}
                            </a>
                          </p>
                          <div className="flex space-x-1 text-sm text-gray-500">
                            <time dateTime={video.channelSummary.videos.snippet.publishedAt}>{video.channelSummary.videos.snippet.publishedAt}</time>
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
        <footer className="bg-gray-50" aria-labelledby="footer-heading">
          <h2 id="footer-heading" className="sr-only">
            Footer
          </h2>
          <div className="max-w-md px-4 pt-12 mx-auto sm:max-w-7xl sm:px-6 lg:pt-16 lg:px-8">
            <div className="xl:grid xl:grid-cols-3 xl:gap-8">
              <div className="space-y-8 xl:col-span-1">
                <img
                  className="h-10"
                  src="https://tailwindui.com/img/logos/workflow-mark-gray-300.svg"
                  alt="Company name"
                />
                <p className="text-base text-gray-500">
                  Making the world a better place through constructing elegant hierarchies.
                </p>
                <div className="flex space-x-6">
                  {footerNavigation.social.map((item) => (
                    <a key={item.name} href={item.href} className="text-gray-400 hover:text-gray-500">
                      <span className="sr-only">{item.name}</span>
                      <item.icon className="w-6 h-6" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8 mt-12 xl:mt-0 xl:col-span-2">
                <div className="md:grid md:grid-cols-2 md:gap-8">
                  <div>
                    <h3 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">Solutions</h3>
                    <ul role="list" className="mt-4 space-y-4">
                      {footerNavigation.solutions.map((item) => (
                        <li key={item.name}>
                          <a href={item.href} className="text-base text-gray-500 hover:text-gray-900">
                            {item.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-12 md:mt-0">
                    <h3 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">Support</h3>
                    <ul role="list" className="mt-4 space-y-4">
                      {footerNavigation.support.map((item) => (
                        <li key={item.name}>
                          <a href={item.href} className="text-base text-gray-500 hover:text-gray-900">
                            {item.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="py-8 mt-12 border-t border-gray-200">
              <p className="text-base text-gray-400 xl:text-center">&copy; 2022 The Run Club. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
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
      // channelSummary.id = channel.items[0].snippet.channelId;
      channelSummary.thumbnail = channel.items[0].snippet.thumbnails.medium.url;
      channelSummary.playlistId = channel.items[0].contentDetails.relatedPlaylists.uploads
      // channelSummary.videos = videos.slice(0,1);
      channelSummary.videos = videos[0];
      // console.log(JSON.stringify(channelSummary, null, 2));
      return {
         channelSummary
        }
    }
    );

    const homeData = await Promise.all(channelPlaylists)
    const sortedHomeData = orderBy(homeData, "channelSummary.videos.snippet.publishedAt", "desc").slice(0,6)
    const podcastHomeFeed = await getHomeFeedEpisodes()
    const sortedPodcastFeed = orderBy(podcastHomeFeed, "fullThing.lastEpisode.pubDate", "desc").slice(0,6)

    return {
      props: {
        sortedHomeData,
        sortedPodcastFeed
      }
    };
  };