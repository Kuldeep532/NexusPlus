import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ReturnType } from 'react';
import type { MediaItemModel, RepeatMode } from './types';

function formatTime(valueMs: number): string {
  const total = Math.max(0, Math.floor(valueMs / 1000));
  const seconds = total % 60;
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function Button({ label, icon, onPress, selected }: { label: string; icon: React.ComponentProps<typeof Feather>['name']; onPress: () => void; selected?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected !== undefined ? { selected } : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, selected && styles.selectedButton, pressed && styles.pressed]}
    >
      <Feather name={icon} size={21} color="currentColor" />
    </Pressable>
  );
}

export function NexusMediaPlayer({ player }: { player: ReturnType<any> }) {
  const state = player.state;
  const current = state.current as MediaItemModel | null;
  const progress = state.durationMs > 0 ? Math.min(1, state.positionMs / state.durationMs) : 0;
  const activeSubtitle = useMemo(() => current?.subtitles?.find((cue) => state.positionMs >= cue.startMs && state.positionMs <= cue.endMs)?.text ?? '', [current?.subtitles, state.positionMs]);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View accessibilityRole="header" style={styles.header}>
          <View style={styles.badge}><MaterialCommunityIcons name={current?.kind === 'video' ? 'video-outline' : 'music-note-outline'} size={18} color="#FFFFFF" /></View>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>NEXUS MEDIA</Text>
            <Text style={styles.title}>Audio and Video Player</Text>
          </View>
        </View>

        {current?.kind === 'video' ? (
          <View style={styles.videoPlaceholder} accessibilityLabel={`Video area for ${current.title}`}>
            <MaterialCommunityIcons name="play-circle-outline" size={64} color="#FFFFFF" />
            {activeSubtitle ? <Text accessibilityLiveRegion="polite" style={styles.subtitle}>{activeSubtitle}</Text> : null}
          </View>
        ) : (
          <View style={styles.artworkPlaceholder} accessibilityLabel={current ? `Audio artwork for ${current.title}` : 'No audio selected'}>
            <MaterialCommunityIcons name="music-box-multiple-outline" size={72} color="#FFFFFF" />
          </View>
        )}

        <View style={styles.nowPlaying}>
          <Text style={styles.currentTitle} numberOfLines={2}>{current?.title ?? 'Select media from your library'}</Text>
          <Text style={styles.currentMeta} numberOfLines={1}>{current?.artist ?? 'Nexus Media Player'}</Text>
        </View>

        <View accessibilityLabel={`Playback progress ${formatTime(state.positionMs)} of ${formatTime(state.durationMs)}`} style={styles.progressArea}>
          <View style={styles.track}><View style={[styles.fill, { width: `${progress * 100}%` }]} /></View>
          <View style={styles.times}><Text style={styles.time}>{formatTime(state.positionMs)}</Text><Text style={styles.time}>{formatTime(state.durationMs)}</Text></View>
        </View>

        <View style={styles.controls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous media" onPress={player.previous} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><Feather name="skip-back" size={22} color="#FFFFFF" /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={state.isPlaying ? 'Pause' : 'Play'} onPress={player.toggle} style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}><Feather name={state.isPlaying ? 'pause' : 'play'} size={25} color="#FFFFFF" /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Next media" onPress={player.next} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><Feather name="skip-forward" size={22} color="#FFFFFF" /></Pressable>
        </View>

        <View style={styles.secondaryControls}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Repeat mode ${state.repeat}`} onPress={() => player.setRepeat(state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off')} style={styles.secondaryButton}><Feather name="repeat" size={19} color="#FFFFFF" /><Text style={styles.secondaryText}>{state.repeat === 'off' ? 'Repeat' : state.repeat === 'all' ? 'Repeat all' : 'Repeat one'}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={state.shuffle ? 'Disable shuffle' : 'Enable shuffle'} onPress={() => player.setShuffle(!state.shuffle)} style={styles.secondaryButton}><Feather name="shuffle" size={19} color="#FFFFFF" /><Text style={styles.secondaryText}>{state.shuffle ? 'Shuffle on' : 'Shuffle'}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Playback speed" onPress={() => player.setRate(state.rate >= 2 ? 1 : state.rate + 0.25)} style={styles.secondaryButton}><Feather name="activity" size={19} color="#FFFFFF" /><Text style={styles.secondaryText}>{state.rate.toFixed(2)}×</Text></Pressable>
        </View>

        <View style={styles.queueHeader}><Text style={styles.queueTitle}>Up next</Text><Text style={styles.queueCount}>{state.queue.length} items</Text></View>
        {state.queue.map((item: MediaItemModel, index: number) => (
          <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${index === state.index ? 'Now playing, ' : ''}${item.title}`} accessibilityState={{ selected: index === state.index }} onPress={() => player.load(item, true)} style={[styles.queueRow, index === state.index && styles.queueRowActive]}>
            <View style={styles.queueIcon}><MaterialCommunityIcons name={item.kind === 'video' ? 'video-outline' : 'music-note'} size={19} color="#FFFFFF" /></View>
            <View style={styles.queueCopy}><Text style={styles.queueItemTitle} numberOfLines={1}>{item.title}</Text><Text style={styles.queueItemMeta} numberOfLines={1}>{item.artist ?? item.album ?? item.kind}</Text></View>
            {index === state.index ? <Feather name={state.isPlaying ? 'volume-2' : 'pause-circle'} size={18} color="#FFFFFF" /> : <Text style={styles.positionText}>{index + 1}</Text>}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08131B' },
  content: { padding: 20, paddingBottom: 80 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  badge: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#193441', alignItems: 'center', justifyContent: 'center' },
  headerCopy: { marginLeft: 11, flex: 1 },
  kicker: { color: '#8FAAB6', fontSize: 10, letterSpacing: 1.8, fontWeight: '700', marginBottom: 3 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  videoPlaceholder: { aspectRatio: 16 / 9, borderRadius: 20, backgroundColor: '#13242D', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  subtitle: { position: 'absolute', bottom: 18, left: 18, right: 18, color: '#FFFFFF', textAlign: 'center', fontSize: 15, fontWeight: '600', backgroundColor: '#00000088', padding: 8, borderRadius: 10 },
  artworkPlaceholder: { aspectRatio: 1, maxHeight: 320, borderRadius: 24, backgroundColor: '#13242D', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', width: '88%' },
  nowPlaying: { marginTop: 20 },
  currentTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '700', lineHeight: 28 },
  currentMeta: { color: '#9DB1BA', fontSize: 13, marginTop: 5 },
  progressArea: { marginTop: 22 },
  track: { height: 5, borderRadius: 3, backgroundColor: '#29404A', overflow: 'hidden' },
  fill: { height: 5, backgroundColor: '#73C8E8', borderRadius: 3 },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  time: { color: '#8EA5AE', fontSize: 11 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 23, marginTop: 22 },
  playButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#73C8E8', alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#17303B', alignItems: 'center', justifyContent: 'center' },
  selectedButton: { backgroundColor: '#294A58' },
  secondaryControls: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 17, gap: 8 },
  secondaryButton: { flex: 1, minHeight: 44, backgroundColor: '#17303B', borderRadius: 13, alignItems: 'center', justifyContent: 'center', gap: 3 },
  secondaryText: { color: '#D9E7ED', fontSize: 10, fontWeight: '600' },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 30, marginBottom: 10 },
  queueTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  queueCount: { color: '#8EA5AE', fontSize: 11 },
  queueRow: { minHeight: 64, borderRadius: 15, backgroundColor: '#11242D', paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  queueRowActive: { backgroundColor: '#193844' },
  queueIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#23414D', justifyContent: 'center', alignItems: 'center' },
  queueCopy: { flex: 1, marginHorizontal: 10 },
  queueItemTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  queueItemMeta: { color: '#8EA5AE', fontSize: 10, marginTop: 3 },
  positionText: { color: '#7B929D', fontSize: 11 },
  pressed: { opacity: 0.76 },
});
