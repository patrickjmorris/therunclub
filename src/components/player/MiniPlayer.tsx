import { type PlayerAPI } from "@/components/AudioProvider";
import { PlayButton } from "@/components/player/PlayButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MiniPlayerProps {
	player: PlayerAPI;
	isDrawerTrigger?: boolean;
	onPlayPause?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function MiniPlayer({
	player,
	isDrawerTrigger = false,
	onPlayPause,
}: MiniPlayerProps) {
	if (!player.episode) return null;

	return (
		<div className="fixed inset-x-0 bottom-0 w-full">
			<div className="mx-auto max-w-screen-2xl">
				<div className="flex items-center gap-4 bg-background/90 px-4 py-4 shadow shadow-border/80 ring-1 ring-border backdrop-blur-sm">
					<div className="flex flex-1 items-center gap-4 min-w-0 overflow-hidden">
						<div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
							{player.episode.image && (
								/* eslint-disable-next-line @next/next/no-img-element */
								<img
									src={player.episode.image}
									alt={player.episode.title}
									className="h-full w-full rounded-lg object-cover"
								/>
							)}
						</div>
						<div className="flex flex-1 flex-col gap-1 min-w-0 overflow-hidden">
							<div className="truncate text-sm font-medium text-foreground">
								{player.episode.title}
							</div>
							<p className="truncate text-xs text-muted-foreground">
								{player.episode.podcastTitle}
							</p>
						</div>
					</div>
					<div className="flex items-center flex-shrink-0">
						<Button
							variant="ghost"
							size="icon"
							onClick={(e) => {
								e.stopPropagation();
								player.toggle();
							}}
							className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 active:bg-primary p-0 text-primary-foreground"
						>
							<PlayButton player={player} size="base" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
