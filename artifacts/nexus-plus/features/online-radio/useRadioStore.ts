import { useCallback, useState } from 'react';
import { useMediaPlayer } from '@/media-player';
import type { MediaItemModel } from '@/media-player';
import type { RadioStation } from './onlineRadioTypes';

let sharedPlayer: ReturnType<typeof useMediaPlayer> | null = null;
let sharedStation: RadioStation | null = null;
let sharedFavorites: string[] = [];

export function useRadioStore() {
  const player = useMediaPlayer();
  const [, force] = useState(0);
  const forceUpdate = useCallback(() => force((value) => value + 1), []);

  if (!sharedPlayer) sharedPlayer = player;
  const activePlayer = sharedPlayer;

  const playStation = useCallback(async (station: RadioStation) => {
    const item: MediaItemModel = {
      id: station.id,
      uri: station.streamUrl,
      title: station.name,
      artist: station.city,
      album: station.language,
      kind: 'audio',
    };
    sharedStation = station;
    activePlayer.setQueue([item], 0);
    await activePlayer.load(item, true);
    forceUpdate();
  }, [activePlayer, forceUpdate]);

  const toggleFavorite = useCallback((stationId: string) => {
    sharedFavorites = sharedFavorites.includes(stationId)
      ? sharedFavorites.filter((id) => id !== stationId)
      : [...sharedFavorites, stationId];
    forceUpdate();
  }, [forceUpdate]);

  return {
    player: activePlayer,
    station: sharedStation,
    currentStationId: sharedStation?.id ?? null,
    isPlaying: Boolean(activePlayer.state.isPlaying),
    favorites: sharedFavorites,
    playStation,
    toggleFavorite,
  };
}
