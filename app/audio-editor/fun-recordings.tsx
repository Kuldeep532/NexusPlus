import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { VoicePitchSoundSelector } from '@/features/audio-editor/VoicePitchSoundSelector';
import { useState } from 'react';
import type { VoicePitchProfile } from '@/features/audio-editor/voicePitchingEngine';

export default function FunRecordingsScreen() {
  const colors = useColors();
  const [selected, setSelected] = useState<VoicePitchProfile | null>(null);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Fun Recordings' }} />
      <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Fun Recordings</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Choose a dynamic voice profile for recording and future voice-changing stages.</Text>
      <VoicePitchSoundSelector value={selected?.id} onChange={setSelected} />
      {selected ? (
        <View style={[styles.selected, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Text style={[styles.selectedTitle, { color: colors.foreground }]}>{selected.name}</Text>
          <Text style={[styles.selectedMeta, { color: colors.mutedForeground }]}>Selected {selected.gender} • {selected.style} • pitch {selected.pitchSemitones >= 0 ? '+' : ''}{selected.pitchSemitones} semitones</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 18, gap: 12 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 11.5, lineHeight: 17 },
  selected: { borderWidth: 1, borderRadius: 14, padding: 12 },
  selectedTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  selectedMeta: { fontSize: 10.5, marginTop: 4 },
});
