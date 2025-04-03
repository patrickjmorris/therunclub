export interface BasicVideo {
	id: string;
	title: string;
	thumbnailUrl: string | null;
	channelTitle: string | null;
	channelId: string;
	publishedAt: Date | null;
	description: string | null;
	viewCount: string | null;
	likeCount: string | null;
	commentCount: string | null;
	duration: string | null;
	youtubeVideoId: string;
	createdAt: Date | null;
	updatedAt: Date | null;
	tags: string[] | null;
}

export interface BasicEpisode {
	id: string;
	episodeSlug: string;
	title: string;
	pubDate: Date | null;
	podcastSlug: string;
	podcastTitle: string;
	podcastImage: string | null;
	itunesImage?: string | null;
	episodeImage?: string | null;
	duration: string;
	content: string | null;
	podcastId: string;
	podcastAuthor: string | null;
	enclosureUrl: string | null;
	explicit: "yes" | "no" | null;
	link: string | null;
}
