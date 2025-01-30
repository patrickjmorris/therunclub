import { type PlayerAPI } from "@/components/AudioProvider";
import { PauseIcon } from "@/components/PauseIcon";
import { PlayIcon } from "@/components/PlayIcon";
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
			// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
			<Comp
				ref={ref}
				className={`group relative flex flex-shrink-0 items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2 ${className}`}
				onClick={() => player.toggle()}
				aria-label={player.playing ? "Pause" : "Play"}
				{...props}
			>
				<span className="relative">
					<div className="absolute -inset-3 md:hidden" />
					<Icon className={`${iconSize} fill-white group-active:fill-white/80`} />
				</span>
			</Comp>
		);
	}
);
