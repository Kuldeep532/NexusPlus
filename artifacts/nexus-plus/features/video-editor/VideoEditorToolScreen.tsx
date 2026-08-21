import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { VIDEO_EDITOR_TOOLS } from './videoEditorTools';

export default function VideoEditorToolScreen() {
  const { tool } = useLocalSearchParams<{ tool?: string }>();
  const colors = useColors();
  const selected = VIDEO_EDITOR_TOOLS.find((item) => item.key === tool) ?? VIDEO_EDITOR_TOOLS[0];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to Video Editor" onPress={() => router.back()} style={styles.back}><Feather name="arrow-left" size={21} color={colors.foreground} /></Pressable>
        <View style={styles.headerCopy}><Text style={[styles.kicker, { color: colors.primary }]}>VIDEO EDITOR</Text><Text style={[styles.title, { color: colors.foreground }]}>{selected.title}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Apply tool" onPress={() => {}} style={[styles.apply, { backgroundColor: colors.primary }]}><Text style={[styles.applyText, { color: colors.primaryForeground }]}>Apply</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="film" size={34} color={colors.primary} />
          <Text style={[styles.previewTitle, { color: colors.foreground }]}>Selected clip preview</Text>
          <Text style={[styles.previewText, { color: colors.mutedForeground }]}>{selected.description}</Text>
        </View>
        <View style={[styles.controlCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.controlTitle, { color: colors.foreground }]}>Controls</Text>
          <Text style={[styles.controlText, { color: colors.mutedForeground }]}>This screen is intentionally isolated so its implementation can evolve independently from the main editor timeline.</Text>
          <View style={styles.controlRow}><Text style={[styles.controlLabel, { color: colors.foreground }]}>Tool</Text><Text style={[styles.controlValue, { color: colors.primary }]}>{selected.title}</Text></View>
          <View style={styles.controlRow}><Text style={[styles.controlLabel, { color: colors.foreground }]}>Processing</Text><Text style={[styles.controlValue, { color: colors.mutedForeground }]}>{selected.nativeRequired ? 'Native engine' : 'Native/export pipeline'}</Text></View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 }, header: { minHeight: 72, borderBottomWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1 }, kicker: { fontSize: 9, letterSpacing: 1.7, fontFamily: 'Inter_700Bold' }, title: { fontSize: 17, fontFamily: 'Inter_700Bold', marginTop: 2 }, apply: { minHeight: 40, paddingHorizontal: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, applyText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, content: { padding: 16, gap: 14 }, preview: { minHeight: 260, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 }, previewTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' }, previewText: { fontSize: 11, lineHeight: 17, textAlign: 'center', maxWidth: 290, fontFamily: 'Inter_400Regular' }, controlCard: { borderWidth: 1, borderRadius: 18, padding: 15, gap: 12 }, controlTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' }, controlText: { fontSize: 11, lineHeight: 17, fontFamily: 'Inter_400Regular' }, controlRow: { minHeight: 46, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.18)', flexDirection: 'row', alignItems: 'center' }, controlLabel: { flex: 1, fontSize: 12, fontFamily: 'Inter_700Bold' }, controlValue: { fontSize: 11, fontFamily: 'Inter_700Bold' } });
