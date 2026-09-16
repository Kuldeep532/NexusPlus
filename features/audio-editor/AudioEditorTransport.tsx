import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

type Props = {
  active: boolean;
  paused: boolean;
  recording: boolean;
  working?: boolean;
  onStart: () => void;
  onTogglePause: () => void;
  onFinish: () => void;
  startLabel?: string;
};

/** Shared accessible transport used by Karaoke and Voice Over. */
export function AudioEditorTransport({
  active,
  paused,
  recording,
  working = false,
  onStart,
  onTogglePause,
  onFinish,
  startLabel = 'Start',
}: Props) {
  const colors = useColors();
  if (!active) {
    return (
      <Pressable
        onPress={onStart}
        disabled={working}
        accessibilityRole="button"
        accessibilityLabel={startLabel}
        accessibilityState={{ disabled: working }}
        style={[styles.button, { backgroundColor: colors.primary }]}
      >
        <Feather name={recording ? 'mic' : 'play'} size={18} color={colors.primaryForeground} />
        <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>{startLabel}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onTogglePause}
        disabled={working}
        accessibilityRole="button"
        accessibilityLabel={recording ? (paused ? 'Resume Recording' : 'Pause Recording') : (paused ? 'Resume Singing' : 'Pause Singing')}
        accessibilityState={{ disabled: working }}
        style={[styles.button, { backgroundColor: colors.primary }]}
      >
        <Feather name={paused ? 'play' : 'pause'} size={18} color={colors.primaryForeground} />
        <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>{recording ? (paused ? 'Resume Recording' : 'Pause Recording') : (paused ? 'Resume Singing' : 'Pause Singing')}</Text>
      </Pressable>
      <Pressable
        onPress={onFinish}
        disabled={working}
        accessibilityRole="button"
        accessibilityLabel={recording ? 'Finish Recording' : 'End Singing'}
        accessibilityState={{ disabled: working }}
        style={[styles.button, styles.secondary, { borderColor: colors.primary }]}
      >
        <Feather name="square" size={18} color={colors.primary} />
        <Text style={[styles.secondaryText, { color: colors.primary }]}>{recording ? 'Finish Recording' : 'End Singing'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, minHeight: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  secondary: { borderWidth: 1 },
  primaryText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  secondaryText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});
