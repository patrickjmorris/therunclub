import { useState } from 'react'
import linkifyHtml from 'linkify-html';
import classNames from "classnames";
import { formatDistance } from "date-fns";
import { getChannelInfo, getAllPlaylistItems, CHANNELS } from "lib/youtube";
import Image from "next/image";
import Link from 'next/link';
import Layout from '@/components/content/Layout';

export default function Channel({ title, videos }) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(null);

  const options = {
    rel: 'noopener',
    target: 'blank'
  }

  function selectVideoByIndex(index) {
    if (index > videos.length - 1) {
      setCurrentVideoIndex(0);
    } else {
      if (index < 0) {
        setCurrentVideoIndex(videos.length - 1);
      } else {
        setCurrentVideoIndex(index);
      }
    }
    window.scrollTo({ left: 0, top: 0, behavior: "smooth" });
  }
  const meta = {
    title: "The Run Club",
    description:
  "Building and supporting the running community",
    logo: "/logo.png",
  }

  return (
    <Layout meta={meta}>
    <div>
      <div className="max-w-6xl p-4 mx-auto lg:p-8">
        <h1 className="my-4 text-2xl font-bold sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        <div
  className={classNames("bg-gray-200 pt-20 p-12 mb-4 relative", {
    hidden: currentVideoIndex === null,
  })}
>
  <div className="absolute top-0 right-0">
    <button
      className="p-2 bg-gray-300 hover:bg-gray-400 focus:bg-gray-400"
      type="button"
      onClick={() => selectVideoByIndex(currentVideoIndex - 1)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>
    <button
      className="p-2 bg-gray-300 hover:bg-gray-400 focus:bg-gray-400"
      type="button"
      onClick={() => selectVideoByIndex(currentVideoIndex + 1)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
    <button
      className="p-2 bg-gray-300 hover:bg-gray-400 focus:bg-gray-400"
      type="button"
      onClick={() => setCurrentVideoIndex(null)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
  {currentVideoIndex !== null && (
  <>
    <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videos[currentVideoIndex].snippet.resourceId.videoId}?autoplay=1`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <h2 className="my-6 text-3xl font-medium">
                {videos[currentVideoIndex].snippet.title}
              </h2>
              <p
                className="prose"
                dangerouslySetInnerHTML={{
                  __html: linkifyHtml(
                    videos[currentVideoIndex].snippet.description?.replace(/\n/g, " <br />"), options
                  ),
                }}
              ></p>
              <Link className="block p-4 border border-gray-200 rounded-lg hover:border-gray-500"
            href={`/videos/${videos[currentVideoIndex].snippet.channelId}/${videos[currentVideoIndex].snippet.resourceId.videoId}`}><a>Go to video page</a></Link>
            <a></a>
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
  {videos.map(
    (
      {
        snippet: {
          title,
          publishedAt,
          thumbnails,
          resourceId: { videoId },
        },
      },
      index
    ) => {
      return (
        <button
          key={videoId}
          className="text-left"
          onClick={() => selectVideoByIndex(index)}
        >
          <Image
            src={thumbnails.medium?.url}
            height={thumbnails.medium?.height}
            width={thumbnails.medium?.width}
          />
          <div className="flex flex-col justify-between mt-2">
            <div className="text-sm font-medium line-clamp-2">{title}</div>
            <div className="mt-2 text-xs text-gray-700">
              {formatDistance(new Date(publishedAt), new Date())}
            </div>
          </div>
        </button>
      );
    }
  )}
</div>
      </div>
    </div>
    </Layout>
  )
};

export async function getStaticPaths() {
  const data = CHANNELS.map(id => (
      {params: {
          channel: id
    }
}))
  return {
    paths: data,
    fallback: 'blocking',
  };
} 

export async function getStaticProps({ params }) {
    const info = await getChannelInfo(params.channel);

    if (info.pageInfo.totalResults === 0) {
        return {
        notFound: true,
        };
    }

    const playlistId = info.items[0].contentDetails.relatedPlaylists.uploads;
    const title = info.items[0].snippet.title;
    const videos = await getAllPlaylistItems(playlistId);
    return {
        props: {
        title,
        videos,
        },
        revalidate: 60 * 60
    };
}

