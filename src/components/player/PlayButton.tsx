import { type PlayerAPI } from "@/components/AudioProvider";
import { PauseIcon } from "@/components/PauseIcon";
import { PlayIcon } from "@/components/PlayIcon";

export function PlayButton({
	player,
	size = "base",
}: { player: PlayerAPI; size?: "sm" | "base" | "lg" }) {
	const Icon = player.playing ? PauseIcon : PlayIcon;

	return (
		<button
			type="button"
			className="group relative flex flex-shrink-0 items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
			onClick={() => player.toggle()}
			aria-label={player.playing ? "Pause" : "Play"}
		>
			<div className="absolute -inset-3 md:hidden" />
			<Icon className="h-4 w-4 fill-white group-active:fill-white/80" />
		</button>
	);
}
