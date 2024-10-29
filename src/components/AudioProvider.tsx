"use client";

import { createContext, useContext, useMemo, useReducer, useRef } from "react";

import { type Episode } from "@/db/schema";
import { EpisodeWithPodcast } from "@/types/episodeWithPodcast";

interface PlayerState {
	playing: boolean;
	muted: boolean;
	duration: number;
	currentTime: number;
	episode: EpisodeWithPodcast | null;
}

interface PublicPlayerActions {
	play: (episode?: EpisodeWithPodcast) => void;
	pause: () => void;
	toggle: (episode?: EpisodeWithPodcast) => void;
	seekBy: (amount: number) => void;
	seek: (time: number) => void;
	playbackRate: (rate: number) => void;
	toggleMute: () => void;
	isPlaying: (episode?: EpisodeWithPodcast) => boolean;
}

export type PlayerAPI = PlayerState & PublicPlayerActions;

enum ActionKind {
	SET_META = "SET_META",
	PLAY = "PLAY",
	PAUSE = "PAUSE",
	TOGGLE_MUTE = "TOGGLE_MUTE",
	SET_CURRENT_TIME = "SET_CURRENT_TIME",
	SET_DURATION = "SET_DURATION",
}

type Action =
	| { type: ActionKind.SET_META; payload: EpisodeWithPodcast }
	| { type: ActionKind.PLAY }
	| { type: ActionKind.PAUSE }
	| { type: ActionKind.TOGGLE_MUTE }
	| { type: ActionKind.SET_CURRENT_TIME; payload: number }
	| { type: ActionKind.SET_DURATION; payload: number };

const AudioPlayerContext = createContext<PlayerAPI | null>(null);

function audioReducer(state: PlayerState, action: Action): PlayerState {
	switch (action.type) {
		case ActionKind.SET_META:
			return { ...state, episode: action.payload };
		case ActionKind.PLAY:
			return { ...state, playing: true };
		case ActionKind.PAUSE:
			return { ...state, playing: false };
		case ActionKind.TOGGLE_MUTE:
			return { ...state, muted: !state.muted };
		case ActionKind.SET_CURRENT_TIME:
			return { ...state, currentTime: action.payload };
		case ActionKind.SET_DURATION:
			return { ...state, duration: action.payload };
	}
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
	const [state, dispatch] = useReducer(audioReducer, {
		playing: false,
		muted: false,
		duration: 0,
		currentTime: 0,
		episode: null,
	});
	const playerRef = useRef<React.ElementRef<"audio">>(null);

	const actions = useMemo<PublicPlayerActions>(() => {
		return {
			play(episode) {
				if (episode) {
					dispatch({ type: ActionKind.SET_META, payload: episode });

					if (
						playerRef.current &&
						playerRef.current.currentSrc !== episode.enclosureUrl
					) {
						const playbackRate = playerRef.current.playbackRate;
						playerRef.current.src = episode.enclosureUrl ?? "";
						playerRef.current.load();
						playerRef.current.pause();
						playerRef.current.playbackRate = playbackRate;
						playerRef.current.currentTime = 0;
					}
				}

				playerRef.current?.play();
			},
			pause() {
				playerRef.current?.pause();
			},
			toggle(episode) {
				this.isPlaying(episode) ? actions.pause() : actions.play(episode);
			},
			seekBy(amount) {
				if (playerRef.current) {
					playerRef.current.currentTime += amount;
				}
			},
			seek(time) {
				if (playerRef.current) {
					playerRef.current.currentTime = time;
				}
			},
			playbackRate(rate) {
				if (playerRef.current) {
					playerRef.current.playbackRate = rate;
				}
			},
			toggleMute() {
				dispatch({ type: ActionKind.TOGGLE_MUTE });
			},
			isPlaying(episode) {
				return episode
					? state.playing &&
							playerRef.current?.currentSrc === episode.enclosureUrl
					: state.playing;
			},
		};
	}, [state.playing]);

	const api = useMemo<PlayerAPI>(
		() => ({ ...state, ...actions }),
		[state, actions],
	);

	return (
		<>
			<AudioPlayerContext.Provider value={api}>
				{children}
			</AudioPlayerContext.Provider>
			<audio
				ref={playerRef}
				onPlay={() => dispatch({ type: ActionKind.PLAY })}
				onPause={() => dispatch({ type: ActionKind.PAUSE })}
				onTimeUpdate={(event) => {
					dispatch({
						type: ActionKind.SET_CURRENT_TIME,
						payload: Math.floor(event.currentTarget.currentTime),
					});
				}}
				onDurationChange={(event) => {
					dispatch({
						type: ActionKind.SET_DURATION,
						payload: Math.floor(event.currentTarget.duration),
					});
				}}
				muted={state.muted}
			/>
		</>
	);
}

export function useAudioPlayer(episode?: EpisodeWithPodcast) {
	const player = useContext(AudioPlayerContext);

	return useMemo<PlayerAPI>(
		() => ({
			...player!,
			play() {
				player!.play(episode);
			},
			toggle() {
				player!.toggle(episode);
			},
			get playing() {
				return player!.isPlaying(episode);
			},
		}),
		[player, episode],
	);
}
