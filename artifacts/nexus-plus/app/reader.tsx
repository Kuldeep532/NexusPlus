import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const totalSeconds = 42 * 60;

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

export default function ReaderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [position, setPosition] = useState(12 * 60 + 18);
  const [ocrComplete, setOcrComplete] = useState(false);
  const [sleepTimer, setSleepTimer] = useState(false);
  const [chapter, setChapter] = useState(4);

  const shiftPosition = (amount: number) => {
    setPosition((current) => Math.min(totalSeconds, Math.max(0, current + amount)));
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.kicker, { color: colors.primary }]}>PDF READER</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>The Art of{'\n'}Stillness</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>Chapter {chapter} · The quiet mind</Text>
        </View>
        <View style={[styles.cover, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="book-open-page-variant" size={38} color={colors.primary} />
          <Text style={[styles.coverLabel, { color: colors.primary }]}>PDF</Text>
        </View>
      </View>

      <View style={[styles.ocrBanner, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={[styles.ocrIcon, { backgroundColor: colors.muted }]}>
          <Feather name="search" size={17} color={colors.accent} />
        </View>
        <View style={styles.ocrCopy}>
          <Text style={[styles.ocrTitle, { color: colors.foreground }]}>OCR in the reading flow</Text>
          <Text style={[styles.ocrDetail, { color: colors.mutedForeground }]}>{ocrComplete ? 'Page text is ready for speech.' : 'Scanned pages are recognized automatically.'}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ocrComplete ? 'OCR complete for this page' : 'Run OCR on this page'}
          testID="reader-run-ocr"
          onPress={() => setOcrComplete(true)}
          disabled={ocrComplete}
          style={[styles.ocrAction, { borderColor: colors.accent }, ocrComplete && { borderColor: colors.primary }]}
        >
          <Text style={[styles.ocrActionText, { color: ocrComplete ? colors.primary : colors.accent }]}>{ocrComplete ? 'Ready' : 'Run OCR'}</Text>
        </Pressable>
      </View>

      <LinearGradient colors={[colors.secondary, colors.card]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.player, { borderColor: colors.border }]}>
        <View style={styles.playerHeader}>
          <Text style={[styles.playerLabel, { color: colors.secondaryForeground }]}>AUDIO READING</Text>
          <View style={[styles.liveTag, { backgroundColor: colors.muted }]}>
            <View style={[styles.liveDot, { backgroundColor: playing ? colors.primary : colors.mutedForeground }]} />
            <Text style={[styles.liveText, { color: playing ? colors.primary : colors.mutedForeground }]}>{playing ? 'PLAYING' : 'PAUSED'}</Text>
          </View>
        </View>
        <View style={styles.wave}>
          {Array.from({ length: 24 }).map((_, index) => (
            <View key={index} style={[styles.bar, { height: 10 + ((index * 17) % 27), backgroundColor: index < 10 && playing ? colors.primary : colors.border }]} />
          ))}
        </View>
        <View style={[styles.track, { backgroundColor: colors.muted }]}>
          <View style={[styles.trackFill, { backgroundColor: colors.primary, width: `${(position / totalSeconds) * 100}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: colors.secondaryForeground }]}>{formatTime(position)}</Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>{formatTime(totalSeconds)}</Text>
        </View>
        <View style={styles.controls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Rewind 10 seconds" testID="reader-rewind" onPress={() => shiftPosition(-10)} style={styles.control}>
            <Feather name="rotate-ccw" size={20} color={colors.secondaryForeground} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Pause reading' : 'Play reading'} testID="reader-play-pause" onPress={() => setPlaying((value) => !value)} style={({ pressed }) => [styles.mainPlay, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
            <Feather name={playing ? 'pause' : 'play'} size={24} color={colors.primaryForeground} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Forward 10 seconds" testID="reader-forward" onPress={() => shiftPosition(10)} style={styles.control}>
            <Feather name="rotate-cw" size={20} color={colors.secondaryForeground} />
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.options}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Change playback speed. Current speed ${speed.toFixed(1)} times`} testID="reader-speed" onPress={() => setSpeed((value) => value >= 2 ? 0.75 : value + 0.25)} style={({ pressed }) => [styles.option, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
          <Feather name="zap" size={18} color={colors.primary} />
          <Text style={[styles.optionLabel, { color: colors.foreground }]}>Speed</Text>
          <Text style={[styles.optionValue, { color: colors.primary }]}>{speed.toFixed(2)}×</Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={sleepTimer ? 'Turn off sleep timer' : 'Set a 30 minute sleep timer'} testID="reader-sleep-timer" onPress={() => setSleepTimer((value) => !value)} style={({ pressed }) => [styles.option, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
          <Feather name="moon" size={18} color={colors.accent} />
          <Text style={[styles.optionLabel, { color: colors.foreground }]}>Sleep timer</Text>
          <Text style={[styles.optionValue, { color: sleepTimer ? colors.accent : colors.mutedForeground }]}>{sleepTimer ? '30 min' : 'Off'}</Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Change chapter. Current chapter ${chapter} of 12`} testID="reader-chapters" onPress={() => setChapter((value) => value >= 12 ? 1 : value + 1)} style={({ pressed }) => [styles.option, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
          <Feather name="list" size={18} color={colors.secondaryForeground} />
          <Text style={[styles.optionLabel, { color: colors.foreground }]}>Chapters</Text>
          <Text style={[styles.optionValue, { color: colors.mutedForeground }]}>{chapter} of 12</Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <View style={[styles.quote, { borderColor: colors.border }]}>
        <Text style={[styles.quoteMark, { color: colors.primary }]}>“</Text>
        <Text style={[styles.quoteText, { color: colors.foreground }]}>Stillness is not an escape from the world. It is a way of meeting it with your whole attention.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 19 },
  headerCopy: { flex: 1, marginRight: 14 },
  kicker: { fontSize: 10, letterSpacing: 1.8, fontFamily: 'Inter_700Bold', marginBottom: 9 },
  title: { fontSize: 29, lineHeight: 33, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  cover: { width: 96, height: 119, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  coverLabel: { fontSize: 10, letterSpacing: 1.5, fontFamily: 'Inter_700Bold' },
  ocrBanner: { marginHorizontal: 20, padding: 12, borderRadius: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  ocrIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ocrCopy: { flex: 1, marginLeft: 10, marginRight: 8 },
  ocrTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  ocrDetail: { fontSize: 10, lineHeight: 14, fontFamily: 'Inter_400Regular' },
  ocrAction: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 8 },
  ocrActionText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  player: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, padding: 17 },
  playerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  playerLabel: { fontSize: 10, letterSpacing: 1.3, fontFamily: 'Inter_700Bold' },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 9, letterSpacing: 1, fontFamily: 'Inter_700Bold' },
  wave: { height: 53, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 17 },
  bar: { width: 4, borderRadius: 2 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 15 },
  trackFill: { height: 4, borderRadius: 2 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  time: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 33, marginTop: 16 },
  control: { padding: 12 },
  mainPlay: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },
  options: { marginHorizontal: 20, marginTop: 16, gap: 8 },
  option: { minHeight: 56, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  optionValue: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  quote: { marginHorizontal: 20, marginTop: 22, padding: 16, borderLeftWidth: 2, flexDirection: 'row', gap: 8 },
  quoteMark: { fontSize: 27, lineHeight: 24, fontFamily: 'Inter_700Bold' },
  quoteText: { flex: 1, fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular' },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
});