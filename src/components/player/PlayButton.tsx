import { type PlayerAPI } from "@/components/AudioProvider";
import { PauseIcon } from "@/components/PauseIcon";
import { PlayIcon } from "@/components/PlayIcon";

export function PlayButton({ player }: { player: PlayerAPI }) {
	const Icon = player.playing ? PauseIcon : PlayIcon;

	return (
		<button
			type="button"
			className="group relative flex h-8 w-8 flex-shrink-0 items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2"
			onClick={() => player.toggle()}
			aria-label={player.playing ? "Pause" : "Play"}
		>
			<div className="absolute -inset-3 md:hidden" />
			<Icon className="h-4 w-4 fill-white group-active:fill-white/80" />
		</button>
	);
}
