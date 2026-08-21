import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { VIDEO_EDITOR_TOOLS } from './videoEditorTools';
import type { VideoClip, VideoProject } from './videoEditorTypes';

const demoClips: VideoClip[] = [
  { id: 'clip-1', uri: '', name: 'Clip 1', durationMs: 12000, startMs: 0, endMs: 12000 },
  { id: 'clip-2', uri: '', name: 'Clip 2', durationMs: 8500, startMs: 0, endMs: 8500 },
  { id: 'clip-3', uri: '', name: 'Clip 3', durationMs: 15000, startMs: 0, endMs: 15000 },
];

export default function VideoEditorScreen() {
  const colors = useColors();
  const [project, setProject] = useState<VideoProject>({ id: 'local-project', name: 'New Video', clips: demoClips, createdAt: Date.now(), updatedAt: Date.now() });
  const [selectedClipId, setSelectedClipId] = useState('clip-1');
  const [playing, setPlaying] = useState(false);
  const selectedClip = useMemo(() => project.clips.find((clip) => clip.id === selectedClipId) ?? project.clips[0], [project.clips, selectedClipId]);
  const totalDuration = project.clips.reduce((sum, clip) => sum + Math.max(0, clip.endMs - clip.startMs), 0);
  const moveClip = (from: number, to: number) => {
    if (to < 0 || to >= project.clips.length || from === to) return;
    const clips = [...project.clips];
    const [item] = clips.splice(from, 1);
    clips.splice(to, 0, item);
    setProject((current) => ({ ...current, clips, updatedAt: Date.now() }));
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconButton}><Feather name="arrow-left" size={21} color={colors.foreground} /></Pressable>
        <View style={styles.titleWrap}><Text style={[styles.kicker, { color: colors.primary }]}>VIDEO EDITOR</Text><Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>{project.name}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Export video" onPress={() => {}} style={[styles.exportButton, { backgroundColor: colors.primary }]}><Text style={[styles.exportText, { color: colors.primaryForeground }]}>Export</Text></Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.previewBadge}><Text style={styles.previewBadgeText}>16:9</Text></View>
          <View style={styles.previewCenter}>
            <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Pause preview' : 'Play preview'} onPress={() => setPlaying((value) => !value)} style={[styles.playButton, { backgroundColor: colors.primary }]}><Feather name={playing ? 'pause' : 'play'} size={28} color={colors.primaryForeground} /></Pressable>
            <Text style={[styles.previewHint, { color: colors.mutedForeground }]}>Preview uses the existing Nexus media playback surface</Text>
          </View>
          <View style={styles.previewMeta}><Text style={[styles.timeLabel, { color: colors.foreground }]}>00:00</Text><View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}><View style={[styles.progressValue, { backgroundColor: colors.primary, width: '18%' }]} /></View><Text style={[styles.timeLabel, { color: colors.foreground }]}>{formatMs(totalDuration)}</Text></View>
        </View>
        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Timeline</Text><Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>{project.clips.length} clips · {formatMs(totalDuration)}</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timelineRow}>
          {project.clips.map((clip, index) => {
            const selected = clip.id === selectedClip?.id;
            return <Pressable key={clip.id} accessibilityRole="button" accessibilityLabel={`Select ${clip.name}`} onPress={() => setSelectedClipId(clip.id)} style={[styles.clipCard, { backgroundColor: colors.card, borderColor: selected ? colors.primary : colors.border }, selected && styles.selectedClip]}><View style={[styles.thumbnail, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="movie-open-outline" size={26} color={colors.primary} /><Text style={[styles.clipNumber, { color: colors.foreground }]}>{index + 1}</Text></View><Text numberOfLines={1} style={[styles.clipName, { color: colors.foreground }]}>{clip.name}</Text><Text style={[styles.clipDuration, { color: colors.mutedForeground }]}>{formatMs(clip.endMs - clip.startMs)}</Text></Pressable>;
          })}
          <Pressable accessibilityRole="button" accessibilityLabel="Add video clip" onPress={() => {}} style={[styles.addClip, { borderColor: colors.border }]}><Feather name="plus" size={24} color={colors.primary} /><Text style={[styles.addClipText, { color: colors.foreground }]}>Add clip</Text></Pressable>
        </ScrollView>
        {selectedClip && <View style={[styles.selectedBar, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.selectedInfo}><Text style={[styles.selectedLabel, { color: colors.mutedForeground }]}>Selected</Text><Text style={[styles.selectedName, { color: colors.foreground }]}>{selectedClip.name}</Text></View><View style={styles.reorderButtons}><Pressable accessibilityRole="button" accessibilityLabel="Move clip left" onPress={() => { const index = project.clips.findIndex((clip) => clip.id === selectedClip.id); moveClip(index, index - 1); }} style={[styles.smallButton, { borderColor: colors.border }]}><Feather name="chevron-left" size={18} color={colors.foreground} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Move clip right" onPress={() => { const index = project.clips.findIndex((clip) => clip.id === selectedClip.id); moveClip(index, index + 1); }} style={[styles.smallButton, { borderColor: colors.border }]}><Feather name="chevron-right" size={18} color={colors.foreground} /></Pressable></View></View>}
        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tools</Text><Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>One tool per screen</Text></View>
        <View style={styles.toolGrid}>{VIDEO_EDITOR_TOOLS.map((tool) => <Pressable key={tool.key} accessibilityRole="button" accessibilityLabel={`Open ${tool.title}`} onPress={() => router.push(tool.route as never)} style={({ pressed }) => [styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}><View style={[styles.toolIcon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name={tool.icon as never} size={23} color={colors.primary} /></View><View style={styles.toolCopy}><Text style={[styles.toolTitle, { color: colors.foreground }]}>{tool.title}</Text><Text style={[styles.toolDescription, { color: colors.mutedForeground }]}>{tool.description}</Text></View><Feather name="chevron-right" size={17} color={colors.mutedForeground} /></Pressable>)}</View>
        <View style={[styles.workflowCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.workflowTitle, { color: colors.foreground }]}>Professional workflow</Text><Text style={[styles.workflowText, { color: colors.mutedForeground }]}>Import clips → arrange on timeline → edit each clip with a dedicated tool → preview → export.</Text></View>
      </ScrollView>
    </View>
  );
}

function formatMs(ms: number) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, topBar: { minHeight: 72, borderBottomWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }, iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, titleWrap: { flex: 1 }, kicker: { fontSize: 9, letterSpacing: 1.8, fontFamily: 'Inter_700Bold' }, title: { fontSize: 17, fontFamily: 'Inter_700Bold', marginTop: 2 }, exportButton: { minHeight: 40, paddingHorizontal: 16, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, exportText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, content: { padding: 16, paddingBottom: 40, gap: 16 }, preview: { minHeight: 245, borderRadius: 18, borderWidth: 1, padding: 12 }, previewBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.08)' }, previewBadgeText: { fontSize: 10, color: '#777', fontFamily: 'Inter_700Bold' }, previewCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }, playButton: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center' }, previewHint: { fontSize: 11, textAlign: 'center', maxWidth: 260, fontFamily: 'Inter_400Regular' }, previewMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 }, timeLabel: { width: 42, fontSize: 10, fontFamily: 'Inter_700Bold' }, progressTrack: { flex: 1, height: 5, borderRadius: 999, overflow: 'hidden' }, progressValue: { height: '100%', borderRadius: 999 }, sectionHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8 }, sectionTitle: { fontSize: 19, fontFamily: 'Inter_700Bold' }, sectionMeta: { flex: 1, textAlign: 'right', fontSize: 10, fontFamily: 'Inter_400Regular' }, timelineRow: { gap: 10, paddingBottom: 2 }, clipCard: { width: 125, padding: 8, borderRadius: 14, borderWidth: 1 }, selectedClip: { borderWidth: 2 }, thumbnail: { height: 70, borderRadius: 10, alignItems: 'center', justifyContent: 'center', position: 'relative' }, clipNumber: { position: 'absolute', top: 6, left: 7, fontSize: 10, fontFamily: 'Inter_700Bold' }, clipName: { fontSize: 12, fontFamily: 'Inter_700Bold', marginTop: 8 }, clipDuration: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2 }, addClip: { width: 112, minHeight: 112, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 }, addClipText: { fontSize: 11, fontFamily: 'Inter_700Bold' }, selectedBar: { borderRadius: 14, borderWidth: 1, padding: 11, flexDirection: 'row', alignItems: 'center' }, selectedInfo: { flex: 1 }, selectedLabel: { fontSize: 9, fontFamily: 'Inter_400Regular' }, selectedName: { fontSize: 13, fontFamily: 'Inter_700Bold', marginTop: 2 }, reorderButtons: { flexDirection: 'row', gap: 7 }, smallButton: { width: 38, height: 38, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, toolGrid: { gap: 9 }, toolCard: { minHeight: 68, borderRadius: 15, borderWidth: 1, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 11 }, toolIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, toolCopy: { flex: 1 }, toolTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' }, toolDescription: { fontSize: 10.5, fontFamily: 'Inter_400Regular', marginTop: 3 }, pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] }, workflowCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 5 }, workflowTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' }, workflowText: { fontSize: 11, lineHeight: 17, fontFamily: 'Inter_400Regular' },
});
