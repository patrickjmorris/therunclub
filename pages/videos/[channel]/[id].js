import { useState } from 'react'
import linkifyHtml from 'linkify-html';
import classNames from "classnames";
import { formatDistance } from "date-fns";
import { getChannelInfo, getAllPlaylistItems, CHANNELS } from "lib/youtube";
import Image from "next/image";

export default function Channel({ title, videos }) {
  return (
    <div>
      <div className="max-w-6xl p-4 mx-auto lg:p-8">
        <h1 className="my-4 text-2xl font-bold sm:text-3xl lg:text-4xl">
          {title}
        </h1>
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
            videos[currentVideoIndex].snippet.description?.replace(/\n/g, " <br />")
          ),
        }}
      ></p>
    </>       
</div>  
</div>
    )
};

export async function getStaticPaths() {
  const channelData = CHANNELS.map(id => id)
  const playlistId = channelData.info.items[0].contentDetails.relatedPlaylists.uploads;
  const videos = await getAllPlaylistItems(playlistId);
  const data = videos.map(
    (
      {
        snippet: {
          channelId,
          resourceId: { videoId },
        },
      },
    ) => { return ({channel: channelId, id: videoId})})
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
};
}
