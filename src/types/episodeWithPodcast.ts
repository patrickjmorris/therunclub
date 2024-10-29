export type EpisodeWithPodcast = {
	id: string;
	title: string;
	pubDate: Date;
	content: string | null;
	podcastId: string | null;
	podcastTitle: string;
	podcastAuthor: string | null;
	podcastImage: string | null;
	enclosureUrl: string | null;
	duration: string | null;
	explicit: "yes" | "no" | null;
	image: string | null;
};
