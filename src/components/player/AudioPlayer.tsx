"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
	Drawer,
	DrawerContent,
	DrawerTrigger,
	DrawerPortal,
	DrawerTitle,
	DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

import { useAudioPlayer } from "@/components/AudioProvider";
import { ForwardButton } from "@/components/player/ForwardButton";
import { MuteButton } from "@/components/player/MuteButton";
import { PlaybackRateButton } from "@/components/player/PlaybackRateButton";
import { PlayButton } from "@/components/player/PlayButton";
import { RewindButton } from "@/components/player/RewindButton";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { ExpandedPlayer } from "@/components/player/ExpandedPlayer";

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
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				onClick(e);
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					e.stopPropagation();
					onClick(e);
				}
			}}
			className="focus:outline-none"
		>
			{children}
		</div>
	);
}

export function AudioPlayer() {
	const player = useAudioPlayer();
	const miniPlayerRef = useRef<HTMLDivElement>(null);
	const [isOpen, setIsOpen] = useState(false);

	// Handle media session
	useEffect(() => {
		if (!player.episode || !("mediaSession" in navigator)) return;

		navigator.mediaSession.metadata = new MediaMetadata({
			title: player.episode.title,
			artist: player.episode.podcastAuthor ?? "",
			album: player.episode.podcastTitle,
			artwork: [
				{
					src: player.episode.image || player.episode.podcastImage || "",
					sizes: "512x512",
					type: "image/jpeg",
				},
			],
		});

		navigator.mediaSession.playbackState = player.playing
			? "playing"
			: "paused";

		const updatePositionState = () => {
			if (player.duration) {
				navigator.mediaSession.setPositionState({
					duration: player.duration,
					playbackRate: 1,
					position: player.currentTime,
				});
			}
		};

		updatePositionState();

		navigator.mediaSession.setActionHandler("play", () => {
			player.play();
			navigator.mediaSession.playbackState = "playing";
		});
		navigator.mediaSession.setActionHandler("pause", () => {
			player.pause();
			navigator.mediaSession.playbackState = "paused";
		});
		navigator.mediaSession.setActionHandler("seekbackward", () => {
			player.seekBy(-15);
			updatePositionState();
		});
		navigator.mediaSession.setActionHandler("seekforward", () => {
			player.seekBy(15);
			updatePositionState();
		});

		return () => {
			navigator.mediaSession.setActionHandler("play", null);
			navigator.mediaSession.setActionHandler("pause", null);
			navigator.mediaSession.setActionHandler("seekbackward", null);
			navigator.mediaSession.setActionHandler("seekforward", null);
		};
	}, [
		player.episode,
		player.playing,
		player.currentTime,
		player.duration,
		player.play,
		player.pause,
		player.seekBy,
	]);

	if (!player.episode) {
		return null;
	}

	return (
		<>
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
					<div className="flex items-center gap-6 pl-4">
						<Button
							variant="ghost"
							size="icon"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								player.seekBy(-15);
							}}
							className="p-0"
						>
							<div className="flex items-center justify-center">
								<RewindButton player={player} />
							</div>
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								player.toggle();
							}}
							className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 active:bg-primary p-0"
						>
							<div className="flex items-center justify-center">
								<PlayButton player={player} size="base" />
							</div>
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								player.seekBy(15);
							}}
							className="p-0"
						>
							<div className="flex items-center justify-center">
								<ForwardButton player={player} />
							</div>
						</Button>
					</div>
					<div className="flex items-center gap-3 border-l border-slate-200 pl-4">
						<PlaybackRateButton player={player} />
						<Button
							variant="ghost"
							size="icon"
							className="group relative rounded-md focus:outline-none"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								player.toggleMute();
							}}
							aria-label={player.muted ? "Unmute" : "Mute"}
						>
							<MuteButton player={player} asChild />
						</Button>
					</div>
				</div>
			</div>

			{/* Mobile Player with Drawer */}
			<div className="md:hidden">
				<Drawer
					open={isOpen}
					onOpenChange={setIsOpen}
					shouldScaleBackground={false}
				>
					<DrawerTrigger asChild>
						<div ref={miniPlayerRef} className="touch-none">
							<MiniPlayer
								player={player}
								isDrawerTrigger
								onPlayPause={(e) => {
									e.stopPropagation();
									player.toggle();
								}}
							/>
						</div>
					</DrawerTrigger>

					<DrawerPortal>
						<DrawerContent className="fixed inset-x-0 bottom-0 z-50">
							<DrawerTitle className="sr-only">Audio Player</DrawerTitle>
							<DrawerDescription className="sr-only">
								Audio Player
							</DrawerDescription>
							<div className="bg-background">
								<div className="mx-auto max-w-2xl">
									<ExpandedPlayer
										player={player}
										miniPlayerRef={miniPlayerRef}
										isOpen={isOpen}
										onClose={() => setIsOpen(false)}
									/>
								</div>
							</div>
						</DrawerContent>
					</DrawerPortal>
				</Drawer>
			</div>
		</>
	);
}
