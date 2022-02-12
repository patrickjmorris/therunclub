import { FEEDS, getFeed, getFeedEpisodes } from "@/lib/podcast";
import { format } from "date-fns";
import BlurImage from "@/components/BlurImage";
import selectProps from "@/lib/selectProps";
import { Anchorme } from 'react-anchorme';
import {slugify} from "@/lib/util"
import Link from "next/link";

export default function Feed({  singleEpisode, itunes, title, description }) {
  return (
    <div className="max-w-xl px-6 py-12 mx-auto">
    <div className="p-4">
        <h1 className="mb-12 text-5xl font-bold">{title}</h1>
        <BlurImage 
            priority="true" 
            src={itunes.image ?? singleEpisode.itunes.image}
            width={500}
            height={500}
            layout="responsive"
            objectFit="cover"
            />
            <Anchorme>{description}</Anchorme>
            <Link href={`/podcasts/${slugify(title)}`}><a>See more from {title}</a></Link>
     </div>     
      <div className="space-y-4">
            <div className="font-bold">{singleEpisode.title}</div>
            <BlurImage  
              src={singleEpisode.itunes.image ? singleEpisode.itunes.image : itunes.image}  
              alt={singleEpisode.itunes.name ? singleEpisode.itunes.name : title}
              width={500}
              height={500}
              layout="responsive"
              objectFit="cover"
            />
            <div>{format(new Date(singleEpisode.isoDate), "PPP")}</div>
            <audio
              controls
              preload="auto"
              src={singleEpisode.enclosure.url}
              type={singleEpisode.enclosure.type}>
            </audio>
      </div>
      
    </div>
    
  );
}

export async function getStaticPaths() {
  const titleEpisodes = await getFeedEpisodes()
  const limitEpisodes = titleEpisodes.map(episode => episode.allFeeds.slice(0,10))
  const allPodcastEpisodes = limitEpisodes.flatMap(episode => (
      episode
  ));
  const data = allPodcastEpisodes.map(episode => (
    {params: {
      slug: slugify(episode.podcastTitle),
      episode: slugify(episode.podcastEpisode),
    }
  }))
  return {
    paths: data,
    fallback: 'blocking',
  };
}   

export async function getStaticProps({ params }) {
  const feed = FEEDS.find((feed) => feed.slug === params.slug);
  const detailedFeed = await getFeed(feed.url);
  const itemsForIndex = detailedFeed.items.map(selectProps("guid", "title", "isoDate", "itunes", "enclosure"));
  const singleEpisode = itemsForIndex.find((item) => slugify(item.title) === params.episode)
  return {
    props: {
      feed,
      singleEpisode,
      // image: detailedFeed.image,
      itunes: detailedFeed.itunes,
      title: detailedFeed.title,
      description: detailedFeed.description,
    },
    revalidate: 1,
  };
}