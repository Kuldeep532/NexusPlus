import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type EmitterSubscription } from 'react-native';
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
const BACKGROUND_IDLE_CLOSE_MS = 60 * 60 * 1000;

declare global {
  // eslint-disable-next-line no-var
  var NexusMedia?: {
    update?: (title: string, artist: string | null, playing: boolean) => Promise<boolean>;
    stop?: () => Promise<boolean>;
    pause?: () => Promise<boolean>;
    resume?: () => Promise<boolean>;
  };
}

export function PersistentMediaProvider({ children }: { children: React.ReactNode }) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const statusSubscriptionRef = useRef<{ remove: () => void } | null>(null);
  const backgroundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const [state, setState] = useState<PersistentMediaState>({ current: null, isPlaying: false, positionMs: 0, durationMs: 0, queue: [] });

  const clearBackgroundTimer = () => {
    if (backgroundTimerRef.current) {
      clearTimeout(backgroundTimerRef.current);
      backgroundTimerRef.current = null;
    }
  };

  const clearPlayer = () => {
    statusSubscriptionRef.current?.remove();
    statusSubscriptionRef.current = null;
    playerRef.current?.remove();
    playerRef.current = null;
  };

  const stopCompletely = () => {
    clearBackgroundTimer();
    clearPlayer();
    void NexusMedia?.stop?.().catch?.(() => undefined);
    setState({ current: null, isPlaying: false, positionMs: 0, durationMs: 0, queue: [] });
  };

  const scheduleBackgroundCleanup = () => {
    clearBackgroundTimer();
    backgroundTimerRef.current = setTimeout(() => {
      setState((snapshot) => {
        if (snapshot.isPlaying || !snapshot.current || appStateRef.current === 'active') return snapshot;
        clearPlayer();
        void NexusMedia?.stop?.().catch?.(() => undefined);
        return { current: null, isPlaying: false, positionMs: 0, durationMs: 0, queue: [] };
      });
      backgroundTimerRef.current = null;
    }, BACKGROUND_IDLE_CLOSE_MS);
  };

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'mixWithOthers' });
    const subscription: EmitterSubscription = AppState.addEventListener('change', (next) => {
      appStateRef.current = next;
      if (next === 'active') {
        clearBackgroundTimer();
        return;
      }
      if (next === 'background') scheduleBackgroundCleanup();
    });
    return () => {
      subscription.remove();
      clearBackgroundTimer();
      clearPlayer();
    };
  }, []);

  const load = async (item: MediaItemModel, queue = state.queue) => {
    clearBackgroundTimer();
    if (state.current?.id === item.id && playerRef.current) {
      playerRef.current.play();
      setState((s) => ({ ...s, isPlaying: true }));
      return;
    }
    clearPlayer();
    await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'mixWithOthers' });
    const player = createAudioPlayer({ uri: item.uri });
    playerRef.current = player;
    player.volume = 1;
    statusSubscriptionRef.current = player.addListener('playbackStatusUpdate', () => {
      setState((current) => ({ ...current, isPlaying: player.playing, positionMs: player.currentTime * 1000, durationMs: Number.isFinite(player.duration) ? player.duration * 1000 : current.durationMs }));
    });
    setState({ current: item, isPlaying: true, positionMs: 0, durationMs: item.durationMs ?? 0, queue });
    void NexusMedia?.update?.(item.title, item.artist ?? item.album ?? null, true).catch?.(() => undefined);
    player.play();
  };

  const play = () => {
    clearBackgroundTimer();
    playerRef.current?.play();
    void NexusMedia?.resume?.().catch?.(() => undefined);
    setState((s) => ({ ...s, isPlaying: true }));
  };

  const pause = () => {
    playerRef.current?.pause();
    void NexusMedia?.pause?.().catch?.(() => undefined);
    setState((s) => ({ ...s, isPlaying: false }));
    if (appStateRef.current === 'background') scheduleBackgroundCleanup();
  };

  const toggle = () => (state.isPlaying ? pause() : play());

  const stopCompletely = () => {
    clearBackgroundTimer();
    clearPlayer();
    void NexusMedia?.stop?.().catch?.(() => undefined);
    setState({ current: null, isPlaying: false, positionMs: 0, durationMs: 0, queue: [] });
  };

  const seekTo = (positionMs: number) => {
    playerRef.current?.seekTo(Math.max(0, positionMs) / 1000);
    setState((s) => ({ ...s, positionMs: Math.max(0, positionMs) }));
  };

  const next = () => {
    const index = state.queue.findIndex((item) => item.id === state.current?.id);
    const item = index >= 0 ? state.queue[index + 1] : undefined;
    if (item) void load(item, state.queue);
  };

  const previous = () => {
    const index = state.queue.findIndex((item) => item.id === state.current?.id);
    const item = index > 0 ? state.queue[index - 1] : undefined;
    if (item) void load(item, state.queue);
  };

  const value = useMemo(() => ({ ...state, load, play, pause, toggle, stop: stopCompletely, seekTo, next, previous }), [state]);
  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

export function usePersistentMedia() {
  const value = useContext(MediaContext);
  if (!value) throw new Error('usePersistentMedia must be used inside PersistentMediaProvider');
  return value;
}
