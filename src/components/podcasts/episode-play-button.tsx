"use client";

import { useAudioPlayer } from "@/components/podcasts/audio-provider";
import { Button } from "@/components/ui/button";
import { EpisodeWithPodcast } from "@/types/episodeWithPodcast";

export function EpisodePlayButton({
	episode,
	playing,
	paused,
	...props
}: React.ComponentPropsWithoutRef<"button"> & {
	episode: EpisodeWithPodcast;
	playing: React.ReactNode;
	paused: React.ReactNode;
}) {
	const player = useAudioPlayer(episode);

	return (
		<Button
			variant="outline"
			type="button"
			onClick={() => player.toggle()}
			aria-label={`${player.playing ? "Pause" : "Play"} episode ${
				episode.title
			}`}
			{...props}
		>
			{player.playing ? playing : paused}
		</Button>
	);
}
