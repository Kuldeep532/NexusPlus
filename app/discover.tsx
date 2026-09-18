import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CATEGORY_ICONS, CATEGORY_LABELS, fetchDiscoverItems, type DiscoverCategory, type DiscoverItem } from '@/features/discover/discoverFeeds';

const CATEGORIES: DiscoverCategory[] = ['top', 'world', 'technology', 'science'];

export default function DiscoverScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<DiscoverCategory>('top');
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const next = await fetchDiscoverItems(category);
      setItems(next);
      if (next.length === 0) setError('No feed items are available right now. Check your connection and refresh.');
    } catch {
      setError('Discover could not load the feeds right now.');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category]);

  useEffect(() => { void load(); }, [load]);

  const openItem = (item: DiscoverItem) => router.push({
    pathname: '/discover-article',
    params: { url: item.link, title: item.title, summary: item.summary, language: 'en-IN' },
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        accessibilityLabel="Nexus Discover news aggregator"
      >
        <View style={styles.header}>
          <View style={styles.headingCopy}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus Discover</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Live RSS headlines across world news, technology and science. Full articles open on the publisher site.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Refresh Discover feeds" onPress={() => void load(true)} style={[styles.refresh, { backgroundColor: colors.secondary }]}>
            <Feather name="refresh-cw" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((value) => {
            const selected = category === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={CATEGORY_LABELS[value] + ' category'}
                onPress={() => setCategory(value)}
                style={[styles.category, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}
              >
                <Feather name={CATEGORY_ICONS[value] as never} size={16} color={selected ? colors.primaryForeground : colors.foreground} />
                <Text style={[styles.categoryText, { color: selected ? colors.primaryForeground : colors.foreground }]}>{CATEGORY_LABELS[value]}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading && <View accessible accessibilityRole="progressbar" style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.body, { color: colors.mutedForeground }]}>Loading live feeds…</Text></View>}
        {!!error && <View accessible accessibilityRole="alert" style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="info" size={18} color={colors.primary} /><Text style={[styles.body, { color: colors.foreground }]}>{error}</Text></View>}

        {!loading && items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.title + '. Source: ' + item.source}
            accessibilityHint="Opens the original article inside Nexus Discover"
            onPress={() => openItem(item)}
            style={[styles.article, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.articleTop}>
              <View style={[styles.sourceBadge, { backgroundColor: colors.secondary }]}><Text style={[styles.sourceText, { color: colors.primary }]}>{item.source}</Text></View>
              <Text style={[styles.date, { color: colors.mutedForeground }]}>{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : 'Latest'}</Text>
            </View>
            <Text style={[styles.articleTitle, { color: colors.foreground }]}>{item.title}</Text>
            {!!item.summary && <Text numberOfLines={4} style={[styles.summary, { color: colors.mutedForeground }]}>{item.summary}</Text>}
            <View style={styles.openRow}><Text style={[styles.openText, { color: colors.primary }]}>Read original article</Text><Feather name="arrow-up-right" size={16} color={colors.primary} /></View>
          </Pressable>
        ))}

        <View style={[styles.attribution, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="link" size={16} color={colors.primary} />
          <Text style={[styles.body, { color: colors.foreground }]}>Nexus Discover shows feed-provided headlines/summaries and links to each publisher. It does not republish full articles. Publisher attribution remains visible.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  headingCopy: { flex: 1, paddingRight: 10 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 11, lineHeight: 16, marginTop: 5 },
  refresh: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  categoryRow: { gap: 8, paddingBottom: 8 },
  category: { minHeight: 42, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  stateCard: { minHeight: 62, marginTop: 8, borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  article: { marginTop: 10, borderWidth: 1, borderRadius: 17, padding: 13 },
  articleTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sourceBadge: { borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5, flexShrink: 1 },
  sourceText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  date: { fontSize: 9, flexShrink: 1 },
  articleTitle: { fontSize: 15, lineHeight: 20, fontFamily: 'Inter_700Bold', marginTop: 10 },
  summary: { fontSize: 11, lineHeight: 16, marginTop: 7 },
  openRow: { marginTop: 11, flexDirection: 'row', alignItems: 'center', gap: 5 },
  openText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  attribution: { marginTop: 12, borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  body: { fontSize: 10.5, lineHeight: 16, flex: 1 },
});
