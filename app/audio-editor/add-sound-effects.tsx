import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';
import { useColors } from '@/hooks/useColors';

type EffectClip = { id: string; name: string; start: number; duration: number; volume: number };

const SAMPLE_EFFECTS = ['Transition', 'Whoosh', 'Pop', 'Applause', 'Bell', 'Custom'];
const TOTAL_DURATION = 30;
const formatTime = (seconds: number) => { const safe = Math.max(0, Math.round(seconds)); return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`; };

export default function AddSoundEffectsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [audioName, setAudioName] = useState('My Audio');
  const [effects, setEffects] = useState<EffectClip[]>([]);
  const [selectedEffect, setSelectedEffect] = useState('Transition');
  const [playhead, setPlayhead] = useState(0);
  const [pendingStart, setPendingStart] = useState(0);
  const [duration, setDuration] = useState('2');
  const [volume, setVolume] = useState(80);
  const [playing, setPlaying] = useState(false);
  const currentDuration = Math.max(0.25, Number(duration) || 2);
  const timelineLabels = useMemo(() => [0, 5, 10, 15, 20, 25, 30], []);

  const addEffect = () => {
    const safeDuration = Math.min(currentDuration, TOTAL_DURATION);
    const next: EffectClip = { id: `${selectedEffect}-${Date.now()}`, name: selectedEffect, start: Math.min(pendingStart, Math.max(0, TOTAL_DURATION - safeDuration)), duration: safeDuration, volume };
    setEffects((current) => [...current, next]);
    setPendingStart(next.start);
  };
  const removeEffect = (id: string) => setEffects((current) => current.filter((effect) => effect.id !== id));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Add Sound Effects' }} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 30 }}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Add Sound Effects</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Add custom sound effects over your audio or between sections with precise timeline and controls.</Text>
        <View style={[styles.projectCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.waveIcon, { backgroundColor: colors.secondary }]}><Feather name="music" size={20} color={colors.primary} /></View>
          <View style={styles.projectCopy}><Text style={[styles.projectLabel, { color: colors.mutedForeground }]}>AUDIO PROJECT</Text><Text style={[styles.projectName, { color: colors.foreground }]}>{audioName}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Rename audio project" onPress={() => setAudioName(audioName === 'My Audio' ? 'Untitled Audio' : 'My Audio')} style={[styles.iconButton, { backgroundColor: colors.secondary }]}><Feather name="edit-2" size={17} color={colors.primary} /></Pressable>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Timeline</Text>
        <View accessible accessibilityLabel={`Audio timeline. Playhead ${formatTime(playhead)} of ${formatTime(TOTAL_DURATION)}`} style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.timelineHeader}><Text style={[styles.timeText, { color: colors.foreground }]}>{formatTime(playhead)}</Text><Text style={[styles.timeText, { color: colors.mutedForeground }]}>{formatTime(TOTAL_DURATION)}</Text></View>
          <View style={[styles.track, { backgroundColor: colors.secondary }]}>
            {effects.map((effect) => <View key={effect.id} accessibilityLabel={`${effect.name} effect from ${formatTime(effect.start)} for ${effect.duration.toFixed(1)} seconds`} style={[styles.effectBlock, { left: `${(effect.start / TOTAL_DURATION) * 100}%`, width: `${Math.max(4, (effect.duration / TOTAL_DURATION) * 100)}%`, backgroundColor: colors.primary }]}><Text numberOfLines={1} style={[styles.effectText, { color: colors.primaryForeground }]}>{effect.name}</Text></View>)}
            <View pointerEvents="none" style={[styles.playhead, { left: `${(playhead / TOTAL_DURATION) * 100}%`, backgroundColor: colors.foreground }]} />
          </View>
          <View style={styles.tickRow}>{timelineLabels.map((value) => <Text key={value} style={[styles.tick, { color: colors.mutedForeground }]}>{formatTime(value)}</Text>)}</View>
          <View style={styles.stepperRow}><Pressable accessibilityRole="button" accessibilityLabel="Move playhead earlier by half a second" onPress={() => setPlayhead(Math.max(0, playhead - 0.5))} style={[styles.stepper, { borderColor: colors.border }]}><Text style={[styles.stepperText, { color: colors.foreground }]}>−0.5s</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Move playhead later by half a second" onPress={() => setPlayhead(Math.min(TOTAL_DURATION, playhead + 0.5))} style={[styles.stepper, { borderColor: colors.border }]}><Text style={[styles.stepperText, { color: colors.foreground }]}>+0.5s</Text></Pressable></View>
        </View>
        <View style={styles.transportRow}><Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Pause preview' : 'Play preview'} onPress={() => setPlaying((value) => !value)} style={[styles.playButton, { backgroundColor: colors.primary }]}><Feather name={playing ? 'pause' : 'play'} size={18} color={colors.primaryForeground} /><Text style={[styles.playText, { color: colors.primaryForeground }]}>{playing ? 'Pause' : 'Preview'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Use current playhead as effect start" onPress={() => setPendingStart(playhead)} style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="crosshair" size={17} color={colors.foreground} /><Text style={[styles.secondaryText, { color: colors.foreground }]}>Use playhead</Text></Pressable></View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sound effect</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.effectPicker}>{SAMPLE_EFFECTS.map((effect) => <Pressable key={effect} accessibilityRole="button" accessibilityState={{ selected: selectedEffect === effect }} accessibilityLabel={`${effect} sound effect`} onPress={() => setSelectedEffect(effect)} style={[styles.effectChip, { backgroundColor: colors.card, borderColor: selectedEffect === effect ? colors.primary : colors.border }]}><Feather name={effect === 'Custom' ? 'upload' : 'volume-2'} size={15} color={selectedEffect === effect ? colors.primary : colors.foreground} /><Text style={[styles.chipText, { color: colors.foreground }]}>{effect}</Text></Pressable>)}</ScrollView>
        <View style={[styles.controlCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.controlLabel, { color: colors.foreground }]}>Start time</Text>
          <View style={styles.stepperRow}><Pressable accessibilityRole="button" accessibilityLabel="Move effect start earlier by half a second" onPress={() => setPendingStart(Math.max(0, pendingStart - 0.5))} style={[styles.stepper, { borderColor: colors.border }]}><Text style={[styles.stepperText, { color: colors.foreground }]}>−0.5</Text></Pressable><Text accessibilityLiveRegion="polite" style={[styles.valueText, { color: colors.primary }]}>{formatTime(pendingStart)}</Text><Pressable accessibilityRole="button" accessibilityLabel="Move effect start later by half a second" onPress={() => setPendingStart(Math.min(Math.max(0, TOTAL_DURATION - currentDuration), pendingStart + 0.5))} style={[styles.stepper, { borderColor: colors.border }]}><Text style={[styles.stepperText, { color: colors.foreground }]}>+0.5</Text></Pressable></View>
          <Text style={[styles.controlLabel, { color: colors.foreground }]}>Duration in seconds</Text>
          <TextInput accessibilityLabel="Effect duration in seconds" value={duration} onChangeText={setDuration} keyboardType="decimal-pad" style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          <View style={styles.volumeHeader}><Text style={[styles.controlLabel, { color: colors.foreground }]}>Volume</Text><Text style={[styles.valueText, { color: colors.primary }]}>{volume}%</Text></View>
          <View style={[styles.volumeRow, { backgroundColor: colors.secondary }]}>{[20, 40, 60, 80, 100].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Set effect volume to ${value} percent`} onPress={() => setVolume(value)} style={[styles.volumeSegment, { backgroundColor: value <= volume ? colors.primary : colors.secondary }]} />)}</View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Add ${selectedEffect} at ${formatTime(pendingStart)}`} onPress={addEffect} style={[styles.addButton, { backgroundColor: colors.primary }]}><Feather name="plus" size={18} color={colors.primaryForeground} /><Text style={[styles.addText, { color: colors.primaryForeground }]}>Add Effect at {formatTime(pendingStart)}</Text></Pressable>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Placed effects</Text>
        {effects.length === 0 ? <View accessible accessibilityRole="summary" style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="volume-x" size={22} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>No effects placed yet</Text><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Choose an effect, set its timing, and add it to the timeline.</Text></View> : effects.map((effect) => <View key={effect.id} style={[styles.placedCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.placedCopy}><Text style={[styles.placedTitle, { color: colors.foreground }]}>{effect.name}</Text><Text style={[styles.placedMeta, { color: colors.mutedForeground }]}>{formatTime(effect.start)} • {effect.duration.toFixed(1)}s • {effect.volume}% volume</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${effect.name} effect`} onPress={() => removeEffect(effect.id)} style={[styles.removeButton, { backgroundColor: colors.secondary }]}><Feather name="trash-2" size={16} color={colors.foreground} /></Pressable></View>)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 6 }, subtitle: { fontSize: 11.5, lineHeight: 18, marginBottom: 18 }, projectCard: { borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }, waveIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, projectCopy: { flex: 1, marginLeft: 12 }, projectLabel: { fontSize: 9, letterSpacing: 1.2, fontFamily: 'Inter_700Bold', marginBottom: 3 }, projectName: { fontSize: 14, fontFamily: 'Inter_700Bold' }, iconButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 2, marginBottom: 10 }, timelineCard: { borderWidth: 1, borderRadius: 18, padding: 13 }, timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }, timeText: { fontSize: 10, fontFamily: 'Inter_700Bold' }, track: { height: 76, borderRadius: 12, position: 'relative', overflow: 'hidden' }, effectBlock: { position: 'absolute', top: 14, height: 48, borderRadius: 10, paddingHorizontal: 8, justifyContent: 'center' }, effectText: { fontSize: 9, fontFamily: 'Inter_700Bold' }, playhead: { position: 'absolute', top: 0, bottom: 0, width: 2 }, tickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }, tick: { fontSize: 8 }, stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10 }, stepper: { minWidth: 66, minHeight: 40, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flex: 1 }, stepperText: { fontSize: 11, fontFamily: 'Inter_700Bold' }, transportRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 20 }, playButton: { flex: 1, minHeight: 45, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, playText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, secondaryButton: { minHeight: 45, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, secondaryText: { fontSize: 11, fontFamily: 'Inter_700Bold' }, effectPicker: { gap: 8, paddingBottom: 4 }, effectChip: { minHeight: 42, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7 }, chipText: { fontSize: 10.5, fontFamily: 'Inter_700Bold' }, controlCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 12, marginBottom: 20 }, controlLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', marginBottom: 8, marginTop: 3 }, valueText: { fontSize: 11, fontFamily: 'Inter_700Bold' }, input: { minHeight: 43, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 12, marginBottom: 14 }, volumeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, volumeRow: { height: 12, borderRadius: 99, flexDirection: 'row', gap: 3, overflow: 'hidden', marginBottom: 16 }, volumeSegment: { flex: 1, height: 12 }, addButton: { minHeight: 46, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, addText: { fontSize: 11.5, fontFamily: 'Inter_700Bold' }, emptyCard: { borderWidth: 1, borderRadius: 18, padding: 20, alignItems: 'center' }, emptyTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginTop: 9, marginBottom: 4 }, emptyBody: { fontSize: 10.5, lineHeight: 16, textAlign: 'center' }, placedCard: { borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 8 }, placedCopy: { flex: 1 }, placedTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold', marginBottom: 3 }, placedMeta: { fontSize: 10, lineHeight: 15 }, removeButton: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
