import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { createAudioPlayer, type AudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { MediaItemModel } from './types';

type PersistentMediaState = {
  current: MediaItemModel | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  queue: MediaItemModel[];
};

type PersistentMediaContextValue = PersistentMediaState & {
  load: (item: MediaItemModel, queue?: MediaItemModel[]) => Promise<void>;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stop: () => void;
  seekTo: (positionMs: number) => void;
  next: () => void;
  previous: () => void;
};

const MediaContext = createContext<PersistentMediaContextValue | null>(null);

export function PersistentMediaProvider({ children }: { children: React.ReactNode }) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [state, setState] = useState<PersistentMediaState>({
    current: null,
    isPlaying: false,
    positionMs: 0,
    durationMs: 0,
    queue: [],
  });

  const clearPlayer = () => {
    playerRef.current?.remove();
    playerRef.current = null;
  };

  const load = async (item: MediaItemModel, queue = state.queue) => {
    clearPlayer();
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers',
    });
    const player = createAudioPlayer({ uri: item.uri }, 250);
    playerRef.current = player;
    player.volume = 1;
    player.addListener('playbackStatusUpdate', () => {
      setState((current) => ({
        ...current,
        isPlaying: player.playing,
        positionMs: player.currentTime * 1000,
        durationMs: Number.isFinite(player.duration) ? player.duration * 1000 : current.durationMs,
      }));
    });
    setState({ current: item, isPlaying: true, positionMs: 0, durationMs: item.durationMs ?? 0, queue });
    player.play();
  };

  const play = () => { playerRef.current?.play(); setState((s) => ({ ...s, isPlaying: true })); };
  const pause = () => { playerRef.current?.pause(); setState((s) => ({ ...s, isPlaying: false })); };
  const toggle = () => (state.isPlaying ? pause() : play());
  const stop = () => { clearPlayer(); setState({ current: null, isPlaying: false, positionMs: 0, durationMs: 0, queue: [] }); };
  const seekTo = (positionMs: number) => { playerRef.current?.seekTo(Math.max(0, positionMs) / 1000); setState((s) => ({ ...s, positionMs: Math.max(0, positionMs) })); };
  const next = () => { const index = state.queue.findIndex((item) => item.id === state.current?.id); const item = index >= 0 ? state.queue[index + 1] : undefined; if (item) void load(item, state.queue); };
  const previous = () => { const index = state.queue.findIndex((item) => item.id === state.current?.id); const item = index > 0 ? state.queue[index - 1] : undefined; if (item) void load(item, state.queue); };

  const value = useMemo(() => ({ ...state, load, play, pause, toggle, stop, seekTo, next, previous }), [state]);
  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

export function usePersistentMedia() {
  const value = useContext(MediaContext);
  if (!value) throw new Error('usePersistentMedia must be used inside PersistentMediaProvider');
  return value;
}
