"use client";

import { useAudioPlayer } from "@/components/AudioProvider";
import { type Episode } from "@/lib/episodes";
import { Button } from "./ui/button";

export function EpisodePlayButton({
	episode,
	playing,
	paused,
	...props
}: React.ComponentPropsWithoutRef<"button"> & {
	episode: Episode;
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
