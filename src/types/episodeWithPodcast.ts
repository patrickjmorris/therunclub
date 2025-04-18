export interface EpisodeWithPodcast {
	id: string;
	title: string;
	pubDate: Date | null;
	content: string | null;
	podcastId: string | null;
	podcastTitle: string;
	podcastAuthor: string | null;
	podcastImage: string | null;
	enclosureUrl: string | null;
	duration: string | null;
	explicit: "yes" | "no" | null;
	episodeImage?: string | null;
	episodeSlug: string | null;
	podcastSlug: string | null;
	link: string | null;
}
