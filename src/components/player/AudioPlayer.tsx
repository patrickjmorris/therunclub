"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Drawer } from "vaul";

import { useAudioPlayer } from "@/components/AudioProvider";
import { ForwardButton } from "@/components/player/ForwardButton";
import { MuteButton } from "@/components/player/MuteButton";
import {
	PlaybackRateButton,
	playbackRates,
} from "@/components/player/PlaybackRateButton";
import { PlayButton } from "@/components/player/PlayButton";
import { RewindButton } from "@/components/player/RewindButton";
import { Slider } from "@/components/player/Slider";

// function parseTime(seconds: number) {
// 	const hours = Math.floor(seconds / 3600);
// 	const minutes = Math.floor((seconds - hours * 3600) / 60);
// 	seconds = seconds - hours * 3600 - minutes * 60;
// 	return [hours, minutes, seconds];
// }

function formatHumanTime(seconds: number) {
	const [h, m, s] = formatTime(seconds);
	return `${h} hour${h === 1 ? "" : "s"}, ${m} minute${
		m === 1 ? "" : "s"
	}, ${s} second${s === 1 ? "" : "s"}`;
}

function formatTime(totalSeconds: number): [number, number, number] {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const remainingSeconds = totalSeconds % 60;
	return [hours, minutes, remainingSeconds];
}

function ExpandedPlayer({
	player,
}: { player: ReturnType<typeof useAudioPlayer> }) {
	if (!player.episode) return null;

	return (
		<div className="flex h-full flex-col space-y-6 bg-white px-4 pb-6 pt-4">
			<div className="relative mx-auto aspect-square w-full max-w-[320px] rounded-lg bg-slate-50">
				{player.episode.image && (
					/* eslint-disable-next-line @next/next/no-img-element */
					<img
						src={player.episode.image}
						alt={player.episode.title}
						className="h-full w-full rounded-lg object-cover"
					/>
				)}
			</div>
			<div className="space-y-2 text-center">
				<h3 className="text-lg font-semibold">{player.episode.title}</h3>
				<p className="text-sm text-slate-600">{player.episode.podcastTitle}</p>
			</div>
			<div className="space-y-6">
				<Slider
					label="Current time"
					maxValue={player.duration}
					step={1}
					value={[player.currentTime]}
					onChange={([value]) => player.seek(value)}
					numberFormatter={{ format: formatHumanTime } as Intl.NumberFormat}
				/>
				<div className="flex justify-center space-x-6">
					<RewindButton player={player} />
					<div className="scale-150">
						<PlayButton player={player} />
					</div>
					<ForwardButton player={player} />
				</div>
				<div className="flex justify-between">
					<PlaybackRateButton player={player} />
					<MuteButton player={player} />
				</div>
			</div>
		</div>
	);
}

export function AudioPlayer() {
	const player = useAudioPlayer();
	const wasPlayingRef = useRef(false);
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
		<Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
			<Drawer.Trigger asChild>
				<div className="flex items-center gap-6 bg-white/90 px-4 py-4 shadow shadow-slate-200/80 ring-1 ring-slate-900/5 backdrop-blur-sm md:px-6">
					<div className="hidden md:block">
						<PlayButton player={player} />
					</div>
					<div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 md:hidden">
						{player.episode.image && (
							/* eslint-disable-next-line @next/next/no-img-element */
							<img
								src={player.episode.image}
								alt={player.episode.title}
								className="h-full w-full rounded-lg object-cover"
							/>
						)}
					</div>
					<div className="mb-[env(safe-area-inset-bottom)] flex flex-1 flex-col gap-3 overflow-hidden p-1">
						<Link
							href={`/podcasts/${player.episode.podcastSlug}/${player.episode.episodeSlug}`}
							className="truncate text-center text-sm font-bold leading-6 md:text-left"
							title={player.episode.title}
						>
							{player.episode.title}
						</Link>
						<div className="flex justify-between gap-6">
							<div className="flex items-center md:hidden">
								<MuteButton player={player} />
							</div>
							<div className="flex flex-none items-center gap-4">
								<RewindButton player={player} />
								<div className="md:hidden">
									<PlayButton player={player} />
								</div>
								<ForwardButton player={player} />
							</div>
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
								numberFormatter={
									{ format: formatHumanTime } as Intl.NumberFormat
								}
								onChangeStart={() => {
									wasPlayingRef.current = player.playing;
									player.pause();
								}}
							/>
							<div className="flex items-center gap-4">
								<div className="flex items-center">
									<PlaybackRateButton player={player} />
								</div>
								<div className="hidden items-center md:flex">
									<MuteButton player={player} />
								</div>
							</div>
						</div>
					</div>
				</div>
			</Drawer.Trigger>
			<Drawer.Portal>
				<Drawer.Overlay className="fixed inset-0 bg-black/40" />
				<Drawer.Content className="fixed bottom-0 left-0 right-0 mt-24 flex h-[85vh] flex-col rounded-t-[10px] bg-white">
					<div className="mx-auto mb-2 h-1.5 w-12 flex-shrink-0 rounded-full bg-zinc-300" />
					<ExpandedPlayer player={player} />
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	);
}
