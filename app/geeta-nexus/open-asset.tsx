import { Feather } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getOpenAsset, type OpenAssetId } from '@/features/geeta-nexus/openAssets';

export default function OpenAssetDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) as OpenAssetId | undefined;
  const asset = useMemo(() => id ? getOpenAsset(id) : undefined, [id]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 14, paddingBottom: insets.bottom + 28 }}>
        <View style={styles.header}>
          <Feather name="book-open" size={22} color={colors.primary} />
          <View style={styles.copy}>
            <Text style={[styles.kicker, { color: colors.primary }]}>OPEN ASSETS</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>{asset?.title ?? 'Asset'}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{asset?.subtitle ?? 'Dataset'}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.primary }]}>DATASET INCLUDED IN NEXUS PLUS</Text>
          <Text style={[styles.body, { color: colors.foreground }]}>{asset?.description ?? 'This dataset could not be found.'}</Text>
          {asset && <Text style={[styles.source, { color: colors.mutedForeground }]}>Source file: {asset.sourceFile}</Text>}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.primary }]}>CONTENT</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            {asset
              ? `The Open Assets catalog contains ${asset.entryCount} supplied entries. The catalog is kept separate from the main Geeta reader so additional sacred-text datasets can be added without changing the reader flow.`
              : 'Return to Open Assets and choose a dataset.'}
          </Text>
        </View>

        <Text onPress={() => router.replace('/open-assets' as never)} accessibilityRole="button" style={[styles.backText, { color: colors.primary }]}>
          ← Back to Open Assets
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  copy: { flex: 1, paddingLeft: 12 },
  kicker: { fontSize: 9.5, letterSpacing: 1.5, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  title: { fontSize: 25, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  subtitle: { fontSize: 11 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 },
  label: { fontSize: 9.5, letterSpacing: 1.2, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  body: { fontSize: 12, lineHeight: 19 },
  source: { fontSize: 9.5, marginTop: 12 },
  backText: { fontSize: 12, fontFamily: 'Inter_700Bold', paddingVertical: 12 },
});
