import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { FEEDS } from "../../lib/podcast";

export default function Home() {
  return (
    <div className="flex h-screen bg-white">
      <Head>
        <title>The Run Club</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
        {/* <AudioPlayer /> */}
        <div className="max-w-xl px-6 py-12 mx-auto">
          <h1 className="mb-12 text-5xl font-bold">Running Podcasts</h1>
          <div className="grid grid-cols-2 gap-4">
            {FEEDS.map((feed) => (
              <Link key={feed.slug} href={`/podcasts/${feed.slug}`}>
                <a className="p-4 border border-gray-200 rounded-lg hover:border-gray-500">
                  {feed.title}
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
  );
}