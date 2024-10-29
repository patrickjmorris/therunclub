"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useAudioPlayer } from "@/components/AudioProvider";
import { ForwardButton } from "@/components/player/ForwardButton";
import { MuteButton } from "@/components/player/MuteButton";
import { PlaybackRateButton } from "@/components/player/PlaybackRateButton";
import { PlayButton } from "@/components/player/PlayButton";
import { RewindButton } from "@/components/player/RewindButton";
import { Slider } from "@/components/player/Slider";
import { slugify } from "@/lib/utils";
import { FEEDS } from "@/lib/episodes";

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

export function AudioPlayer() {
	const player = useAudioPlayer();

	const wasPlayingRef = useRef(false);

	const [currentTime, setCurrentTime] = useState<number | null>(
		player.currentTime,
	);

	useEffect(() => {
		setCurrentTime(null);
	}, []);

	useEffect(() => {
		if (!player.episode) return;

		if ("mediaSession" in navigator && player.episode) {
			navigator.mediaSession.metadata = new MediaMetadata({
				title: player.episode.podcastTitle,
				artist: player.episode.podcastAuthor ?? "",
				artwork: [
					{
						src: player.episode.image || player.episode.podcastImage || "",
						sizes: "512x512",
						type: "image/jpeg",
					},
				],
			});

			const updatePositionState = () => {
				if (navigator.mediaSession && player.duration) {
					navigator.mediaSession.setPositionState({
						duration: player.duration,
						playbackRate: 1, // Adjust if you implement playback rate changes
						position: player.currentTime,
					});
				}
			};

			navigator.mediaSession.setActionHandler("play", () => player.play());
			navigator.mediaSession.setActionHandler("pause", () => player.pause());
			navigator.mediaSession.setActionHandler("seekbackward", () =>
				player.seekBy(-10),
			);
			navigator.mediaSession.setActionHandler("seekforward", () =>
				player.seekBy(10),
			);
			navigator.mediaSession.setActionHandler("seekto", (details) => {
				if (details.seekTime !== undefined && !Number.isNaN(details.seekTime)) {
					player.seek(details.seekTime);
					updatePositionState();
				}
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
	]);

	if (!player.episode) {
		return null;
	}

	return (
		<div className="flex items-center gap-6 bg-white/90 px-4 py-4 shadow shadow-slate-200/80 ring-1 ring-slate-900/5 backdrop-blur-sm md:px-6">
			<div className="hidden md:block">
				<PlayButton player={player} />
			</div>
			<div className="mb-[env(safe-area-inset-bottom)] flex flex-1 flex-col gap-3 overflow-hidden p-1">
				<Link
					href={`/podcasts/${slugify(player.episode.title)}`}
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
						numberFormatter={{ format: formatHumanTime } as Intl.NumberFormat}
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
	);
}
