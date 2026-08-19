import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { VideoView } from 'expo-video';
import { scanLocalMedia } from './library';
import { findActiveCue, formatTime, parseSrt } from './subtitles';
import { useMediaPlayer } from './useMediaPlayer';
import type { MediaItemModel, SubtitleCue } from './types';

type Props = {
  initialItems?: MediaItemModel[];
  onBack?: () => void;
};

function IconButton({ label, hint, onPress, text }: { label: string; hint: string; onPress: () => void; text: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Text accessible={false} style={styles.icon}>{text}</Text>
    </Pressable>
  );
}

export function NexusMediaPlayer({ initialItems = [], onBack }: Props) {
  const [library, setLibrary] = useState<MediaItemModel[]>(initialItems);
  const [query, setQuery] = useState('');
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [showQueue, setShowQueue] = useState(true);
  const [aiBusy, setAiBusy] = useState(false);
  const player = useMediaPlayer(library);

  useEffect(() => {
    void (async () => {
      try {
        const result = await scanLocalMedia();
        const merged = [...result.audio, ...result.video];
        setLibrary(merged);
        player.updateQueue(merged);
      } catch (error) {
        console.warn('Nexus media scan failed', error);
      }
    })();
  }, []);

  useEffect(() => {
    const title = player.state.current ? `Playing ${player.state.current.title}` : 'Nexus Media Player';
    void AccessibilityInfo.announceForAccessibility(title);
  }, [player.state.current?.id]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return library;
    return library.filter((item) => [item.title, item.artist, item.album].some((v) => v?.toLowerCase().includes(needle)));
  }, [library, query]);

  const onLoadSrt = useCallback(async (uri: string) => {
    try {
      const response = await fetch(uri);
      setSubtitleCues(parseSrt(await response.text()));
    } catch (error) {
      console.warn('Subtitle load failed', error);
      setSubtitleCues([]);
    }
  }, []);

  const activeCue = findActiveCue(subtitleCues, player.state.positionMs);

  const handleAiAction = useCallback(async () => {
    if (!player.state.current) return;
    setAiBusy(true);
    try {
      // Connect to the project's local AI runtime here. The feature intentionally
      // has no remote AI dependency and does not upload user media.
      await Promise.resolve();
      void AccessibilityInfo.announceForAccessibility('Local AI analysis is ready to connect. No media was uploaded.');
    } finally {
      setAiBusy(false);
    }
  }, [player.state.current]);

  const current = player.state.current;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <IconButton label="Back" hint="Return to the previous screen" onPress={() => onBack?.()} text="‹" />
        <View style={styles.headerTitleWrap}>
          <Text accessibilityRole="header" style={styles.headerTitle}>Nexus Media Player</Text>
          <Text style={styles.headerSubtitle}>{current ? current.kind.toUpperCase() : 'Audio and video'}</Text>
        </View>
        <IconButton label="Refresh local media" hint="Scan the device media library again" onPress={() => { void scanLocalMedia().then((r) => { const merged = [...r.audio, ...r.video]; setLibrary(merged); player.updateQueue(merged); }); }} text="↻" />
      </View>

      {current?.kind === 'video' ? (
        <View style={styles.videoWrap} accessible accessibilityLabel={`Video player for ${current.title}`}>
          <VideoView player={player.videoPlayer} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
          {activeCue ? (
            <View pointerEvents="none" accessible accessibilityLabel={`Subtitle: ${activeCue.text}`} style={styles.subtitleBox}>
              <Text style={styles.subtitleText}>{activeCue.text}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.artworkPanel} accessibilityLabel={current ? `Album artwork for ${current.title}` : 'No media selected'}>
          {current?.artworkUri ? <Image source={{ uri: current.artworkUri }} resizeMode="cover" style={styles.artwork} /> : <Text style={styles.audioGlyph}>♫</Text>}
        </View>
      )}

      <View style={styles.nowPlaying}>
        <Text accessibilityRole="header" numberOfLines={2} style={styles.title}>{current?.title || 'Choose media'}</Text>
        <Text numberOfLines={1} style={styles.meta}>{current?.artist || current?.album || 'Select a track or video from your library'}</Text>
      </View>

      <View accessible accessibilityLabel={`Playback position ${formatTime(player.state.positionMs)} of ${formatTime(player.state.durationMs)}`} style={styles.progressRow}>
        <Text style={styles.time}>{formatTime(player.state.positionMs)}</Text>
        <Pressable
          accessibilityRole="adjustable"
          accessibilityLabel="Playback position"
          accessibilityValue={{ min: 0, max: Math.max(1, player.state.durationMs), now: player.state.positionMs }}
          onPress={() => player.seekTo(Math.min(player.state.durationMs, player.state.positionMs + 10000))}
          style={styles.progressTrack}
        >
          <View style={[styles.progressFill, { width: `${Math.min(100, player.state.durationMs ? (player.state.positionMs / player.state.durationMs) * 100 : 0)}%` }]} />
        </Pressable>
        <Text style={styles.time}>{formatTime(player.state.durationMs)}</Text>
      </View>

      <View style={styles.controls}>
        <IconButton label={player.state.shuffle ? 'Disable shuffle' : 'Enable shuffle'} hint="Toggle randomized queue order" onPress={player.toggleShuffle} text="🔀" />
        <IconButton label="Previous" hint="Play the previous item or restart the current item" onPress={player.previous} text="⏮" />
        <Pressable accessibilityRole="button" accessibilityLabel={player.state.isPlaying ? 'Pause' : 'Play'} accessibilityHint="Toggle playback" onPress={player.togglePlayPause} style={styles.playButton}>
          <Text accessible={false} style={styles.playText}>{player.state.isPlaying ? '❚❚' : '▶'}</Text>
        </Pressable>
        <IconButton label="Next" hint="Play the next item in the queue" onPress={player.next} text="⏭" />
        <IconButton label={`Repeat ${player.state.repeat}`} hint="Cycle repeat mode" onPress={player.cycleRepeat} text="↻" />
      </View>

      <View style={styles.toolRow}>
        <IconButton label="Toggle queue" hint="Show or hide the media queue" onPress={() => setShowQueue((v) => !v)} text="☷" />
        <IconButton label="Playback speed" hint={`Current speed ${player.state.rate} times`} onPress={() => player.setRate(player.state.rate >= 2 ? 0.75 : player.state.rate + 0.25)} text={`${player.state.rate}x`} />
        <IconButton label="Volume down" hint="Reduce volume" onPress={() => player.setVolume(player.state.volume - 0.1)} text="🔉" />
        <IconButton label="Volume up" hint="Increase volume" onPress={() => player.setVolume(player.state.volume + 0.1)} text="🔊" />
        <IconButton label={aiBusy ? 'AI processing' : 'Local AI tools'} hint="Run media analysis using a local AI runtime" onPress={handleAiAction} text="AI" />
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          accessibilityLabel="Search media"
          accessibilityHint="Filter local media by title, artist or album"
          value={query}
          onChangeText={setQuery}
          placeholder="Search media"
          placeholderTextColor="#666"
          style={styles.search}
        />
      </View>

      {showQueue ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          accessibilityRole="list"
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.kind === 'video' ? 'Video' : 'Audio'}: ${item.title}${item.artist ? ` by ${item.artist}` : ''}${index === player.state.index ? ', current item' : ''}`}
              accessibilityHint="Open and play this media item"
              onPress={() => player.load(item, filtered)}
              style={({ pressed }) => [styles.row, item.id === current?.id && styles.selectedRow, pressed && styles.pressed]}
            >
              <View style={styles.thumbnail}>
                {item.artworkUri ? <Image source={{ uri: item.artworkUri }} style={styles.thumbImage} /> : <Text style={styles.thumbGlyph}>{item.kind === 'video' ? '▶' : '♫'}</Text>}
              </View>
              <View style={styles.rowText}>
                <Text numberOfLines={1} style={styles.rowTitle}>{item.title}</Text>
                <Text numberOfLines={1} style={styles.rowMeta}>{item.artist || item.album || item.kind}</Text>
              </View>
              <Text accessible={false} style={styles.duration}>{formatTime(item.durationMs || 0)}</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text accessibilityRole="text" style={styles.empty}>No media found.</Text>}
        />
      ) : null}

      {current?.subtitleTracks?.length ? (
        <View style={styles.subtitleActions}>
          {current.subtitleTracks.map((track) => (
            <Pressable key={track.id} accessibilityRole="button" accessibilityLabel={`Subtitle ${track.label}`} onPress={() => {
              if (track.uri) void onLoadSrt(track.uri);
              else setSubtitleCues(track.cues || []);
              void AccessibilityInfo.announceForAccessibility(`${track.label} selected`);
            }} style={styles.subtitleChip}>
              <Text style={styles.subtitleChipText}>{track.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0f12' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10 },
  headerTitleWrap: { flex: 1, paddingHorizontal: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSubtitle: { color: '#aeb4be', fontSize: 12, marginTop: 2 },
  iconButton: { minWidth: 52, minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  icon: { color: '#fff', fontSize: 22, fontWeight: '700' },
  pressed: { opacity: 0.65 },
  videoWrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', position: 'relative' },
  artworkPanel: { marginHorizontal: 24, aspectRatio: 1, maxHeight: 340, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1b2028' },
  artwork: { width: '100%', height: '100%' },
  audioGlyph: { color: '#8b93a1', fontSize: 90 },
  subtitleBox: { position: 'absolute', bottom: 18, left: 18, right: 18, alignItems: 'center' },
  subtitleText: { color: '#fff', backgroundColor: 'rgba(0,0,0,0.78)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7, textAlign: 'center', fontSize: 17, lineHeight: 24 },
  nowPlaying: { paddingHorizontal: 24, paddingTop: 16 },
  title: { color: '#fff', fontSize: 21, fontWeight: '800' },
  meta: { color: '#aeb4be', fontSize: 15, marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 14 },
  time: { color: '#b7bdc7', fontSize: 12, width: 42, textAlign: 'center' },
  progressTrack: { height: 36, justifyContent: 'center', flex: 1 },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: '#fff' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  playButton: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  playText: { color: '#0d0f12', fontSize: 24, fontWeight: '900' },
  toolRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10, paddingTop: 2 },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 8 },
  search: { minHeight: 48, borderRadius: 14, backgroundColor: '#181c22', color: '#fff', paddingHorizontal: 16, fontSize: 16 },
  list: { paddingHorizontal: 10, paddingBottom: 20 },
  row: { minHeight: 72, borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center' },
  selectedRow: { backgroundColor: '#202733' },
  thumbnail: { width: 52, height: 52, borderRadius: 10, backgroundColor: '#262d37', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%' },
  thumbGlyph: { color: '#aeb4be', fontSize: 20 },
  rowText: { flex: 1, paddingHorizontal: 12 },
  rowTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  rowMeta: { color: '#9ea6b2', fontSize: 13, marginTop: 3 },
  duration: { color: '#9ea6b2', fontSize: 12 },
  empty: { color: '#aeb4be', textAlign: 'center', paddingVertical: 30 },
  subtitleActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
  subtitleChip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: '#202733', justifyContent: 'center' },
  subtitleChipText: { color: '#fff', fontWeight: '700' },
});
