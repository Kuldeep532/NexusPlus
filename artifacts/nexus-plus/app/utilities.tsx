import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Utility = {
  id: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  description: string;
  note: string;
  tone: 'primary' | 'accent' | 'secondary';
};

const utilities: Utility[] = [
  { id: 'text-to-pdf', icon: 'file-text', title: 'Text to PDF', description: 'Turn plain text into a clean, shareable document.', note: 'Text in, PDF out', tone: 'primary' },
  { id: 'image-to-pdf', icon: 'image', title: 'Image to PDF', description: 'Combine photos or scanned pages into one PDF.', note: 'Multiple images supported', tone: 'accent' },
  { id: 'pdf-to-image', icon: 'layers', title: 'PDF to Image', description: 'Export PDF pages as images for quick access.', note: 'Page-by-page export', tone: 'secondary' },
  { id: 'audio-trim-join', icon: 'scissors', title: 'Audio Trim & Join', description: 'Cut a clip or join recordings into one track.', note: 'Simple timeline editing', tone: 'accent' },
  { id: 'speech-sanitizer', icon: 'filter', title: 'Speech Sanitizer', description: 'Remove URLs, symbols, and formatting before playback.', note: 'Cleaner spoken output', tone: 'primary' },
];

export default function UtilitiesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tool?: string }>();
  const initialTool = typeof params.tool === 'string' ? params.tool : null;
  const [selectedId, setSelectedId] = useState<string | null>(initialTool);

  const selected = utilities.find((utility) => utility.id === selectedId);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heading}>
        <Text style={[styles.kicker, { color: colors.primary }]}>FILE WORKBENCH</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Small tools.{'\n'}Useful results.</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>Choose a job and keep the work on your device from start to finish.</Text>
      </View>

      <View style={[styles.notice, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={[styles.noticeIcon, { backgroundColor: colors.muted }]}>
          <Feather name="lock" size={16} color={colors.primary} />
        </View>
        <View style={styles.noticeCopy}>
          <Text style={[styles.noticeTitle, { color: colors.foreground }]}>Private processing</Text>
          <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>No upload, account, or waiting room.</Text>
        </View>
        <Feather name="check" size={17} color={colors.primary} />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AVAILABLE TOOLS</Text>
      {utilities.map((utility) => {
        const isSelected = selectedId === utility.id;
        const iconColor = utility.tone === 'primary' ? colors.primary : utility.tone === 'accent' ? colors.accent : colors.secondaryForeground;
        return (
          <Pressable
            key={utility.id}
            accessibilityRole="button"
            accessibilityLabel={`${utility.title}. ${utility.description}`}
            accessibilityState={{ selected: isSelected }}
            testID={`utility-${utility.id}`}
            onPress={() => setSelectedId(utility.id)}
            style={({ pressed }) => [
              styles.tool,
              { backgroundColor: colors.card, borderColor: isSelected ? iconColor : colors.border },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.toolIcon, { backgroundColor: colors.secondary }]}>
              <Feather name={utility.icon} size={21} color={iconColor} />
            </View>
            <View style={styles.toolCopy}>
              <View style={styles.toolTitleRow}>
                <Text style={[styles.toolTitle, { color: colors.foreground }]}>{utility.title}</Text>
                {isSelected && <Text style={[styles.selected, { color: colors.primary }]}>SELECTED</Text>}
              </View>
              <Text style={[styles.toolDescription, { color: colors.mutedForeground }]}>{utility.description}</Text>
              <Text style={[styles.toolNote, { color: iconColor }]}>{utility.note}</Text>
            </View>
            <Feather name={isSelected ? 'check-circle' : 'chevron-right'} size={18} color={isSelected ? colors.primary : colors.mutedForeground} />
          </Pressable>
        );
      })}

      {selected && (
        <View style={[styles.selectedPanel, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <View style={styles.selectedHeader}>
            <View>
              <Text style={[styles.selectedKicker, { color: colors.primary }]}>READY TO START</Text>
              <Text style={[styles.selectedTitle, { color: colors.foreground }]}>{selected.title}</Text>
            </View>
            <Feather name="arrow-down-right" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.selectedText, { color: colors.mutedForeground }]}>The next step will use files already stored on this device.</Text>
          <View style={[styles.statusLine, { borderTopColor: colors.border }]}>
            <Feather name="hard-drive" size={15} color={colors.secondaryForeground} />
            <Text style={[styles.statusText, { color: colors.secondaryForeground }]}>Local workspace ready</Text>
          </View>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Book Reader"
        testID="utilities-open-reader"
        onPress={() => router.push('/reader')}
        style={({ pressed }) => [styles.readerLink, { borderColor: colors.border }, pressed && styles.pressed]}
      >
        <Feather name="book-open" size={17} color={colors.primary} />
        <Text style={[styles.readerLinkText, { color: colors.primary }]}>Open Book Reader</Text>
        <Feather name="arrow-up-right" size={16} color={colors.primary} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { paddingHorizontal: 20, marginBottom: 21 },
  kicker: { fontSize: 10, letterSpacing: 1.8, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  title: { fontSize: 30, lineHeight: 34, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  sub: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  notice: { marginHorizontal: 20, padding: 13, borderRadius: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center', marginBottom: 26 },
  noticeIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  noticeCopy: { flex: 1, marginLeft: 10 },
  noticeTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  noticeText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  sectionLabel: { marginHorizontal: 20, fontSize: 10, letterSpacing: 1.6, fontFamily: 'Inter_700Bold', marginBottom: 9 },
  tool: { marginHorizontal: 20, minHeight: 94, borderRadius: 16, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  toolIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  toolCopy: { flex: 1, marginLeft: 12, marginRight: 9 },
  toolTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  toolTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', flexShrink: 1 },
  selected: { fontSize: 8, letterSpacing: 1, fontFamily: 'Inter_700Bold' },
  toolDescription: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular' },
  toolNote: { fontSize: 10, fontFamily: 'Inter_600SemiBold', marginTop: 7 },
  selectedPanel: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, padding: 15, marginTop: 8, marginBottom: 12 },
  selectedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  selectedKicker: { fontSize: 9, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  selectedTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  selectedText: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular', marginTop: 12 },
  statusLine: { borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: 11, marginTop: 13 },
  statusText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  readerLink: { marginHorizontal: 20, minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10 },
  readerLinkText: { flex: 1, fontSize: 12, fontFamily: 'Inter_700Bold' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.987 }] },
});