import { type PlayerAPI } from "@/components/podcasts/audio-provider";
import { PlayButton } from "@/components/podcasts/player/PlayButton";
import { RewindButton } from "@/components/podcasts/player/RewindButton";
import { ForwardButton } from "@/components/podcasts/player/ForwardButton";
import { MuteButton } from "@/components/podcasts/player/MuteButton";
import { PlaybackRateButton } from "@/components/podcasts/player/PlaybackRateButton";
import { Slider } from "@/components/podcasts/player/Slider";
import { useState, useRef, type RefObject, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ExpandedPlayerProps {
	player: PlayerAPI;
	miniPlayerRef: RefObject<HTMLDivElement | null>;
	isOpen: boolean;
	onClose: () => void;
}

function formatTimelineTime(time: number) {
	const hours = Math.floor(time / 3600);
	const minutes = Math.floor((time - hours * 3600) / 60);
	const seconds = Math.floor(time - hours * 3600 - minutes * 60);

	if (hours === 0) {
		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	}
	return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
		.toString()
		.padStart(2, "0")}`;
}

export function ExpandedPlayer({
	player,
	miniPlayerRef,
	isOpen,
	onClose,
}: ExpandedPlayerProps) {
	const [currentTime, setCurrentTime] = useState<number | null>(null);
	const wasPlayingRef = useRef(false);
	const isDraggingRef = useRef(false);

	// Reset currentTime when episode changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		setCurrentTime(null);
	}, [player.episode?.id]);

	// Update currentTime when playback progresses
	useEffect(() => {
		if (!isDraggingRef.current) {
			setCurrentTime(player.currentTime);
		}
	}, [player.currentTime]);

	if (!player.episode) return null;

	const imageUrl = player.episode.episodeImage || player.episode.podcastImage;

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<div
			className="flex h-full flex-col space-y-4 bg-background px-4 pb-4 pt-4"
			onClick={(e: React.MouseEvent<HTMLDivElement>) => {
				// console.log("Container clicked");
				e.stopPropagation();
			}}
			onTouchStart={(e: React.TouchEvent<HTMLDivElement>) => {
				// console.log("Container touch start");
				e.stopPropagation();
			}}
			onTouchEnd={(e: React.TouchEvent<HTMLDivElement>) => {
				// console.log("Container touch end");
				e.stopPropagation();
			}}
			role="presentation"
		>
			<div
				className="relative mx-auto aspect-square w-full max-w-[280px] rounded-lg bg-muted transition-all duration-300"
				style={{
					transformOrigin: "bottom left",
					animation: isOpen ? "scaleUp 300ms ease forwards" : "none",
				}}
			>
				{imageUrl && (
					<Image
						src={imageUrl}
						alt={player.episode.title}
						fill
						className="rounded-lg object-cover"
						style={{
							animation: isOpen ? "fadeIn 300ms ease forwards" : "none",
						}}
					/>
				)}
			</div>
			<div className="space-y-1 text-center">
				<h3 className="text-lg font-semibold text-foreground line-clamp-3">
					{player.episode.title}
				</h3>
				<p className="text-sm text-muted-foreground line-clamp-1">
					{player.episode.podcastTitle}
				</p>
			</div>
			<div className="space-y-2">
				<div className="relative w-full touch-none select-none">
					<div className="h-6 flex items-center">
						<Slider
							label="Current time"
							maxValue={player.duration}
							step={1}
							value={[currentTime ?? player.currentTime]}
							onChange={([value]) => {
								setCurrentTime(value);
							}}
							onChangeEnd={([value]) => {
								isDraggingRef.current = false;
								setCurrentTime(value);
								player.seek(value);
								if (wasPlayingRef.current) {
									player.play();
								}
							}}
							onChangeStart={() => {
								isDraggingRef.current = true;
								wasPlayingRef.current = player.playing;
								player.pause();
							}}
							numberFormatter={
								{ format: formatTimelineTime } as Intl.NumberFormat
							}
						/>
					</div>
				</div>
				<div className="flex justify-between px-3 text-sm text-muted-foreground">
					<div>{formatTimelineTime(currentTime ?? player.currentTime)}</div>
					<div>{formatTimelineTime(player.duration)}</div>
				</div>
			</div>
			<div className="space-y-4">
				<div className="flex items-center justify-center gap-12">
					<Button
						variant="ghost"
						size="icon"
						onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
							e.stopPropagation();
							player.seekBy(-15);
						}}
						onTouchEnd={(e: React.TouchEvent<HTMLButtonElement>) => {
							e.preventDefault();
							e.stopPropagation();
							player.seekBy(-15);
						}}
						aria-label="Rewind 15 seconds"
					>
						<RewindButton player={player} size="base" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-primary hover:bg-primary/90 active:bg-primary focus:outline-none text-primary-foreground"
						onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
							console.log("Play/Pause button clicked", {
								isPlaying: player.playing,
							});
							e.stopPropagation();
							player.toggle();
						}}
						onTouchEnd={(e: React.TouchEvent<HTMLButtonElement>) => {
							e.preventDefault();
							e.stopPropagation();
							player.toggle();
						}}
						aria-label={player.playing ? "Pause" : "Play"}
					>
						<PlayButton player={player} size="lg" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
							e.stopPropagation();
							player.seekBy(15);
						}}
						onTouchEnd={(e: React.TouchEvent<HTMLButtonElement>) => {
							e.preventDefault();
							e.stopPropagation();
							player.seekBy(15);
						}}
						aria-label="Forward 15 seconds"
					>
						<ForwardButton player={player} size="base" />
					</Button>
				</div>
				<div className="flex justify-between px-4">
					<MuteButton
						player={player}
						size="icon"
						variant="ghost"
						className="group relative rounded-md focus:outline-none"
						onClick={(e) => {
							e.stopPropagation();
							player.toggleMute();
						}}
						onTouchEnd={(e) => {
							e.preventDefault();
							e.stopPropagation();
							player.toggleMute();
						}}
						aria-label={player.muted ? "Unmute" : "Mute"}
					/>
					<PlaybackRateButton
						player={player}
						className="group relative rounded-md focus:outline-none text-foreground hover:text-foreground/90"
					/>
				</div>
			</div>
		</div>
	);
}
