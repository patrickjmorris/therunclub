import { getChannelInfo, CHANNELS } from "lib/youtube";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import Layout
 from "@/components/content/Layout";
export default function Home({ channelInfos }) {
  const meta = {
    title: "The Run Club",
    description:
  "Building and supporting the running community",
    logo: "/logo.png",
  }

  return (
    <Layout meta={meta}>
      <div className="max-w-6xl p-4 mx-auto lg:p-8 bg-slate-50">
        <h1>Best Running YouTube Channels</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {channelInfos.map((channelInfo) => {
            const {
              id,
              snippet: { title, thumbnails, publishedAt },
            } = channelInfo.items[0];
  
            return (
              <Link key={id} href={`/videos/${id}`}>
                <a className="rounded-lg">
                <Image
                src={thumbnails.medium?.url}
                height={thumbnails.medium?.height}
                width={thumbnails.medium?.width}
                className="rounded-md shadow-lg"
                />
                  <div className="mt-2 text-sm font-medium">
                    {title}
                  </div>
                  <div>{format(new Date(publishedAt), "PPP")}</div>
                </a>
              </Link>
            );
          })}
        </div>
      </div>
      </Layout>
    );
  }

export async function getStaticProps() {
  const channelInfos = await Promise.all(
    CHANNELS.map((channelId) => getChannelInfo(channelId))
  );
  
  return {
    props: {
      channelInfos,
    },
    revalidate: 60 * 60
  };
}

