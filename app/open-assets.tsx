import { Feather } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { OPEN_ASSETS, type OpenAssetId } from '@/features/geeta-nexus/openAssets';

export default function OpenAssetsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | 'Gita' | 'Upanishad'>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return OPEN_ASSETS.filter((asset) => {
      const matchesCategory = category === 'All' || asset.category === category;
      const matchesQuery = !q || [asset.title, asset.subtitle, asset.description, asset.sourceFile].join(' ').toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const openAsset = (id: OpenAssetId) => {
    if (id === 'bhagavad-gita') {
      router.push('/geeta-nexus/chapters' as never);
      return;
    }
    router.push(('/geeta-nexus/open-asset?id=' + id) as never);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 14, paddingBottom: insets.bottom + 28 }}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to Geeta Nexus" onPress={() => router.replace('/geeta-nexus' as never)} style={[styles.back, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.copy}>
            <Text style={[styles.kicker, { color: colors.primary }]}>GEETA NEXUS</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Open Assets</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Sacred-text datasets included with Nexus Plus. Browse the complete supplied collection without requiring an online source.</Text>
          </View>
        </View>

        <View style={[styles.searchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <Text
            accessibilityRole="search"
            accessibilityLabel="Search Open Assets"
            style={[styles.searchText, { color: colors.foreground }]}
            onPress={() => undefined}
          >
            {query || 'Use the filters below to browse the complete collection'}
          </Text>
        </View>

        <View style={styles.filters}>
          {(['All', 'Gita', 'Upanishad'] as const).map((item) => (
            <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: category === item }} onPress={() => setCategory(item)} style={[styles.filter, { backgroundColor: category === item ? colors.primary : colors.card, borderColor: category === item ? colors.primary : colors.border }]}>
              <Text style={{ color: category === item ? colors.primaryForeground : colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 11 }}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.summary, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <View><Text style={[styles.summaryNumber, { color: colors.foreground }]}>7</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Datasets</Text></View>
          <View><Text style={[styles.summaryNumber, { color: colors.foreground }]}>1,373</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Entries</Text></View>
          <View><Text style={[styles.summaryNumber, { color: colors.foreground }]}>Offline</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Reader model</Text></View>
        </View>

        <Text style={[styles.section, { color: colors.foreground }]}>Available assets</Text>
        <View style={styles.list}>
          {filtered.map((asset) => (
            <Pressable key={asset.id} accessibilityRole="button" accessibilityLabel={'Open ' + asset.title + '. ' + asset.subtitle} onPress={() => openAsset(asset.id)} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
                <Feather name={asset.category === 'Upanishad' ? 'compass' : 'book-open'} size={20} color={colors.primary} />
              </View>
              <View style={styles.copy}>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>{asset.title}</Text>
                <Text style={[styles.meta, { color: colors.primary }]}>{asset.subtitle} · {asset.category}</Text>
                <Text style={[styles.description, { color: colors.mutedForeground }]}>{asset.description}</Text>
                <Text style={[styles.source, { color: colors.mutedForeground }]}>Source: {asset.sourceFile}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  back: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, paddingLeft: 12 },
  kicker: { fontSize: 9.5, letterSpacing: 1.5, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  subtitle: { fontSize: 11.5, lineHeight: 18 },
  searchCard: { borderWidth: 1, borderRadius: 15, minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 10 },
  searchText: { flex: 1, marginLeft: 9, fontSize: 11.5 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filter: { minWidth: 72, minHeight: 38, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  summary: { borderWidth: 1, borderRadius: 17, padding: 14, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  summaryNumber: { fontSize: 17, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  summaryLabel: { fontSize: 9.5, marginTop: 3, textAlign: 'center' },
  section: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 9 },
  list: { gap: 9 },
  row: { minHeight: 92, borderWidth: 1, borderRadius: 17, padding: 12, flexDirection: 'row', alignItems: 'flex-start' },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  meta: { fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  description: { fontSize: 10.5, lineHeight: 15, marginBottom: 5 },
  source: { fontSize: 9 },
});
