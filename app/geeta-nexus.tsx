import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { ScrollView, Pressable, StyleSheet, Text, View, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { GITA_CHAPTERS } from '@/features/geeta-nexus/geetaTypes';
import { loadCachedVerseBundle } from '@/features/geeta-nexus/geetaStage5Repository';
import { getDailySpiritualMessage } from '@/features/spiritual/spiritualMessageLibrary';
import { readLaunchPreferences, writeLaunchPreferences, type LaunchTarget } from '@/features/app-shell/launchPreferences';
import { useEffect, useState } from 'react';

export default function GeetaNexusHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const daily = getDailySpiritualMessage();
  const [cachedVerses, setCachedVerses] = useState(0);
  const [cacheVersion, setCacheVersion] = useState<string | null>(null);
  const [launchTarget, setLaunchTarget] = useState<LaunchTarget>('nexus-plus');
  const [showGeetaNexusOnHome, setShowGeetaNexusOnHome] = useState(true);

  useEffect(() => {
    let active = true;
    void loadCachedVerseBundle().then((bundle) => {
      if (!active || !bundle) return;
      setCachedVerses(bundle.verses.length);
      setCacheVersion(bundle.version);
    });
    void readLaunchPreferences().then((preferences) => {
      if (!active) return;
      setLaunchTarget(preferences.launchTarget);
      setShowGeetaNexusOnHome(preferences.showGeetaNexusOnHome);
    });
    return () => { active = false; };
  }, []);

  const saveLaunchTarget = async (target: LaunchTarget) => {
    setLaunchTarget(target);
    await writeLaunchPreferences({ launchTarget: target, showGeetaNexusOnHome });
  };

  const saveHomeVisibility = async (value: boolean) => {
    setShowGeetaNexusOnHome(value);
    await writeLaunchPreferences({ launchTarget, showGeetaNexusOnHome: value });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 18, paddingBottom: insets.bottom + 90 }}>
        <View style={styles.topRow}>
          <View style={styles.headerCopy}>
            <Text style={[styles.kicker, { color: colors.primary }]}>GEETA NEXUS</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Bhagavad Gita</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Study, listen and explore the Gita offline.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open Geeta Nexus settings" onPress={() => router.push('/settings' as never)} style={[styles.settingsButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="settings" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="flower" size={24} color={colors.primary} />
          <View style={styles.messageCopy}>
            <Text style={[styles.cardKicker, { color: colors.primary }]}>TODAY'S REFLECTION</Text>
            <Text style={[styles.message, { color: colors.foreground }]}>{daily.text}</Text>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View><Text style={[styles.statNumber, { color: colors.foreground }]}>18</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Chapters</Text></View>
          <View><Text style={[styles.statNumber, { color: colors.foreground }]}>{cachedVerses || '—'}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Cached verses</Text></View>
          <View><Text style={[styles.statNumber, { color: colors.foreground }]}>{cacheVersion ? 'Offline' : 'Ready'}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{cacheVersion ? `v${cacheVersion}` : 'Library'}</Text></View>
        </View>

        <View style={[styles.controlCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select One to Open</Text>
          <Text style={[styles.controlHelp, { color: colors.mutedForeground }]}>Choose which experience opens after the splash screen.</Text>
          <View style={styles.choiceRow}>
            <Pressable accessibilityRole="radio" accessibilityState={{ selected: launchTarget === 'nexus-plus' }} onPress={() => void saveLaunchTarget('nexus-plus')} style={[styles.choice, { borderColor: launchTarget === 'nexus-plus' ? colors.primary : colors.border, backgroundColor: launchTarget === 'nexus-plus' ? colors.secondary : colors.card }]}><Text style={[styles.choiceTitle, { color: colors.foreground }]}>Nexus Plus</Text><Text style={[styles.choiceBody, { color: colors.mutedForeground }]}>Main app</Text></Pressable>
            <Pressable accessibilityRole="radio" accessibilityState={{ selected: launchTarget === 'geeta-nexus' }} onPress={() => void saveLaunchTarget('geeta-nexus')} style={[styles.choice, { borderColor: launchTarget === 'geeta-nexus' ? colors.primary : colors.border, backgroundColor: launchTarget === 'geeta-nexus' ? colors.secondary : colors.card }]}><Text style={[styles.choiceTitle, { color: colors.foreground }]}>Geeta Nexus</Text><Text style={[styles.choiceBody, { color: colors.mutedForeground }]}>Gita app</Text></Pressable>
          </View>
          <View style={styles.row}><View style={styles.copy}><Text style={[styles.choiceTitle, { color: colors.foreground }]}>Show Geeta Nexus on Nexus Plus Home</Text><Text style={[styles.choiceBody, { color: colors.mutedForeground }]}>Keep both experiences accessible from Home.</Text></View><Switch value={showGeetaNexusOnHome} onValueChange={(value) => { void saveHomeVisibility(value); }} accessibilityLabel="Show Geeta Nexus on Nexus Plus Home" /></View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 22 }]}>Audio Chapters</Text>
        <View style={styles.list}>
          {GITA_CHAPTERS.map((chapter) => (
            <Pressable key={chapter.number} accessibilityRole="button" accessibilityLabel={`Open Chapter ${chapter.number}, ${chapter.nameEnglish}`} onPress={() => router.push(`/geeta-nexus/chapters?chapter=${chapter.number}` as never)} style={[styles.chapterRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="headphones" size={18} color={colors.primary} /></View>
              <View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Chapter {chapter.number}</Text><Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>{chapter.nameEnglish} · {chapter.verseCount} verses</Text></View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Geeta Nexus Home" style={styles.tab} onPress={() => router.replace('/geeta-nexus' as never)}><Feather name="home" size={20} color={colors.primary} /><Text style={[styles.tabLabel, { color: colors.primary }]}>Home</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Bhagavad Gita Chapters" style={styles.tab} onPress={() => router.push('/geeta-nexus/chapters' as never)}><Feather name="book" size={20} color={colors.foreground} /><Text style={[styles.tabLabel, { color: colors.foreground }]}>Chapters</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }, headerCopy: { flex: 1, paddingRight: 12 }, kicker: { fontSize: 10, letterSpacing: 1.7, fontFamily: 'Inter_700Bold', marginBottom: 6 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 4 }, subtitle: { fontSize: 12, lineHeight: 18, marginBottom: 18 }, settingsButton: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, messageCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'flex-start' }, messageCopy: { flex: 1, marginLeft: 11 }, cardKicker: { fontSize: 9, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 6 }, message: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_600SemiBold' }, statCard: { marginTop: 14, borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: 'row', justifyContent: 'space-between' }, statNumber: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 3 }, statLabel: { fontSize: 9.5 }, controlCard: { marginTop: 14, borderWidth: 1, borderRadius: 18, padding: 15 }, sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 8 }, controlHelp: { fontSize: 11, lineHeight: 16, marginBottom: 10 }, choiceRow: { flexDirection: 'row', gap: 8, marginBottom: 12 }, choice: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 11 }, choiceTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 3 }, choiceBody: { fontSize: 10, lineHeight: 15 }, row: { flexDirection: 'row', alignItems: 'center' }, copy: { flex: 1, marginRight: 10 }, list: { gap: 8 }, chapterRow: { minHeight: 68, borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center' }, icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, rowTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 }, rowMeta: { fontSize: 10, lineHeight: 15 }, bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 64, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 }, tab: { alignItems: 'center', justifyContent: 'center', minWidth: 110, gap: 3 }, tabLabel: { fontSize: 10, fontFamily: 'Inter_700Bold' }, });
