import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioPlayer, type AudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useVideoPlayer } from 'expo-video';
import type { MediaItemModel, PlayerState, RepeatMode } from './types';

const EMPTY: PlayerState = {
  current: null,
  queue: [],
  index: -1,
  isPlaying: false,
  positionMs: 0,
  durationMs: 0,
  bufferedMs: 0,
  rate: 1,
  volume: 1,
  repeat: 'off',
  shuffle: false,
};

function ms(seconds: number | undefined): number {
  return Math.max(0, Math.round((seconds ?? 0) * 1000));
}

export function useMediaPlayer(initialQueue: MediaItemModel[] = []) {
  const [state, setState] = useState<PlayerState>(() => ({
    ...EMPTY,
    queue: initialQueue,
    current: initialQueue[0] ?? null,
    index: initialQueue.length ? 0 : -1,
  }));
  const audioRef = useRef<AudioPlayer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const video = useVideoPlayer(state.current?.kind === 'video' ? state.current.uri : null, (player) => {
    player.timeUpdateEventInterval = 0.25;
  });

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true });
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      audioRef.current?.remove();
      audioRef.current = null;
    };
  }, []);

  const startPositionUpdates = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (state.current?.kind === 'audio' && audioRef.current) {
        setState((prev) => ({
          ...prev,
          positionMs: ms(audioRef.current?.currentTime),
          durationMs: ms(audioRef.current?.duration),
          bufferedMs: ms(audioRef.current?.bufferedPosition),
          isPlaying: Boolean(audioRef.current?.playing),
        }));
      }
      if (state.current?.kind === 'video') {
        setState((prev) => ({
          ...prev,
          positionMs: ms(video.currentTime),
          durationMs: ms(video.duration),
          isPlaying: Boolean(video.playing),
        }));
      }
    }, 250);
  }, [state.current?.kind, video]);

  const load = useCallback(async (item: MediaItemModel, autoplay = true) => {
    audioRef.current?.remove();
    audioRef.current = null;

    const index = state.queue.findIndex((entry) => entry.id === item.id);
    setState((prev) => ({
      ...prev,
      current: item,
      index: index >= 0 ? index : prev.index,
      positionMs: 0,
      durationMs: item.durationMs ?? 0,
      bufferedMs: 0,
      isPlaying: false,
    }));

    if (item.kind === 'audio') {
      const player = createAudioPlayer(item.uri);
      player.volume = state.volume;
      player.playbackRate = state.rate;
      audioRef.current = player;
      if (autoplay) player.play();
    } else if (autoplay) {
      video.play();
    }
    startPositionUpdates();
  }, [startPositionUpdates, state.queue, state.rate, state.volume, video]);

  const play = useCallback(() => {
    if (!state.current) return;
    if (state.current.kind === 'audio') audioRef.current?.play();
    else video.play();
    setState((prev) => ({ ...prev, isPlaying: true }));
  }, [state.current, video]);

  const pause = useCallback(() => {
    if (!state.current) return;
    if (state.current.kind === 'audio') audioRef.current?.pause();
    else video.pause();
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, [state.current, video]);

  const seekTo = useCallback((positionMs: number) => {
    const seconds = Math.max(0, positionMs) / 1000;
    if (state.current?.kind === 'audio' && audioRef.current) audioRef.current.seekTo(seconds);
    if (state.current?.kind === 'video') video.currentTime = seconds;
    setState((prev) => ({ ...prev, positionMs: Math.max(0, positionMs) }));
  }, [state.current?.kind, video]);

  const setRate = useCallback((rate: number) => {
    const safe = Math.min(3, Math.max(0.25, rate));
    if (audioRef.current) audioRef.current.playbackRate = safe;
    video.playbackRate = safe;
    setState((prev) => ({ ...prev, rate: safe }));
  }, [video]);

  const setVolume = useCallback((volume: number) => {
    const safe = Math.min(1, Math.max(0, volume));
    if (audioRef.current) audioRef.current.volume = safe;
    video.volume = safe;
    setState((prev) => ({ ...prev, volume: safe }));
  }, [video]);

  const setRepeat = useCallback((repeat: RepeatMode) => setState((prev) => ({ ...prev, repeat })), []);
  const setShuffle = useCallback((shuffle: boolean) => setState((prev) => ({ ...prev, shuffle })), []);

  const next = useCallback(() => {
    if (!state.queue.length) return;
    let nextIndex: number;
    if (state.shuffle && state.queue.length > 1) {
      do nextIndex = Math.floor(Math.random() * state.queue.length); while (nextIndex === state.index);
    } else {
      nextIndex = state.index + 1;
    }

    if (nextIndex >= state.queue.length) {
      if (state.repeat === 'all') nextIndex = 0;
      else {
        pause();
        return;
      }
    }
    void load(state.queue[nextIndex], true);
  }, [load, pause, state.index, state.queue, state.repeat, state.shuffle]);

  const previous = useCallback(() => {
    if (!state.queue.length) return;
    if (state.positionMs > 5000) {
      seekTo(0);
      return;
    }
    const previousIndex = state.index <= 0 ? state.queue.length - 1 : state.index - 1;
    void load(state.queue[previousIndex], true);
  }, [load, seekTo, state.index, state.positionMs, state.queue]);

  const setQueue = useCallback((queue: MediaItemModel[], startIndex = 0) => {
    const safeIndex = queue.length ? Math.max(0, Math.min(startIndex, queue.length - 1)) : -1;
    setState((prev) => ({ ...prev, queue, index: safeIndex, current: queue[safeIndex] ?? null }));
  }, []);

  const toggle = useCallback(() => {
    if (state.isPlaying) pause();
    else play();
  }, [pause, play, state.isPlaying]);

  return {
    state,
    current: state.current,
    load,
    play,
    pause,
    toggle,
    next,
    previous,
    seekTo,
    setRate,
    setVolume,
    setRepeat,
    setShuffle,
    setQueue,
    video,
  };
}
