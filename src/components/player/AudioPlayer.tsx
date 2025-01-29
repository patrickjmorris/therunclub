"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Drawer } from "vaul";

import { useAudioPlayer } from "@/components/AudioProvider";
import { ForwardButton } from "@/components/player/ForwardButton";
import { MuteButton } from "@/components/player/MuteButton";
import { PlaybackRateButton } from "@/components/player/PlaybackRateButton";
import { PlayButton } from "@/components/player/PlayButton";
import { RewindButton } from "@/components/player/RewindButton";
import { Slider } from "@/components/player/Slider";

function formatTime(totalSeconds: number): [number, number, number] {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const remainingSeconds = totalSeconds % 60;
	return [hours, minutes, remainingSeconds];
}

function formatTimelineTime(seconds: number): string {
	const [hours, minutes, remainingSeconds] = formatTime(seconds);
	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
			.toString()
			.padStart(2, "0")}`;
	}
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function AccessibleButton({
	onClick,
	children,
}: {
	onClick: (e: React.MouseEvent | React.KeyboardEvent) => void;
	children: React.ReactNode;
}) {
	return (
		<div
			role="button"
			tabIndex={0}
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") onClick(e);
			}}
			className="focus:outline-none"
		>
			{children}
		</div>
	);
}

function ExpandedPlayer({
	player,
	miniPlayerRef,
	isOpen,
}: {
	player: ReturnType<typeof useAudioPlayer>;
	miniPlayerRef: React.RefObject<HTMLDivElement | null>;
	isOpen: boolean;
}) {
	const [currentTime, setCurrentTime] = useState<number | null>(null);
	const wasPlayingRef = useRef(false);

	if (!player.episode) return null;

	return (
		<div className="flex h-full flex-col space-y-4 bg-background px-4 pb-4 pt-4">
			<div
				className="relative mx-auto aspect-square w-full max-w-[280px] rounded-lg bg-slate-50 transition-all duration-300"
				style={{
					transformOrigin: "bottom left",
					animation: isOpen ? "scaleUp 300ms ease forwards" : "none",
				}}
			>
				{player.episode.image && (
					/* eslint-disable-next-line @next/next/no-img-element */
					<img
						src={player.episode.image}
						alt={player.episode.title}
						className="h-full w-full rounded-lg object-cover"
						data-vaul-draggable={false}
						style={{
							animation: isOpen ? "fadeIn 300ms ease forwards" : "none",
						}}
					/>
				)}
			</div>
			<div className="space-y-1 text-center">
				<h3 className="text-lg font-semibold text-foreground">
					{player.episode.title}
				</h3>
				<p className="text-sm text-muted-foreground">
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
							onChange={([value]) => setCurrentTime(value)}
							onChangeEnd={([value]) => {
								player.seek(value);
								if (wasPlayingRef.current) {
									player.play();
								}
							}}
							onChangeStart={() => {
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
				<div className="flex justify-center space-x-6">
					<AccessibleButton onClick={(e) => e.stopPropagation()}>
						<RewindButton player={player} />
					</AccessibleButton>
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900">
						<AccessibleButton onClick={(e) => e.stopPropagation()}>
							<PlayButton player={player} />
						</AccessibleButton>
					</div>
					<AccessibleButton onClick={(e) => e.stopPropagation()}>
						<ForwardButton player={player} />
					</AccessibleButton>
				</div>
				<div className="flex justify-between px-4">
					<MuteButton player={player} />
					<PlaybackRateButton player={player} />
				</div>
			</div>
		</div>
	);
}

export function AudioPlayer() {
	const player = useAudioPlayer();
	const wasPlayingRef = useRef(false);
	const miniPlayerRef = useRef<HTMLDivElement>(null);
	const [currentTime, setCurrentTime] = useState<number | null>(
		player.currentTime,
	);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		setCurrentTime(null);
	}, []);

	useEffect(() => {
		if (!player.episode) return;

		if ("mediaSession" in navigator && player.episode) {
			navigator.mediaSession.metadata = new MediaMetadata({
				title: player.episode.title,
				artist: player.episode.podcastAuthor ?? "",
				album: player.episode.podcastTitle,
				artwork: [
					{
						src: player.episode.image || player.episode.podcastImage || "",
						sizes: "96x96",
						type: "image/jpeg",
					},
					{
						src: player.episode.image || player.episode.podcastImage || "",
						sizes: "128x128",
						type: "image/jpeg",
					},
					{
						src: player.episode.image || player.episode.podcastImage || "",
						sizes: "192x192",
						type: "image/jpeg",
					},
					{
						src: player.episode.image || player.episode.podcastImage || "",
						sizes: "256x256",
						type: "image/jpeg",
					},
					{
						src: player.episode.image || player.episode.podcastImage || "",
						sizes: "384x384",
						type: "image/jpeg",
					},
					{
						src: player.episode.image || player.episode.podcastImage || "",
						sizes: "512x512",
						type: "image/jpeg",
					},
				],
			});

			// Update playback state
			navigator.mediaSession.playbackState = player.playing
				? "playing"
				: "paused";

			const updatePositionState = () => {
				if (navigator.mediaSession && player.duration) {
					navigator.mediaSession.setPositionState({
						duration: player.duration,
						playbackRate: 1,
						position: player.currentTime,
					});
				}
			};

			// Update position state initially
			updatePositionState();

			// Set up action handlers
			navigator.mediaSession.setActionHandler("play", () => {
				player.play();
				navigator.mediaSession.playbackState = "playing";
			});
			navigator.mediaSession.setActionHandler("pause", () => {
				player.pause();
				navigator.mediaSession.playbackState = "paused";
			});
			navigator.mediaSession.setActionHandler("seekbackward", () => {
				player.seekBy(-10);
				updatePositionState();
			});
			navigator.mediaSession.setActionHandler("seekforward", () => {
				player.seekBy(10);
				updatePositionState();
			});
			navigator.mediaSession.setActionHandler("seekto", (details) => {
				if (details.seekTime !== undefined && !Number.isNaN(details.seekTime)) {
					player.seek(details.seekTime);
					updatePositionState();
				}
			});
			navigator.mediaSession.setActionHandler("stop", () => {
				player.pause();
				player.seek(0);
				navigator.mediaSession.playbackState = "paused";
			});
		}
	}, [
		player.episode,
		player.play,
		player.pause,
		player.seek,
		player.seekBy,
		player.duration,
		player.currentTime,
		player.playing,
	]);

	if (!player.episode) {
		return null;
	}

	return (
		<>
			<style jsx global>{`
				@keyframes scaleUp {
					from {
						transform: scale(0.2) translateY(50px);
						opacity: 0;
					}
					to {
						transform: scale(1) translateY(0);
						opacity: 1;
					}
				}

				@keyframes fadeIn {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}
			`}</style>

			{/* Desktop Player */}
			<div className="fixed bottom-6 right-6 z-50 hidden md:block">
				<div className="flex items-center gap-4 rounded-xl bg-background p-3 shadow-xl ring-1 ring-border">
					<div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
						{player.episode.image && (
							/* eslint-disable-next-line @next/next/no-img-element */
							<img
								src={player.episode.image}
								alt={player.episode.title}
								className="h-full w-full rounded-lg object-cover"
							/>
						)}
					</div>
					<div
						className="flex min-w-0 flex-col gap-0.5"
						style={{ maxWidth: "200px" }}
					>
						<Link
							href={`/podcasts/${player.episode.podcastSlug}/${player.episode.episodeSlug}`}
							className="truncate text-sm font-medium text-foreground hover:text-foreground/90"
							title={player.episode.title}
						>
							{player.episode.title}
						</Link>
						<p className="truncate text-xs text-muted-foreground">
							{player.episode.podcastTitle}
						</p>
					</div>
					<div className="flex items-center gap-4 pl-4">
						<AccessibleButton onClick={(e) => e.stopPropagation()}>
							<RewindButton player={player} />
						</AccessibleButton>
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900">
							<PlayButton player={player} />
						</div>
						<AccessibleButton onClick={(e) => e.stopPropagation()}>
							<ForwardButton player={player} />
						</AccessibleButton>
					</div>
					<div className="flex items-center gap-3 border-l border-slate-200 pl-4">
						<PlaybackRateButton player={player} />
						<MuteButton player={player} />
					</div>
				</div>
			</div>

			{/* Mobile Player with Drawer */}
			<div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
				<Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
					<div className="relative">
						<div
							className="flex items-center gap-4 bg-background/90 px-4 py-4 shadow shadow-border/80 ring-1 ring-border backdrop-blur-sm transition-all duration-300"
							style={{
								transform: isOpen ? "translateY(100%)" : "translateY(0)",
								opacity: isOpen ? 0 : 1,
							}}
						>
							<Drawer.Trigger asChild>
								<div className="flex flex-1 items-center gap-4 cursor-pointer min-w-0">
									<div
										ref={miniPlayerRef}
										className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-muted"
									>
										{player.episode.image && (
											/* eslint-disable-next-line @next/next/no-img-element */
											<img
												src={player.episode.image}
												alt={player.episode.title}
												className="h-full w-full rounded-lg object-cover"
											/>
										)}
									</div>
									<div className="flex flex-1 flex-col gap-1 min-w-0">
										<div className="truncate text-sm font-medium text-foreground">
											{player.episode.title}
										</div>
										<p className="truncate text-xs text-muted-foreground">
											{player.episode.podcastTitle}
										</p>
									</div>
								</div>
							</Drawer.Trigger>
							<div
								data-vaul-no-drag
								className="flex items-center flex-shrink-0"
							>
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900">
									<PlayButton player={player} />
								</div>
							</div>
						</div>
						<Drawer.Portal>
							<Drawer.Overlay className="fixed inset-0 bg-black/40" />
							<Drawer.Content className="fixed inset-x-0 bottom-0 flex flex-col rounded-t-[10px] bg-background">
								<div className="mx-auto mb-2 mt-2 h-1.5 w-12 flex-shrink-0 rounded-full bg-zinc-300" />
								<Drawer.Title className="sr-only">Audio Player</Drawer.Title>
								<ExpandedPlayer
									player={player}
									miniPlayerRef={miniPlayerRef}
									isOpen={isOpen}
								/>
							</Drawer.Content>
						</Drawer.Portal>
					</div>
				</Drawer.Root>
			</div>
		</>
	);
}
