import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Alert, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { VideoView } from 'expo-video';
import { scanLocalMedia, buildCollections } from './library';
import { createPlaylist, loadDevicePlaylists } from './playlists';
import { isYouTubeMusicInstalled, openYouTubeMusicSearch, searchYouTubeMusic, handoffYouTubeMusic, type YouTubeMusicSearchResult } from './youtubeMusic';
import { vocalRemoverService } from './vocal-remover/VocalRemoverService';
import { findActiveCue, formatTime, parseSrt } from './subtitles';
import { useMediaPlayer } from './useMediaPlayer';
import type { MediaItemModel, SubtitleCue } from './types';

type Props = { initialItems?: MediaItemModel[]; onBack?: () => void };
type LibraryTab = 'tracks' | 'albums' | 'playlists';
type MediaTab = 'audio' | 'video';
type Screen = 'library' | 'player';

function Button({ label, hint, onPress, text, selected = false }: { label: string; hint?: string; onPress: () => void; text: string; selected?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} onPress={onPress} style={({ pressed }) => [styles.button, selected && styles.selectedButton, pressed && styles.pressed]}>
      <Text accessible={false} style={styles.buttonText}>{text}</Text>
    </Pressable>
  );
}

export function NexusMediaPlayer({ initialItems = [], onBack }: Props) {
  const [library, setLibrary] = useState<MediaItemModel[]>(initialItems);
  const [screen, setScreen] = useState<Screen>('library');
  const [mediaTab, setMediaTab] = useState<MediaTab>('audio');
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('tracks');
  const [query, setQuery] = useState('');
  const [youtubeQuery, setYoutubeQuery] = useState('');
  const [youtubeResults, setYoutubeResults] = useState<YouTubeMusicSearchResult[]>([]);
  const [youtubeInstalled, setYoutubeInstalled] = useState(false);
  const [playlists, setPlaylists] = useState<Awaited<ReturnType<typeof loadDevicePlaylists>>>([]);
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [vocalBusy, setVocalBusy] = useState(false);
  const [vocalProgress, setVocalProgress] = useState(0);
  const [vocalMode, setVocalMode] = useState<'instrumental' | 'vocals'>('instrumental');
  const player = useMediaPlayer(library);

  const refresh = useCallback(async () => {
    const result = await scanLocalMedia();
    const merged = [...result.audio, ...result.video];
    setLibrary(merged);
    player.updateQueue(merged);
    setPlaylists(await loadDevicePlaylists());
  }, [player]);

  useEffect(() => { void refresh(); void isYouTubeMusicInstalled().then(setYoutubeInstalled); }, []);

  useEffect(() => {
    if (player.state.current) void AccessibilityInfo.announceForAccessibility(`Playing ${player.state.current.title}`);
  }, [player.state.current?.id]);

  const audio = useMemo(() => library.filter((item) => item.kind === 'audio'), [library]);
  const video = useMemo(() => library.filter((item) => item.kind === 'video'), [library]);
  const collections = useMemo(() => buildCollections(audio, playlists), [audio, playlists]);
  const visibleTracks = useMemo(() => {
    const source = mediaTab === 'audio' ? audio : video;
    const needle = query.trim().toLowerCase();
    return needle ? source.filter((item) => [item.title, item.artist, item.album].some((v) => v?.toLowerCase().includes(needle))) : source;
  }, [audio, video, mediaTab, query]);
  const current = player.state.current;
  const isRadio = current?.source === 'radio';
  const canVocalRemove = current?.kind === 'audio' && !isRadio && (current.source ?? 'local') === 'local';
  const activeCue = findActiveCue(subtitleCues, player.state.positionMs);

  const loadItem = useCallback((item: MediaItemModel, queue = library) => {
    player.load(item, queue);
    setScreen('player');
  }, [library, player]);

  const runVocalRemoval = useCallback(async () => {
    if (!current || !canVocalRemove) return;
    setVocalBusy(true);
    try {
      const result = await vocalRemoverService.removeVocals(current, { outputStem: vocalMode, quality: 'studio' }, (job) => setVocalProgress(job.progress));
      const derived: MediaItemModel = {
        ...current,
        id: `${current.id}:${result.stem}:${Date.now()}`,
        uri: result.outputUri,
        title: `${current.title} — ${result.stem === 'instrumental' ? 'Instrumental' : 'Vocals'}`,
        source: 'local',
      };
      loadItem(derived, [derived]);
      void AccessibilityInfo.announceForAccessibility('Vocal separation completed');
    } catch (error) {
      Alert.alert('Vocal Remover', error instanceof Error ? error.message : 'Vocal separation failed.');
    } finally {
      setVocalBusy(false);
      setVocalProgress(0);
    }
  }, [canVocalRemove, current, loadItem, vocalMode]);

  const onLoadSrt = useCallback(async (uri: string) => {
    try { setSubtitleCues(parseSrt(await (await fetch(uri)).text())); } catch { setSubtitleCues([]); }
  }, []);

  const searchYT = useCallback(async () => {
    setYoutubeResults(await searchYouTubeMusic(youtubeQuery));
  }, [youtubeQuery]);

  if (screen === 'player') {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Button label="Back to media library" onPress={() => setScreen('library')} text="‹" />
          <View style={styles.headerText}><Text accessibilityRole="header" style={styles.title}>Now Playing</Text><Text style={styles.muted}>{current?.source === 'radio' ? 'Radio' : current?.kind?.toUpperCase() || 'Media'}</Text></View>
        </View>
        {current?.kind === 'video' ? (
          <View style={styles.video}><VideoView player={player.videoPlayer} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />{activeCue ? <View style={styles.subtitle}><Text style={styles.subtitleText}>{activeCue.text}</Text></View> : null}</View>
        ) : <View style={styles.artwork}>{current?.artworkUri ? <Image source={{ uri: current.artworkUri }} style={styles.artworkImage} /> : <Text style={styles.glyph}>♫</Text>}</View>}
        <View style={styles.nowPlaying}><Text accessibilityRole="header" numberOfLines={2} style={styles.trackTitle}>{current?.title || 'Nothing playing'}</Text><Text style={styles.muted}>{current?.artist || current?.album || ''}</Text></View>

        {!isRadio ? (
          <View style={styles.progressRow}><Text style={styles.time}>{formatTime(player.state.positionMs)}</Text><Pressable accessibilityRole="adjustable" accessibilityLabel="Playback position" accessibilityValue={{ min: 0, max: Math.max(1, player.state.durationMs), now: player.state.positionMs }} onPress={() => player.seekTo(Math.min(player.state.durationMs, player.state.positionMs + 10000))} style={styles.progress}><View style={[styles.progressFill, { width: `${player.state.durationMs ? Math.min(100, player.state.positionMs / player.state.durationMs * 100) : 0}%` }]} /></Pressable><Text style={styles.time}>{formatTime(player.state.durationMs)}</Text></View>
        ) : <Text accessibilityRole="text" style={styles.live}>LIVE RADIO · SEEKING DISABLED</Text>}

        <View style={styles.controls}>
          {!isRadio ? <Button label="Previous" hint="Play previous track" onPress={player.previous} text="⏮" /> : null}
          <Button label={player.state.isPlaying ? 'Pause' : 'Play'} onPress={player.togglePlayPause} text={player.state.isPlaying ? '❚❚' : '▶'} selected />
          {!isRadio ? <Button label="Next" hint="Play next track" onPress={player.next} text="⏭" /> : null}
        </View>
        <View style={styles.controls}><Button label="Shuffle" onPress={player.toggleShuffle} text="🔀" selected={player.state.shuffle} /><Button label="Repeat" onPress={player.cycleRepeat} text="↻" /><Button label="Volume down" onPress={() => player.setVolume(player.state.volume - .1)} text="🔉" /><Button label="Volume up" onPress={() => player.setVolume(player.state.volume + .1)} text="🔊" /></View>

        {canVocalRemove ? (
          <View style={styles.vocalCard} accessible accessibilityLabel="Vocal Remover">
            <Text style={styles.sectionTitle}>Vocal Remover</Text>
            <Text style={styles.muted}>AI separation runs through the modular on-device engine when installed.</Text>
            <View style={styles.rowButtons}><Button label="Create instrumental" onPress={() => setVocalMode('instrumental')} text="Instrumental" selected={vocalMode === 'instrumental'} /><Button label="Extract vocals" onPress={() => setVocalMode('vocals')} text="Vocals" selected={vocalMode === 'vocals'} /><Button label={vocalBusy ? 'Processing' : 'Remove vocals'} onPress={() => { void runVocalRemoval(); }} text={vocalBusy ? `${Math.round(vocalProgress * 100)}%` : 'Process'} /></View>
          </View>
        ) : null}

        {current?.subtitleTracks?.length ? <View style={styles.rowButtons}>{current.subtitleTracks.map((track) => <Button key={track.id} label={`Subtitle ${track.label}`} onPress={() => { if (track.uri) void onLoadSrt(track.uri); else setSubtitleCues(track.cues || []); }} text={track.label} />)}</View> : null}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}><Button label="Back" onPress={() => onBack?.()} text="‹" /><View style={styles.headerText}><Text accessibilityRole="header" style={styles.title}>Nexus Media</Text><Text style={styles.muted}>Library and player</Text></View><Button label="Refresh media" onPress={() => { void refresh(); }} text="↻" /></View>
      <View style={styles.tabs}><Button label="Audio" onPress={() => setMediaTab('audio')} text="Audio" selected={mediaTab === 'audio'} /><Button label="Videos" onPress={() => setMediaTab('video')} text="Videos" selected={mediaTab === 'video'} /></View>
      {mediaTab === 'audio' ? <View style={styles.tabs}><Button label="Tracks" onPress={() => setLibraryTab('tracks')} text="Tracks" selected={libraryTab === 'tracks'} /><Button label="Albums" onPress={() => setLibraryTab('albums')} text="Albums" selected={libraryTab === 'albums'} /><Button label="Playlists" onPress={() => setLibraryTab('playlists')} text="Playlists" selected={libraryTab === 'playlists'} /></View> : null}
      <View style={styles.searchWrap}><TextInput accessibilityLabel="Search local media" value={query} onChangeText={setQuery} placeholder="Search device media" placeholderTextColor="#7f8794" style={styles.search} /></View>

      {mediaTab === 'audio' && youtubeInstalled ? <View style={styles.youtubeCard}><Text style={styles.sectionTitle}>YouTube Music</Text><View style={styles.rowButtons}><TextInput accessibilityLabel="YouTube Music search" value={youtubeQuery} onChangeText={setYoutubeQuery} placeholder="Search YouTube Music" placeholderTextColor="#7f8794" style={styles.searchSmall} /><Button label="Search YouTube Music" onPress={() => { void searchYT(); }} text="Search" /></View>{youtubeResults.map((result) => <Pressable key={result.uri} accessibilityRole="button" accessibilityLabel={`YouTube Music result ${result.title}`} onPress={() => { void handoffYouTubeMusic(result.uri); }} style={styles.ytResult}><Text style={styles.rowTitle}>{result.title}</Text><Text style={styles.muted}>Open in YouTube Music</Text></Pressable>)}<Button label="Open YouTube Music search" onPress={() => { void openYouTubeMusicSearch(youtubeQuery); }} text="Open in YouTube Music" /></View> : null}

      {mediaTab === 'audio' && libraryTab === 'albums' ? <FlatList data={collections.albums} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`Album ${item.title}`} onPress={() => { setLibraryTab('tracks'); setQuery(item.title); }} style={styles.album}><Text style={styles.rowTitle}>{item.title}</Text><Text style={styles.muted}>{item.artist || 'Unknown artist'} · {item.trackIds.length} tracks</Text></Pressable>} /> : null}
      {mediaTab === 'audio' && libraryTab === 'playlists' ? <View style={styles.list}><Button label="Create playlist" onPress={() => Alert.prompt?.('New playlist', 'Enter a playlist name') ?? Alert.alert('Create playlist', 'Use the native playlist bridge to create playlists.')} text="＋ Create playlist" />{playlists.map((playlist) => <Pressable key={playlist.id} accessibilityRole="button" accessibilityLabel={`Playlist ${playlist.name}`} style={styles.album}><Text style={styles.rowTitle}>{playlist.name}</Text><Text style={styles.muted}>{playlist.itemIds.length} tracks</Text></Pressable>)}</View> : null}
      {(mediaTab === 'video' || libraryTab === 'tracks') ? <FlatList data={visibleTracks} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`${item.kind === 'video' ? 'Video' : 'Audio'} ${item.title}`} onPress={() => loadItem(item, visibleTracks)} style={styles.row}><View style={styles.thumbnail}>{item.artworkUri ? <Image source={{ uri: item.artworkUri }} style={styles.thumbImage} /> : <Text style={styles.glyphSmall}>{item.kind === 'video' ? '▶' : '♫'}</Text>}</View><View style={styles.rowText}><Text numberOfLines={1} style={styles.rowTitle}>{item.title}</Text><Text numberOfLines={1} style={styles.muted}>{item.artist || item.album || item.kind}</Text></View><Text style={styles.muted}>{formatTime(item.durationMs || 0)}</Text></Pressable>} ListEmptyComponent={<Text style={styles.empty}>No media found.</Text>} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0f12' }, header: { flexDirection: 'row', alignItems: 'center', padding: 12 }, headerText: { flex: 1, paddingHorizontal: 8 }, title: { color: '#fff', fontSize: 21, fontWeight: '800' }, muted: { color: '#aeb4be', fontSize: 13, marginTop: 3 }, button: { minWidth: 52, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }, selectedButton: { backgroundColor: '#26303d' }, buttonText: { color: '#fff', fontWeight: '700' }, pressed: { opacity: .65 }, tabs: { flexDirection: 'row', paddingHorizontal: 8, gap: 4 }, searchWrap: { padding: 12 }, search: { minHeight: 48, borderRadius: 14, backgroundColor: '#181c22', color: '#fff', paddingHorizontal: 16, fontSize: 16 }, searchSmall: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: '#181c22', color: '#fff', paddingHorizontal: 12 }, list: { padding: 10, paddingBottom: 30 }, row: { minHeight: 72, borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center' }, rowText: { flex: 1, paddingHorizontal: 12 }, rowTitle: { color: '#fff', fontSize: 15, fontWeight: '700' }, thumbnail: { width: 52, height: 52, borderRadius: 10, backgroundColor: '#262d37', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, thumbImage: { width: '100%', height: '100%' }, glyph: { color: '#aeb4be', fontSize: 90 }, glyphSmall: { color: '#aeb4be', fontSize: 20 }, video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }, subtitle: { position: 'absolute', bottom: 16, left: 16, right: 16, alignItems: 'center' }, subtitleText: { color: '#fff', backgroundColor: '#000c', padding: 8, borderRadius: 7, fontSize: 16 }, artwork: { margin: 24, aspectRatio: 1, maxHeight: 340, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1b2028', alignItems: 'center', justifyContent: 'center' }, artworkImage: { width: '100%', height: '100%' }, nowPlaying: { paddingHorizontal: 24, paddingTop: 8 }, trackTitle: { color: '#fff', fontSize: 21, fontWeight: '800' }, progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 18 }, time: { color: '#aeb4be', width: 44, textAlign: 'center' }, progress: { flex: 1, height: 36, justifyContent: 'center' }, progressFill: { height: 5, backgroundColor: '#fff', borderRadius: 3 }, controls: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 4 }, live: { textAlign: 'center', color: '#e4e7ec', fontSize: 12, padding: 12 }, vocalCard: { margin: 14, padding: 14, borderRadius: 18, backgroundColor: '#181c22' }, sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 5 }, rowButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center' }, youtubeCard: { marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 18, backgroundColor: '#181c22' }, ytResult: { paddingVertical: 10 }, album: { padding: 16, marginBottom: 8, borderRadius: 14, backgroundColor: '#181c22' }, empty: { color: '#aeb4be', textAlign: 'center', padding: 30 },
});
