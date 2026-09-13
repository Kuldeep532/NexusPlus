import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export interface AudioTimelineRangeValue {
  startMs: number;
  endMs: number;
}

interface AudioTimelineRangeProps {
  durationMs: number;
  value: AudioTimelineRangeValue;
  onChange: (next: AudioTimelineRangeValue) => void;
  accessibilityLabel?: string;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function parseTime(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed) * 1000;
  const parts = trimmed.split(':').map(Number);
  if (parts.length !== 2 || parts.some((part) => !Number.isFinite(part))) return null;
  return (parts[0] * 60 + parts[1]) * 1000;
}

export function AudioTimelineRange({ durationMs, value, onChange, accessibilityLabel = 'Audio timeline range' }: AudioTimelineRangeProps) {
  const colors = useColors();
  const safeDuration = Math.max(0, durationMs);
  const minimumGap = Math.min(1000, Math.max(1, safeDuration));
  const stepMs = Math.max(100, Math.min(1000, safeDuration / 100 || 100));

  const updateStart = (next: number) => {
    const end = Math.max(value.endMs, minimumGap);
    onChange({ startMs: Math.max(0, Math.min(next, end - minimumGap)), endMs: end });
  };

  const updateEnd = (next: number) => {
    const start = Math.min(value.startMs, Math.max(0, safeDuration - minimumGap));
    onChange({ startMs: start, endMs: Math.min(safeDuration, Math.max(next, start + minimumGap)) });
  };

  const applyStartText = (text: string) => {
    const parsed = parseTime(text);
    if (parsed !== null) updateStart(parsed);
  };

  const applyEndText = (text: string) => {
    const parsed = parseTime(text);
    if (parsed !== null) updateEnd(parsed);
  };

  return (
    <View accessibilityLabel={accessibilityLabel}>
      <View style={[styles.timeline, { backgroundColor: colors.secondary }]}>
        <View
          style={[
            styles.selected,
            {
              backgroundColor: colors.primary,
              left: safeDuration ? `${(value.startMs / safeDuration) * 100}%` : '0%',
              right: safeDuration ? `${100 - (value.endMs / safeDuration) * 100}%` : '0%',
            },
          ]}
        />
      </View>

      <View style={styles.readout}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Start</Text>
        <Text style={[styles.value, { color: colors.foreground }]}>{formatTime(value.startMs)}</Text>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>End</Text>
        <Text style={[styles.value, { color: colors.foreground }]}>{formatTime(value.endMs)}</Text>
      </View>

      <View style={styles.nudgeRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Move start earlier" onPress={() => updateStart(value.startMs - stepMs)} style={[styles.smallButton, { borderColor: colors.border }]}>
          <Feather name="chevron-left" size={16} color={colors.foreground} />
          <Text style={[styles.buttonText, { color: colors.foreground }]}>Start −</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Move start later" onPress={() => updateStart(value.startMs + stepMs)} style={[styles.smallButton, { borderColor: colors.border }]}>
          <Text style={[styles.buttonText, { color: colors.foreground }]}>Start +</Text>
          <Feather name="chevron-right" size={16} color={colors.foreground} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Move end earlier" onPress={() => updateEnd(value.endMs - stepMs)} style={[styles.smallButton, { borderColor: colors.border }]}>
          <Feather name="chevron-left" size={16} color={colors.foreground} />
          <Text style={[styles.buttonText, { color: colors.foreground }]}>End −</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Move end later" onPress={() => updateEnd(value.endMs + stepMs)} style={[styles.smallButton, { borderColor: colors.border }]}>
          <Text style={[styles.buttonText, { color: colors.foreground }]}>End +</Text>
          <Feather name="chevron-right" size={16} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={styles.inputsRow}>
        <TextInput
          defaultValue={formatTime(value.startMs)}
          onEndEditing={(event) => applyStartText(event.nativeEvent.text)}
          keyboardType="numbers-and-punctuation"
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          accessibilityLabel="Exact trim start"
        />
        <TextInput
          defaultValue={formatTime(value.endMs)}
          onEndEditing={(event) => applyEndText(event.nativeEvent.text)}
          keyboardType="numbers-and-punctuation"
          style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          accessibilityLabel="Exact trim end"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: { height: 54, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  selected: { position: 'absolute', top: 0, bottom: 0 },
  readout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  label: { fontSize: 10.5 },
  value: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  nudgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  smallButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 3 },
  buttonText: { fontSize: 10.5, fontFamily: 'Inter_700Bold' },
  inputsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  input: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 13 },
});