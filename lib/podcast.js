import Parser from "rss-parser";
import { slugify } from "./util";
// import { getPodcastFeeds } from "./gSheets";

export const FEEDS = 
[
  {
    "title": "Coffee Club",
    "slug": "coffee-club",
    "url": "https://media.rss.com/coffeeclub/feed.xml"
  },

];
  

export async function getFeed(feedUrl) {
  let parser = new Parser();
  let feed = await parser.parseURL(feedUrl);
  return feed;
}

export async function getFeedEpisodes() {
  try {
    // const podcastFeeds = await getPodcastFeeds();
    const promises = FEEDS.map(async feed => {
      const feedData = await getFeed(feed.url)
      const episodes = feedData.items.map((item) => item.title) 
      const fullThing = {
        podcastTitle: feed.title,
        episodeTitle: episodes
      }
      const allFeeds = fullThing.episodeTitle.map((episode) => ({
        podcastEpisode: episode,
        podcastTitle: fullThing.podcastTitle
       }))
      //  console.log(feedData)
      return { allFeeds };
        
    })
    const feedDatas = await Promise.all(promises)
    return feedDatas
  }
  catch (error) {
    //   log any errors to the console
    console.log(error);
  }
}

export async function getHomeFeedEpisodes() {
  try {
    // const podcastFeeds = await getPodcastFeeds();
    const promises = FEEDS.map(async feed => {
      const feedData = await getFeed(feed.url)
      const lastEpisode = feedData.items[0]
      const fullThing = {
        podcastTitle: feed.title,
        itunes: feedData.itunes,
        lastEpisode
      }
      return { fullThing };
        
    })
    const feedDatas = await Promise.all(promises)
    return feedDatas
  }
  catch (error) {
    //   log any errors to the console
    console.log(error);
  }
}

