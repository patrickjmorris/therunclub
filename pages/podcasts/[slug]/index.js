import { FEEDS, getFeed, getFeedEpisodes } from "@/lib/podcast";
import { format } from "date-fns";
import BlurImage from "@/components/BlurImage";
import selectProps from "@/lib/selectProps";
import { Anchorme } from 'react-anchorme';
import Link from "next/link";
import {slugify} from "@/lib/util"


export default function Feed({ items, itunes, feed, title, description }) {
  return (
    <div className="max-w-xl px-6 py-12 mx-auto">
    <Link href='/podcasts'><a>See more Podcasts</a></Link>
    <div className="p-4">
        <h1 className="mb-12 text-5xl font-bold">{feed.title}</h1>
        <BlurImage 
            priority="true" 
            src={itunes.image ?? items.itunes.image}
            width={500}
            height={500}
            layout="responsive"
            objectFit="cover"
            />
            <Anchorme>{description}</Anchorme>
     {/* <p>Last Updated: {format(new Date(lastBuildDate), "PPP")}</p> */}
     </div>     
      <div className="space-y-4">
        {items.map((item) => (
          <Link
            key={item.guid}
            className="block p-4 border border-gray-200 rounded-lg hover:border-gray-500"
            href={`/podcasts/${feed.slug}/${slugify(item.title)}`}
          >
            <a>
            <div className="font-bold">{item.title}</div>
            <BlurImage  
              src={item.itunes.image ? item.itunes.image : itunes.image}  
              alt={item.itunes.name ? item.itunes.name : item.title}
              width={250}
              height={250}
              layout="responsive"
              objectFit="cover"
            />
            {item.contentSnippet && <p className="truncate">{item.contentSnippet}</p>}
            <div>{format(new Date(item.isoDate), "PPP")}</div>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function getStaticPaths() {
    const titleEpisodes = await getFeedEpisodes()
    // const notUndefined = anyValue => typeof anyValue !== 'undefined'
    // console.log(titleEpisodes)
    // const data = titleEpisodes.map((u, i) => ({params: {slug: slugify([u.allFeeds[i].podcastTitle]) }}))
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
  // const itemsForIndex = detailedFeed.items.map(selectProps("guid", "title", "isoDate", "itunes", "contentSnippet"))
  return {
    props: {
      feed,
      items: detailedFeed.items,
      // items: itemsForIndex,
      itunes: detailedFeed.itunes,
      title: detailedFeed.title,
      description: detailedFeed.description,
    },
    revalidate: 1,
  };
}