import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useMediaPlayer } from '@/media-player';
import type { MediaItemModel } from '@/media-player';
import type { RadioStation } from './onlineRadioTypes';

type RadioContextValue = {
  station: RadioStation | null;
  favorites: string[];
  player: ReturnType<typeof useMediaPlayer>;
  playStation: (station: RadioStation) => Promise<void>;
  toggleFavorite: (stationId: string) => void;
};

const RadioContext = createContext<RadioContextValue | null>(null);

export function RadioPlayerProvider({ children }: { children: React.ReactNode }) {
  const player = useMediaPlayer();
  const [station, setStation] = useState<RadioStation | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const playStation = useCallback(async (next: RadioStation) => {
    const item: MediaItemModel = {
      id: next.id,
      uri: next.streamUrl,
      title: next.name,
      artist: next.city,
      album: next.language,
      kind: 'audio',
    };
    setStation(next);
    player.setQueue([item], 0);
    await player.load(item, true);
  }, [player]);

  const toggleFavorite = useCallback((stationId: string) => {
    setFavorites((current) => current.includes(stationId) ? current.filter((id) => id !== stationId) : [...current, stationId]);
  }, []);

  const value = useMemo(() => ({ station, favorites, player, playStation, toggleFavorite }), [station, favorites, player, playStation, toggleFavorite]);
  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>;
}

export function useRadioPlayer() {
  const value = useContext(RadioContext);
  if (!value) throw new Error('useRadioPlayer must be used inside RadioPlayerProvider');
  return value;
}
