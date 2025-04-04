import { type PlayerAPI } from "@/components/podcasts/audio-provider";
import { PauseIcon } from "@/components/podcasts/pause-icon";
import { PlayIcon } from "@/components/podcasts/play-icon";
import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";

interface PlayButtonProps extends React.HTMLAttributes<HTMLDivElement> {
	player: PlayerAPI;
	size?: "sm" | "base" | "lg";
	asChild?: boolean;
}

export const PlayButton = forwardRef<HTMLDivElement, PlayButtonProps>(
	({ player, size = "base", asChild = false, className, ...props }, ref) => {
		const Icon = player.playing ? PauseIcon : PlayIcon;
		const Comp = asChild ? Slot : "div";

		const iconSize = {
			sm: "h-4 w-4",
			base: "h-6 w-6",
			lg: "h-8 w-8",
		}[size];

		return (
			<Comp
				ref={ref}
				className={`group relative flex flex-shrink-0 items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2 ${className}`}
				onClick={() => player.toggle()}
				aria-label={player.playing ? "Pause" : "Play"}
				{...props}
			>
				<span className="relative">
					<div className="absolute -inset-3 md:hidden" />
					<Icon
						className={`${iconSize} fill-background dark:fill-background group-active:fill-background/80 dark:group-active:fill-background/80`}
					/>
				</span>
			</Comp>
		);
	},
);
