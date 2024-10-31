import { getLastEpisodesByPodcast } from "@/db/queries";

export default async function sitemap() {
  const baseUrl = 'https://therunclub.xyz';
  
  // Get all episodes
  const episodes = await getLastEpisodesByPodcast();
  
  const episodeUrls = episodes.map((episode) => ({
    url: `${baseUrl}/podcasts/${episode.podcastSlug}/${episode.episodeSlug}`,
    lastModified: episode.pubDate,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/podcasts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...episodeUrls,
  ];
} 