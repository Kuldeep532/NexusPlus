import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

export function useMediaPlayer(initialQueue: MediaItemModel[] = []) {
  const audioRef = useRef<AudioPlayer | null>(null);
  const [state, setState] = useState<PlayerState>(() => ({ ...EMPTY, queue: initialQueue }));
  const current = state.current;

  const videoPlayer = useVideoPlayer(
    current?.kind === 'video' ? { uri: current.uri, contentType: 'auto' } : null,
    (player) => {
      player.timeUpdateEventInterval = 0.25;
    },
  );

  const syncFromNative = useCallback(() => {
    if (!current) return;
    if (current.kind === 'audio') {
      const player = audioRef.current;
      if (!player) return;
      setState((s) => ({
        ...s,
        isPlaying: player.playing,
        positionMs: player.currentTime * 1000,
        durationMs: Number.isFinite(player.duration) ? player.duration * 1000 : s.durationMs,
      }));
      return;
    }
    setState((s) => ({
      ...s,
      isPlaying: videoPlayer.playing,
      positionMs: videoPlayer.currentTime * 1000,
      durationMs: Number.isFinite(videoPlayer.duration) ? videoPlayer.duration * 1000 : s.durationMs,
    }));
  }, [current, videoPlayer]);

  useEffect(() => {
    let cancelled = false;
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers',
    });
    if (!current || current.kind !== 'audio') return;

    const player = createAudioPlayer({ uri: current.uri }, 250);
    audioRef.current = player;
    player.volume = state.volume;
    player.setPlaybackRate(state.rate);
    player.play();
    setState((s) => ({ ...s, isPlaying: true, error: undefined }));

    const subscription = player.addListener('playbackStatusUpdate', () => {
      if (!cancelled) syncFromNative();
      if (player.didJustFinish) void next();
    });

    return () => {
      cancelled = true;
      subscription.remove();
      player.remove();
      audioRef.current = null;
    };
    // Deliberately restart only when the media identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  useEffect(() => {
    if (current?.kind !== 'video') return;
    videoPlayer.play();
  }, [current?.id]);

  const play = useCallback(() => {
    if (!current) return;
    if (current.kind === 'audio') audioRef.current?.play();
    else videoPlayer.play();
    setState((s) => ({ ...s, isPlaying: true }));
  }, [current, videoPlayer]);

  const pause = useCallback(() => {
    if (!current) return;
    if (current.kind === 'audio') audioRef.current?.pause();
    else videoPlayer.pause();
    setState((s) => ({ ...s, isPlaying: false }));
  }, [current, videoPlayer]);

  const togglePlayPause = useCallback(() => {
    if (state.isPlaying) pause();
    else play();
  }, [pause, play, state.isPlaying]);

  const seekTo = useCallback((positionMs: number) => {
    const seconds = Math.max(0, positionMs) / 1000;
    if (current?.kind === 'audio') audioRef.current?.seekTo(seconds);
    if (current?.kind === 'video') videoPlayer.currentTime = seconds;
    setState((s) => ({ ...s, positionMs: Math.max(0, positionMs) }));
  }, [current, videoPlayer]);

  const load = useCallback((item: MediaItemModel, queue = state.queue) => {
    const index = queue.findIndex((candidate) => candidate.id === item.id);
    setState((s) => ({ ...s, current: item, queue, index: index >= 0 ? index : s.index, positionMs: 0, durationMs: item.durationMs ?? 0, error: undefined }));
  }, [state.queue]);

  const next = useCallback(() => {
    if (!state.queue.length) return;
    if (state.repeat === 'one' && current) {
      load(current);
      return;
    }
    const candidates = state.queue.length;
    let nextIndex = state.index + 1;
    if (state.shuffle && candidates > 1) {
      const available = [...Array(candidates).keys()].filter((i) => i !== state.index);
      nextIndex = available[Math.floor(Math.random() * available.length)];
    }
    if (nextIndex >= candidates) {
      if (state.repeat !== 'all') {
        pause();
        return;
      }
      nextIndex = 0;
    }
    load(state.queue[nextIndex]);
  }, [current, load, pause, state.index, state.queue, state.repeat, state.shuffle]);

  const previous = useCallback(() => {
    if (state.positionMs > 3000) {
      seekTo(0);
      return;
    }
    if (!state.queue.length) return;
    const index = state.index <= 0 ? state.queue.length - 1 : state.index - 1;
    load(state.queue[index]);
  }, [load, seekTo, state.index, state.positionMs, state.queue]);

  const setRate = useCallback((rate: number) => {
    const safeRate = Math.max(0.25, Math.min(3, rate));
    audioRef.current?.setPlaybackRate(safeRate);
    videoPlayer.playbackRate = safeRate;
    setState((s) => ({ ...s, rate: safeRate }));
  }, [videoPlayer]);

  const setVolume = useCallback((volume: number) => {
    const safeVolume = Math.max(0, Math.min(1, volume));
    if (audioRef.current) audioRef.current.volume = safeVolume;
    videoPlayer.volume = safeVolume;
    setState((s) => ({ ...s, volume: safeVolume }));
  }, [videoPlayer]);

  const cycleRepeat = useCallback(() => {
    setState((s) => ({ ...s, repeat: ({ off: 'one', one: 'all', all: 'off' } as Record<RepeatMode, RepeatMode>)[s.repeat] }));
  }, []);

  const toggleShuffle = useCallback(() => setState((s) => ({ ...s, shuffle: !s.shuffle })), []);

  const updateQueue = useCallback((queue: MediaItemModel[]) => {
    setState((s) => ({ ...s, queue }));
  }, []);

  useEffect(() => {
    const id = setInterval(syncFromNative, 250);
    return () => clearInterval(id);
  }, [syncFromNative]);

  return useMemo(() => ({
    state,
    videoPlayer,
    load,
    play,
    pause,
    togglePlayPause,
    seekTo,
    next,
    previous,
    setRate,
    setVolume,
    cycleRepeat,
    toggleShuffle,
    updateQueue,
  }), [cycleRepeat, load, next, pause, play, previous, seekTo, setRate, setVolume, state, togglePlayPause, toggleShuffle, updateQueue, videoPlayer]);
}
