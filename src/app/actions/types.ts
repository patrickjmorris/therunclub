import type { Podcast, Channel } from "@/db/schema";

export interface AddChannelState {
	errors?: {
		url?: string[];
		_form?: string[];
	};
	message: string | null;
	data?: Channel;
	redirect?: string;
}

export interface AddPodcastState {
	errors?: {
		feedUrl?: string[];
		_form?: string[];
	};
	message: string | null;
	data?: Podcast;
	redirect?: string;
}
