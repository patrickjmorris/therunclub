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
    "title": "RUN WILD with Lauren and Bud",
    "slug": "run-wild-with-lauren-and-bud",
    "url": "https://runwildwithlaurenandbud.podbean.com/feed.xml"
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
    "title": "Running Rivals",
    "slug": "running-rivals",
    "url": "https://feeds.simplecast.com/yETd7BOa"
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

