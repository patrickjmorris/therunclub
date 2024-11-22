export interface iTunesPodcast {
	collectionId: number;
	trackId: number;
	artistName: string;
	collectionName: string;
	trackName: string;
	collectionViewUrl: string;
	feedUrl: string;
	trackViewUrl: string;
	artworkUrl30: string;
	artworkUrl60: string;
	artworkUrl100: string;
	artworkUrl600: string;
	collectionPrice: number;
	releaseDate: string;
	trackCount: number;
	primaryGenreName: string;
	genres: string[];
	description?: string;
}

export interface iTunesSearchResponse {
	resultCount: number;
	results: iTunesPodcast[];
}
