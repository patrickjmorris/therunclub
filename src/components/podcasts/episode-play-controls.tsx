"use client";

import { EpisodePlayButton } from "../EpisodePlayButton";
import { Play, Pause } from "lucide-react";
import type { BasicEpisode } from "@/types/shared";

interface EpisodePlayControlsProps {
	episode: BasicEpisode;
}

export function EpisodePlayControls({ episode }: EpisodePlayControlsProps) {
	return (
		<EpisodePlayButton
			episode={episode}
			className="flex items-center gap-2"
			playing={
				<>
					<Pause className="h-4 w-4 fill-current" />
					<span aria-hidden="true">Listen</span>
				</>
			}
			paused={
				<>
					<Play className="h-4 w-4 fill-current" />
					<span aria-hidden="true">Listen</span>
				</>
			}
		/>
	);
}
