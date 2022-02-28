import linkifyHtml from 'linkify-html';
import { formatDistance } from "date-fns";
import { getChannelInfo, getPlaylistItems, getVideoInfo, CHANNELS } from "lib/youtube";
import Layout from '@/components/content/Layout';

export default function Video({ video, id }) {
  const options = {
    rel: 'noopener',
    target: 'blank'
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
          {video.title}
        </h1>
  <>
    <div className="aspect-w-16 aspect-h-9">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      <h2 className="my-6 text-3xl font-medium">
        {video.title}
      </h2>
      <p className="mt-2 text-gray-700 text-s">
          Published {formatDistance(new Date(video.publishedAt), new Date())}
      </p>
      <p
        className="prose"
        dangerouslySetInnerHTML={{
          __html: linkifyHtml(
            video.description?.replace(/\n/g, " <br />"), options
          ),
        }}
      ></p>
    </>       
</div>  
</div>
</Layout>
    )
};

export async function getStaticPaths() {
  const channelInfos = await Promise.all(
    CHANNELS.map((channelId) => getChannelInfo(channelId))
  );

  const channelPlaylists = channelInfos.map((channelInfo) => channelInfo.items[0].contentDetails.relatedPlaylists.uploads)
  // console.log(JSON.stringify(channelInfos, null, 2));
  const videos = await Promise.all(
    channelPlaylists.map((channelPlaylist) => getPlaylistItems(channelPlaylist)
    )
  );
  
  const allVideos = videos.flatMap(video => (
    video
  ));
  
  const data = allVideos.map(
    (
      {
        snippet: {
          channelId,
          resourceId: { videoId },
        },
      },
    ) => { return ({params: {channel: channelId, id: videoId}})})
    // console.log(data)
    return {
      paths: data,
      fallback: 'blocking',
    };
} 

export async function getStaticProps({ params }) {
const video = await getVideoInfo(params.id);
// console.log(video.items[0].snippet)
return {
    props: {
      video: video.items[0].snippet,
      id: params.id
    },
    revalidate: 60 * 60
};
}
