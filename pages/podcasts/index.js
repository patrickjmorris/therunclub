import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { FEEDS } from "../../lib/podcast";
import Layout from "@/components/content/Layout";

export default function PodcastsIndex() {
  const meta = {
    title: "The Run Club",
    description:
  "Building and supporting the running community",
    logo: "/logo.png",
  }

  return (
    <Layout meta={meta}>
    <div className="max-w-6xl p-4 mx-auto lg:p-8 bg-slate-50">
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
      </Layout>
  );
}