import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { VOICE_CATALOG, VOICE_CATALOG_COUNT, type VoiceCatalogItem } from '@/features/voice-library/voiceCatalog';
import { downloadVoice, getInstalledVoices, removeVoice, type InstalledVoice } from '@/features/voice-library/voiceStore';

const languageFilters = ['All', ...Array.from(new Set(VOICE_CATALOG.map((voice) => voice.languageName)))];

type Filter = 'all' | 'female' | 'male' | 'downloaded';

export default function VoicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [installed, setInstalled] = useState<InstalledVoice[]>([]);
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('All');
  const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    void getInstalledVoices().then(setInstalled);
  }, []);

  const installedIds = useMemo(() => new Set(installed.map((voice) => voice.id)), [installed]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VOICE_CATALOG.filter((voice) => {
      const matchesQuery = !q || `${voice.name} ${voice.languageName} ${voice.language}`.toLowerCase().includes(q);
      const matchesLanguage = language === 'All' || voice.languageName === language;
      const matchesFilter = filter === 'all' || (filter === 'downloaded' ? installedIds.has(voice.id) : voice.gender === filter);
      return matchesQuery && matchesLanguage && matchesFilter;
    });
  }, [query, language, filter, installedIds]);

  const install = async (voice: VoiceCatalogItem) => {
    setBusy((state) => ({ ...state, [voice.id]: true }));
    try {
      await downloadVoice(voice, (state) => {
        const total = state.totalBytes || 1;
        setProgress((current) => ({ ...current, [state.voiceId]: Math.min(100, Math.round((state.downloadedBytes / total) * 100)) }));
      });
      setInstalled(await getInstalledVoices());
    } finally {
      setBusy((state) => ({ ...state, [voice.id]: false }));
      setProgress((state) => ({ ...state, [voice.id]: 100 }));
    }
  };

  const uninstall = async (voice: VoiceCatalogItem) => {
    setBusy((state) => ({ ...state, [voice.id]: true }));
    try {
      await removeVoice(voice.id);
      setInstalled(await getInstalledVoices());
    } finally {
      setBusy((state) => ({ ...state, [voice.id]: false }));
    }
  };

  return (
    <ScrollView
      accessible={false}
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: colors.primary }]}>VOICE LIBRARY</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Download Voices</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {VOICE_CATALOG_COUNT}+ voices. Download any number of languages and voices. Large voice models stay outside the APK and are stored locally after download.
        </Text>
      </View>

      <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]} accessible accessibilityRole="text" accessibilityLabel={`${installed.length} voices downloaded. ${VOICE_CATALOG_COUNT} voices available.`}>
        <View><Text style={[styles.summaryNumber, { color: colors.foreground }]}>{installed.length}</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Downloaded</Text></View>
        <View><Text style={[styles.summaryNumber, { color: colors.foreground }]}>{VOICE_CATALOG_COUNT}+</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Available</Text></View>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          accessibilityLabel="Search voices by name or language"
          accessibilityHint="Type a voice name, language, or locale"
          value={query}
          onChangeText={setQuery}
          placeholder="Search voices or languages"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Clear voice search" onPress={() => setQuery('')}><Feather name="x-circle" size={18} color={colors.mutedForeground} /></Pressable>}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} accessibilityRole="tablist">
        {[
          ['all', 'All'],
          ['female', 'Female'],
          ['male', 'Male'],
          ['downloaded', 'Downloaded'],
        ].map(([id, label]) => (
          <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: filter === id }} accessibilityLabel={`${label} voices`} onPress={() => setFilter(id as Filter)} style={[styles.filterChip, { backgroundColor: filter === id ? colors.primary : colors.card, borderColor: colors.border }]}>
            <Text style={[styles.filterText, { color: filter === id ? colors.primaryForeground : colors.foreground }]}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} accessibilityRole="tablist">
        {languageFilters.map((item) => (
          <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: language === item }} accessibilityLabel={`${item} language`} onPress={() => setLanguage(item)} style={[styles.filterChip, { backgroundColor: language === item ? colors.secondary : colors.card, borderColor: colors.border }]}>
            <Text style={[styles.filterText, { color: colors.foreground }]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>{filtered.length} voices shown</Text>

      <View style={styles.list}>
        {filtered.map((voice) => {
          const isInstalled = installedIds.has(voice.id);
          const isBusy = !!busy[voice.id];
          const percent = progress[voice.id] ?? 0;
          return (
            <View key={voice.id} style={[styles.voiceRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
                <MaterialCommunityIcons name={voice.gender === 'female' ? 'account-voice' : 'account-voice-outline'} size={20} color={colors.primary} />
              </View>
              <View style={styles.copy} accessible accessibilityRole="text" accessibilityLabel={`${voice.name}, ${voice.languageName}, ${voice.gender}, ${voice.quality} quality. ${isInstalled ? 'Downloaded' : 'Not downloaded'}`}>
                <Text style={[styles.voiceName, { color: colors.foreground }]}>{voice.name}</Text>
                <Text style={[styles.voiceDetail, { color: colors.mutedForeground }]}>{voice.languageName} · {voice.language} · {voice.gender} · {voice.quality} quality</Text>
                {isBusy && <Text style={[styles.progressText, { color: colors.primary }]}>{percent}% downloaded</Text>}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isInstalled ? `Remove ${voice.name}` : `Download ${voice.name}`}
                accessibilityState={{ busy: isBusy }}
                disabled={isBusy}
                onPress={() => void (isInstalled ? uninstall(voice) : install(voice))}
                style={[styles.actionButton, { borderColor: colors.border, backgroundColor: isInstalled ? colors.secondary : colors.primary, opacity: isBusy ? 0.55 : 1 }]}
              >
                <Feather name={isInstalled ? 'check' : 'download'} size={16} color={isInstalled ? colors.primary : colors.primaryForeground} />
                <Text style={[styles.actionText, { color: isInstalled ? colors.foreground : colors.primaryForeground }]}>{isBusy ? `${percent}%` : isInstalled ? 'Remove' : 'Download'}</Text>
              </Pressable>
            </View>
          );
        })}
        {filtered.length === 0 && <Text style={[styles.empty, { color: colors.mutedForeground }]}>No voices match your search and filters.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 18 },
  kicker: { fontSize: 10, letterSpacing: 1.8, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  title: { fontSize: 29, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  subtitle: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  summary: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, padding: 15, flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  summaryNumber: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  summaryLabel: { marginTop: 3, fontSize: 10, textAlign: 'center' },
  searchBox: { marginHorizontal: 20, minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', paddingVertical: 0 },
  filterRow: { paddingHorizontal: 20, gap: 8, paddingVertical: 10 },
  filterChip: { minHeight: 38, borderRadius: 19, borderWidth: 1, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  resultCount: { marginHorizontal: 20, marginBottom: 8, fontSize: 11 },
  list: { paddingHorizontal: 20, gap: 9 },
  voiceRow: { minHeight: 78, borderRadius: 16, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginHorizontal: 10 },
  voiceName: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  voiceDetail: { fontSize: 10, lineHeight: 15 },
  progressText: { marginTop: 3, fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  actionButton: { minWidth: 82, minHeight: 40, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  actionText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  empty: { textAlign: 'center', paddingVertical: 28, fontSize: 12 },
});