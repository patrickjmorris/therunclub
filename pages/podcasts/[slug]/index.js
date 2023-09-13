import { FEEDS, getFeed, getFeedEpisodes } from "@/lib/podcast";
import { format } from "date-fns";
import BlurImage from "@/components/BlurImage";
import linkifyHtml from 'linkify-html';
import Link from "next/link";
import {slugify} from "@/lib/util";
import Layout from "@/components/content/Layout";

export default function Feed({ items, itunes, feed, description, lastBuildDate }) {
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
    <div className="max-w-xl px-6 py-12 mx-auto">
    <Link href={`/podcasts`}>
              
                  See more from Podcasts
              
            </Link>
    <div className="p-4">
        <h1 className="mb-12 text-5xl font-bold">{feed.title}</h1>
        <BlurImage 
            priority="true" 
            src={itunes.image ?? items.image}
            width={500}
            height={500}
            layout="responsive"
            objectFit="cover"
            />
            <p
                className="prose"
                dangerouslySetInnerHTML={{
                  __html: linkifyHtml(description, options),
                }}
              ></p>
     {lastBuildDate ? <p>Last Updated: {format(new Date(lastBuildDate), "PPP")}</p>: ''}
     </div>     
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.guid}>
          <Link
            className="block p-4 border border-gray-200 rounded-lg hover:border-gray-500"
            href={`/podcasts/${feed.slug}/${slugify(item.title)}`}
          >

            <div className="font-bold">{item.title}</div>
            <BlurImage  
              src={item.image ?? itunes.image}  
              alt={item.title}
              width={250}
              height={250}
              layout="responsive"
              objectFit="cover"
            />

          </Link>
          {
              item.description ?  <p
                className="prose"
                dangerouslySetInnerHTML={{
                  __html: linkifyHtml(item.description, options),
                }}
              ></p> :
              item.contentSnippet ?  <p
                className="prose"
                dangerouslySetInnerHTML={{
                  __html: linkifyHtml(item.contentSnippet, options),
                }}
              ></p> : ''
            }
            <div>{format(new Date(item.isoDate), "PPP")}</div>
            </div>
        ))}
      </div>
    </div>
    </Layout>
  );
}

export async function getStaticPaths() {
    const data = FEEDS.map((podcast) => ({
        params: { slug: podcast.slug}
      }))
    return {
      paths: data,
      fallback: false,
    };
}

export async function getStaticProps({ params }) {
  const feed = FEEDS.find((feed) => feed.slug === params.slug);
  const detailedFeed = await getFeed(feed.url);
  const itemsForIndex = detailedFeed.items.map((item) => ({
    guid: item.guid,
    title: item.title,
    isoDate: item.isoDate,
    image: item.itunes.image || null,
    description: item.description || null,
    contentSnippet: item.contentSnippet || null,
  }))
  
  return {
    props: {
      feed,
      items: itemsForIndex,
      itunes: detailedFeed.itunes,
      title: detailedFeed.title,
      description: detailedFeed.description,
      author: detailedFeed.itunes.author ?? detailedFeed.creator
    },
    revalidate: 60 * 60,
  };
}