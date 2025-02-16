"use client";

import { useAudioPlayer } from "@/components/AudioProvider";
import { Button } from "./ui/button";
import { EpisodeWithPodcast } from "@/types/episodeWithPodcast";
import { Headphones, Pause } from "lucide-react";

interface ListenNowButtonProps
	extends React.ComponentPropsWithoutRef<typeof Button> {
	episode: EpisodeWithPodcast;
	variant?: "default" | "secondary" | "outline";
	className?: string;
}

export function ListenNowButton({
	episode,
	variant = "secondary",
	className,
	...props
}: ListenNowButtonProps) {
	const player = useAudioPlayer(episode);

	return (
		<Button
			variant={variant}
			className={className}
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				player.toggle();
			}}
			{...props}
		>
			{player.playing ? (
				<>
					<Pause className="mr-2 h-4 w-4" />
					Playing
				</>
			) : (
				<>
					<Headphones className="mr-2 h-4 w-4" />
					Listen Now
				</>
			)}
		</Button>
	);
}
