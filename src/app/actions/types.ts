import type { Podcast, Channel } from "@/db/schema";

export interface AddPodcastState {
	errors?: {
		feedUrl?: string[];
		_form?: string[];
	};
	message?: string | null;
	data?: Podcast | null;
	redirect?: string;
}

export interface AddChannelState {
	errors?: {
		url?: string[];
		_form?: string[];
	};
	message?: string | null;
	data?: Channel | null;
	redirect?: string;
}
