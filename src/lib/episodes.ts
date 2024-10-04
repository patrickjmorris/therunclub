import Parser from 'rss-parser';
import { slugify } from './utils';

export const FEEDS = 
[
  {
    "title": "Coffee Club",
    "slug": "coffee-club",
    "url": "https://media.rss.com/coffeeclub/feed.xml"
  },
  {
    "title": "Runners of NYC Podcast",
    "slug": "runners-of-nyc-podcast",
    "url": "https://anchor.fm/s/122c6bec/podcast/rss"
  },
  {
    "title": "2 Black Runners",
    "slug": "2-black-runners",
    "url": "https://anchor.fm/s/f8604d4/podcast/rss"
  },
  {
    "title": "CITIUS MAG Podcast with Chris Chavez",
    "slug": "citius-mag-podcast-with-chris-chavez",
    "url": "https://anchor.fm/s/9085ecc/podcast/rss"
  },
  {
    "title": "I'll Have Another with Lindsey Hein Podcast",
    "slug": "ill-have-another-with-lindsey-hein-podcast",
    "url": "https://feeds.podcastmirror.com/i-ll-have"
  },
  {
    "title": "The Rambling Runner Podcast",
    "slug": "the-rambling-runner-podcast",
    "url": "https://feeds.megaphone.fm/TNM8831701716"
  },
  {
    "title": "The Strength Running Podcast",
    "slug": "the-strength-running-podcast",
    "url": "https://strengthrunning.libsyn.com/rss"
  },
  {
    "title": "C Tolle Run",
    "slug": "c-tolle-run",
    "url": "https://feeds.libsyn.com/91796/rss"
  },
  {
    "title": "Ali on the Run Show",
    "slug": "ali-on-the-run-show",
    "url": "https://aliontherunshow.libsyn.com/rss"
  },
  {
    "title": "Trail Runner Nation",
    "slug": "trail-runner-nation",
    "url": "https://trailrunnernation.libsyn.com/rss"
  },
  {
    "title": "Clean Sport Collective",
    "slug": "clean-sport-collective",
    "url": "https://cleansport.libsyn.com/rss"
  },
  {
    "title": "LetsRun.com's Track Talk",
    "slug": "letsruncoms-track-talk",
    "url": "https://pinecast.com/feed/letsrun"
  },
  {
    "title": "More Than Running with Dana",
    "slug": "more-than-running-with-dana",
    "url": "https://anchor.fm/s/1e338524/podcast/rss"
  },
  {
    "title": "D3 Glory Days Podcast",
    "slug": "d3-glory-days-podcast",
    "url": "https://anchor.fm/s/6754af80/podcast/rss"
  },
  {
    "title": "KoopCast",
    "slug": "koopcast",
    "url": "https://feeds.buzzsprout.com/765419.rss"
  },
  {
    "title": "Inside Running Podcast",
    "slug": "inside-running-podcast",
    "url": "https://insiderunningpodcast.podbean.com/feed.xml"
  },
  {
    "title": "Strides Forward: Stories about Running, Told By Women",
    "slug": "strides-forward-stories-about-running-told-by-women",
    "url": "https://feeds.simplecast.com/y6P9ekdn"
  },
  {
    "title": "Convos Over Cold Brew with Emma Abrahamson",
    "slug": "convos-over-cold-brew-with-emma-abrahamson",
    "url": "https://feeds.redcircle.com/b8306d3b-3fc0-4f0a-be29-c533d2caa658"
  },
  {
    "title": "Running Things",
    "slug": "running-things",
    "url": "https://feeds.simplecast.com/3FQgAftS"
  },
  {
    "title": "Beer Mile Podcast",
    "slug": "beer-mile-podcast",
    "url": "https://anchor.fm/s/3b1479a0/podcast/rss"
  },
  {
    "title": "A Runner’s Life",
    "slug": "a-runners-life",
    "url": "https://anchor.fm/s/3a0f804/podcast/rss"
  },
  {
    "title": "Healthy Runner Podcast",
    "slug": "healthy-runner-podcast",
    "url": "https://healthyrunner.libsyn.com/rss"
  },
  {
    "title": "Running Book Reviews with Alan and Liz",
    "slug": "running-book-reviews-with-alan-and-liz",
    "url": "https://feeds.buzzsprout.com/976876.rss"
  },
  {
    "title": "Strong Runner Chick Radio",
    "slug": "strong-runner-chick-radio",
    "url": "https://anchor.fm/s/c9e9290/podcast/rss"
  },
  {
    "title": "UltraRunning Magazine Podcast",
    "slug": "ultrarunning-magazine-podcast",
    "url": "https://ultrarunningmag.libsyn.com/rss"
  },
  {
    "title": "Keeping Track",
    "slug": "keeping-track",
    "url": "https://feeds.buzzsprout.com/655009.rss"
  },
  {
    "title": "RunChats with @RonRunsNYC",
    "slug": "runchats-with-ronrunsnyc",
    "url": "https://anchor.fm/s/ce73324/podcast/rss"
  },
  {
    "title": "The Running Pod",
    "slug": "the-running-pod",
    "url": "https://feeds.redcircle.com/9db7f92d-3ff6-4c9d-b6de-22cf061620ca"
  },
  {
    "title": "Sit & Kick",
    "slug": "sit-kick",
    "url": "https://anchor.fm/s/132cd554/podcast/rss"
  },
  {
    "title": "The FloTrack Podcast",
    "slug": "the-flotrack-podcast",
    "url": "https://feeds.simplecast.com/t__J5Uo7"
  },
  {
    "title": "Kofuzi Run Club",
    "slug": "kofuzi-run-club",
    "url": "https://anchor.fm/s/1dc575c0/podcast/rss"
  },
  {
    "title": "House of Run",
    "slug": "house-of-run",
    "url": "https://feeds.simplecast.com/_421QpB_"
  },
  {
    "title": "The Morning Shakeout Podcast",
    "slug": "the-morning-shakeout-podcast",
    "url": "https://feeds.acast.com/public/shows/61bb951645cc6900145d924a"
  },
  {
    "title": "Sweat Elite Podcast",
    "slug": "sweat-elite-podcast",
    "url": "https://sweatelite.libsyn.com/rss"
  },
  {
    "title": "Marathon Training Academy",
    "slug": "marathon-training-academy",
    "url": "https://feeds.podcastmirror.com/mta"
  },
  {
    "title": "Some Work, All Play",
    "slug": "some-work-all-play",
    "url": "https://anchor.fm/s/9abbbe4/podcast/rss"
  },
  {
    "title": "Hurdle",
    "slug": "hurdle",
    "url": "https://anchor.fm/s/c154238/podcast/rss"
  },
  {
    "title": "Finding Strong",
    "slug": "finding-strong",
    "url": "https://feeds.buzzsprout.com/272705.rss"
  },
  {
    "title": "How Was Your Run Today? The Podcast",
    "slug": "how-was-your-run-today-the-podcast",
    "url": "https://howwasyourruntoday.libsyn.com/rss"
  },
  {
    "title": "Another Mother Runner",
    "slug": "another-mother-runner",
    "url": "http://feeds.megaphone.fm/AMR9916476147"
  },
  {
    "title": "Peaked Too Early",
    "slug": "peaked-too-early",
    "url": "https://feeds.soundcloud.com/users/soundcloud:users:599265279/sounds.rss"
  },
  {
    "title": "The Longest Stride",
    "slug": "the-longest-stride",
    "url": "https://anchor.fm/s/265d4b2c/podcast/rss"
  },
  {
    "title": "Relaxed Running",
    "slug": "relaxed-running",
    "url": "https://feeds.transistor.fm/relaxed-running"
  },
  {
    "title": "The Aussie Runner Podcast",
    "slug": "the-aussie-runner-podcast",
    "url": "https://aussierunnerpodcast.libsyn.com/rss"
  },
  {
    "title": "Dirt Church Radio",
    "slug": "dirt-church-radio",
    "url": "https://gecko-carnation.squarespace.com/dirtchurchradio?format=rss"
  },
  {
    "title": "Cloud259",
    "slug": "cloud259",
    "url": "https://feeds.feedburner.com/Cloud259Podcast"
  },
  {
    "title": "The RunRX Podcast",
    "slug": "the-runrx-podcast",
    "url": "https://runrx.libsyn.com/rss"
  },
  {
    "title": "For The Kudos",
    "slug": "for-the-kudos",
    "url": "https://feed.podbean.com/forthekudos/feed.xml"
  }
];

export interface PodcastMetadata {
  title: string;
  description: string;
  image: string;
  author: string;
  link: string;
  language: string;
  lastBuildDate: Date | null;
  itunesOwnerName: string;
  itunesOwnerEmail: string;
  itunesImage: string;
  itunesAuthor: string;
  itunesSummary: string;
  itunesExplicit: 'yes' | 'no';
  // Add other metadata properties here as needed
}

export interface Episode {
  title: string;
  pubDate: string;
  description: string;
  link: string;
  guid: string
  enclosure: {
      url: string;
  };
  itunes: {
      duration: string;
      explicit: 'yes' | 'no'; // Assuming explicit can only be yes or no
      image: string;
      episode: string;
      season: string;
  };
}

export interface ParsedPodcastFeed {
  metadata: PodcastMetadata;
  items: Episode[];
}

export async function parsePodcastFeed(rssFeedUrl: string): Promise<ParsedPodcastFeed> {
  const parser = new Parser();
  const feed = await parser.parseURL(rssFeedUrl);

  const metadata: PodcastMetadata = {
      title: feed.title || '',
      description: feed.description || '',
      image: feed.image?.url || feed.itunes?.image || '',
      author: feed.itunes?.author || '',
      link: feed.link || '',
      language: feed.language || '',
      lastBuildDate: feed.lastBuildDate ? new Date(feed.lastBuildDate) : null,
      itunesOwnerName: feed.itunes?.owner?.name || '',
      itunesOwnerEmail: feed.itunes?.owner?.email || '',
      itunesImage: feed.itunes?.image || '',
      itunesAuthor: feed.itunes?.author || '',
      itunesSummary: feed.itunes?.summary || '',
      itunesExplicit: feed.itunes?.explicit === 'yes' ? 'yes' : 'no',
      // Add other metadata properties here as needed
  };

  const items: Episode[] = feed.items.map((item: any) => ({
      title: item.title || '',
      pubDate: item.pubDate || '',
      description: item.content || '',
      link: item.link || '',
      guid: item.guid || '',
      enclosure: {
          url: item.enclosure?.url || '',
      },
      itunes: {
          duration: item.itunes?.duration || '',
          explicit: item.itunes?.explicit || 'no',
          image: item.itunes?.image || '',
          episode: item.itunes?.episode || '',
          season: item.itunes?.season || '',
      },
  }));
  // console.log(metadata, feed.items[0])
  return { metadata, items };
  
}

// This function is used to get the last 10 episodes of a podcast
export async function getLastTenEpisodes(rssFeedUrl: string): Promise<Episode[]> {
  const feed = await parsePodcastFeed(rssFeedUrl);
  return feed.items.slice(0, 10);
}

// Get the last episode of a podcast
export async function getLastEpisode(rssFeedUrl: string): Promise<Episode> {
  const feed = await parsePodcastFeed(rssFeedUrl);
  return feed.items[0];
}

// Get a specific episode of a podcast
export async function getEpisode(rssFeedUrl: string, episodeTitle: string): Promise<Episode | null> {
  const feed = await parsePodcastFeed(rssFeedUrl);
  return feed.items.find((episode) => slugify(episode.title) === episodeTitle) || null;
}

// Get just the title of all episodes of a podcast
export async function getEpisodeTitles(rssFeedUrl: string): Promise<string[]> {
  const feed = await parsePodcastFeed(rssFeedUrl);
  return feed.items.map((episode) => episode.title);
}

// Get metadata for a podcast
export async function getPodcastMetadata(rssFeedUrl: string): Promise<PodcastMetadata> {
  const feed = await parsePodcastFeed(rssFeedUrl);
  return feed.metadata;
}

// Full feed only for testing
export async function getFullFeed(rssFeedUrl: string): Promise<any> {
  const parser = new Parser();
  const fullFeed = await parser.parseURL(rssFeedUrl);
  return fullFeed;
}

export default async function getPodcastandLastEpisodes(): Promise<any[]> {
  // Use the getPodcastMetadata function to get metadata for each podcast
  // Use the FEEDS array to get the metadata for each podcast
  // Use getLastEpisode function to get the last episode for each podcast
  // Use the parsePodcastFeed function to parse the RSS feed for each podcast
  
  return await Promise.all(FEEDS.map(async (feed) => {
    let slug = feed.slug
    let metadata = await getPodcastMetadata(feed.url)
    let episode = await getLastEpisode(feed.url)
    return {
      slug: slug,
      title: metadata.title,
      description: metadata.description,
      image: metadata.image,
      // return the episodes for the podcast and transform the pubDate into a Date object
      episodes: {
        title: episode.title,
        pubDate: new Date(episode.pubDate),
      }, 
    }
  }))
}
