import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type IconName = React.ComponentProps<typeof Feather>['name'];
type ToolTone = 'primary' | 'accent' | 'muted';

type Tool = {
  id: string;
  label: string;
  detail: string;
  icon: IconName;
  tone: ToolTone;
  route: 'reader' | 'voices' | 'utilities';
};

const tools: Tool[] = [
  { id: 'book-reader', label: 'Book Reader', detail: 'PDF reading with built-in OCR', icon: 'book-open', tone: 'primary', route: 'reader' },
  { id: 'ocr', label: 'OCR in Book Reader', detail: 'Recognize text as you read', icon: 'search', tone: 'accent', route: 'reader' },
  { id: 'text-to-pdf', label: 'Text to PDF', detail: 'Turn notes into a clean document', icon: 'file-text', tone: 'primary', route: 'utilities' },
  { id: 'image-to-pdf', label: 'Image to PDF', detail: 'Combine images into one file', icon: 'image', tone: 'accent', route: 'utilities' },
  { id: 'pdf-to-image', label: 'PDF to Image', detail: 'Export pages for easy sharing', icon: 'layers', tone: 'muted', route: 'utilities' },
  { id: 'voice-library', label: 'Voice Library', detail: 'Offline voices for natural playback', icon: 'volume-2', tone: 'primary', route: 'voices' },
  { id: 'audio-trim-join', label: 'Audio Trim & Join', detail: 'Cut and combine audio clips', icon: 'scissors', tone: 'accent', route: 'utilities' },
  { id: 'speech-sanitizer', label: 'Speech Sanitizer', detail: 'Remove clutter before listening', icon: 'filter', tone: 'muted', route: 'utilities' },
];

function ToolCard({ tool, onPress }: { tool: Tool; onPress: () => void }) {
  const colors = useColors();
  const iconColor = tool.tone === 'primary' ? colors.primary : tool.tone === 'accent' ? colors.accent : colors.secondaryForeground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${tool.label}. ${tool.detail}`}
      testID={`home-tool-${tool.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}
    >
      <View style={[styles.toolIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={tool.icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.toolLabel, { color: colors.foreground }]}>{tool.label}</Text>
      <Text style={[styles.toolDetail, { color: colors.mutedForeground }]}>{tool.detail}</Text>
      <Feather name="arrow-up-right" size={15} color={colors.mutedForeground} style={styles.toolArrow} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showAllDocs, setShowAllDocs] = useState(false);
  const [showAllTools, setShowAllTools] = useState(false);
  const visibleTools = showAllTools ? tools : tools.slice(0, 4);

  const openTool = (tool: Tool) => {
    if (tool.route === 'reader') {
      router.push('/reader');
    } else if (tool.route === 'voices') {
      router.push('/voices');
    } else {
      router.push({ pathname: '/utilities', params: { tool: tool.id } });
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 112 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <View style={styles.brandLockup}>
          <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
            <Text style={[styles.brandMarkText, { color: colors.primaryForeground }]}>N</Text>
          </View>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>NEXUS PLUS</Text>
            <Text style={[styles.location, { color: colors.mutedForeground }]}>On-device utility suite</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          testID="home-settings"
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}
        >
          <Feather name="sliders" size={19} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={styles.heading}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Make every page{"\n"}easier to use.</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Read, convert, listen, and clean up files without sending them anywhere.</Text>
      </View>

      <LinearGradient colors={[colors.secondary, colors.card]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { borderColor: colors.border }]}>
        <View style={styles.heroTop}>
          <View style={[styles.status, { backgroundColor: colors.muted }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.statusText, { color: colors.primary }]}>READY OFFLINE</Text>
          </View>
          <MaterialCommunityIcons name="book-open-page-variant-outline" size={46} color={colors.primary} />
        </View>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>Pick up where you left off.</Text>
        <Text style={[styles.heroBody, { color: colors.secondaryForeground }]}>Your last document is ready with OCR and speech controls built into the reading flow.</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue reading The Art of Stillness"
          testID="home-continue-reading"
          onPress={() => router.push('/reader')}
          style={({ pressed }) => [styles.heroAction, { backgroundColor: colors.primary }, pressed && styles.pressed]}
        >
          <Feather name="play" size={15} color={colors.primaryForeground} />
          <Text style={[styles.heroActionText, { color: colors.primaryForeground }]}>Continue reading</Text>
        </Pressable>
      </LinearGradient>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent documents</Text>
          <Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>Two files in your local library</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showAllDocs ? 'Show fewer documents' : 'Show all documents'}
          testID="home-show-documents"
          onPress={() => setShowAllDocs((value) => !value)}
          style={styles.textAction}
        >
          <Text style={[styles.seeAll, { color: colors.primary }]}>{showAllDocs ? 'Show less' : 'See all'}</Text>
        </Pressable>
      </View>
      {(showAllDocs ? ['The Art of Stillness', 'Hindi Vyakaran Guide'] : ['The Art of Stillness']).map((title, index) => (
        <Pressable
          key={title}
          accessibilityRole="button"
          accessibilityLabel={`Resume ${title}`}
          testID={`home-document-${index}`}
          onPress={() => router.push('/reader')}
          style={({ pressed }) => [styles.document, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}
        >
          <View style={[styles.documentCover, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="book-open-page-variant" size={25} color={index === 0 ? colors.primary : colors.accent} />
          </View>
          <View style={styles.documentCopy}>
            <Text style={[styles.documentTitle, { color: colors.foreground }]} numberOfLines={1}>{title}</Text>
            <Text style={[styles.documentMeta, { color: colors.mutedForeground }]}>{index === 0 ? 'PDF · 42 min remaining' : 'PDF · 18 min remaining'}</Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}><View style={[styles.progressFill, { backgroundColor: index === 0 ? colors.primary : colors.accent, width: index === 0 ? '68%' : '31%' }]} /></View>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>
      ))}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tools</Text>
          <Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>Focused utilities, no busywork</Text>
        </View>
        <Ionicons name="grid-outline" size={18} color={colors.mutedForeground} />
      </View>
      <View style={styles.grid}>
        {visibleTools.map((tool) => <ToolCard key={tool.id} tool={tool} onPress={() => openTool(tool)} />)}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={showAllTools ? 'Collapse tools' : 'Show all tools'}
        testID="home-show-tools"
        onPress={() => setShowAllTools((value) => !value)}
        style={({ pressed }) => [styles.expandButton, { borderColor: colors.border }, pressed && styles.pressed]}
      >
        <Feather name={showAllTools ? 'chevron-up' : 'chevron-down'} size={17} color={colors.primary} />
        <Text style={[styles.expandText, { color: colors.primary }]}>{showAllTools ? 'Show fewer tools' : 'Show all tools'}</Text>
      </Pressable>
      <View style={[styles.privacyNote, { borderColor: colors.border }]}>
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
        <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>Local first. Your files stay on this device.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 26 },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  eyebrow: { fontSize: 11, letterSpacing: 2.1, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  location: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  iconButton: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { paddingHorizontal: 20, marginBottom: 20 },
  title: { fontSize: 31, lineHeight: 35, fontFamily: 'Inter_700Bold', letterSpacing: -0.6, marginBottom: 10 },
  subtitle: { maxWidth: 340, fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular' },
  hero: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 28 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 17 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 10, letterSpacing: 1.1, fontFamily: 'Inter_700Bold' },
  heroTitle: { fontSize: 21, lineHeight: 26, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  heroBody: { maxWidth: 315, fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular' },
  heroAction: { alignSelf: 'flex-start', flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 13, paddingVertical: 11, borderRadius: 10, marginTop: 17 },
  heroActionText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  sectionMeta: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  textAction: { padding: 5 },
  seeAll: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  document: { marginHorizontal: 20, borderRadius: 15, borderWidth: 1, padding: 11, flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  documentCover: { width: 49, height: 58, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  documentCopy: { flex: 1, marginLeft: 12, marginRight: 10 },
  documentTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  documentMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 9 },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  toolCard: { width: '48.4%', minHeight: 132, borderRadius: 15, borderWidth: 1, padding: 13 },
  toolIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  toolLabel: { fontSize: 13, lineHeight: 17, fontFamily: 'Inter_600SemiBold', paddingRight: 14 },
  toolDetail: { fontSize: 11, lineHeight: 15, fontFamily: 'Inter_400Regular', marginTop: 4 },
  toolArrow: { position: 'absolute', top: 14, right: 13 },
  expandButton: { marginHorizontal: 20, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, marginTop: 12 },
  expandText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  privacyNote: { marginHorizontal: 20, marginTop: 22, borderTopWidth: 1, paddingTop: 15, flexDirection: 'row', alignItems: 'center', gap: 8 },
  privacyText: { fontSize: 11, fontFamily: 'Inter_400Regular', flex: 1 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
});