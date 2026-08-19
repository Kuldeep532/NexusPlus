import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export type DownloadedVoice = {
  id: string;
  name: string;
  language: string;
  downloaded: boolean;
};

const STORAGE_KEY = 'nexus-plus.downloaded-voices';
const BUILT_IN_VOICES: DownloadedVoice[] = [
  { id: 'en-us-default', name: 'English US', language: 'en-US', downloaded: true },
  { id: 'en-in-default', name: 'English India', language: 'en-IN', downloaded: true },
  { id: 'hi-in-default', name: 'Hindi India', language: 'hi-IN', downloaded: true },
];

async function readDownloadedVoices(): Promise<DownloadedVoice[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return BUILT_IN_VOICES;
  try {
    const parsed = JSON.parse(stored) as DownloadedVoice[];
    return Array.isArray(parsed) && parsed.length ? parsed.filter((voice) => voice.downloaded) : BUILT_IN_VOICES;
  } catch {
    return BUILT_IN_VOICES;
  }
}

export async function getDownloadedVoices() {
  return readDownloadedVoices();
}

export default function VoicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [voices, setVoices] = useState<DownloadedVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    let active = true;
    getDownloadedVoices().then((items) => {
      if (!active) return;
      setVoices(items);
      setSelectedId(items[0]?.id ?? '');
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const selectedName = useMemo(() => voices.find((voice) => voice.id === selectedId)?.name ?? 'None', [voices, selectedId]);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 32 }}>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: colors.primary }]}>VOICE LIBRARY</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Downloaded Voices</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Reader voice selection is limited to voices saved in Settings.</Text>
      </View>

      <View style={[styles.activeCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={[styles.activeIcon, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="account-voice" size={23} color={colors.primary} />
        </View>
        <View style={styles.activeCopy}>
          <Text style={[styles.activeLabel, { color: colors.mutedForeground }]}>CURRENT VOICE</Text>
          <Text style={[styles.activeName, { color: colors.foreground }]}>{selectedName}</Text>
        </View>
      </View>

      {loading ? <ActivityIndicator accessibilityLabel="Loading downloaded voices" color={colors.primary} style={{ marginTop: 30 }} /> : voices.map((voice) => (
        <Pressable
          key={voice.id}
          accessibilityRole="radio"
          accessibilityState={{ selected: selectedId === voice.id }}
          accessibilityLabel={`${voice.name}, ${voice.language}, downloaded`}
          onPress={() => setSelectedId(voice.id)}
          style={({ pressed }) => [styles.row, { backgroundColor: colors.card, borderColor: selectedId === voice.id ? colors.primary : colors.border }, pressed && styles.pressed]}
        >
          <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="volume-2" size={19} color={colors.primary} /></View>
          <View style={styles.copy}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{voice.name}</Text>
            <Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>{voice.language} · Downloaded</Text>
          </View>
          <Feather name={selectedId === voice.id ? 'check-circle' : 'circle'} size={21} color={selectedId === voice.id ? colors.primary : colors.mutedForeground} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 18 },
  kicker: { fontSize: 10, letterSpacing: 1.8, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  title: { fontSize: 29, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  subtitle: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  activeCard: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  activeIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  activeCopy: { marginLeft: 11 },
  activeLabel: { fontSize: 9, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  activeName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  row: { marginHorizontal: 20, minHeight: 74, borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginHorizontal: 11 },
  rowTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  rowDetail: { fontSize: 10.5, fontFamily: 'Inter_400Regular' },
  pressed: { opacity: 0.75 },
});
