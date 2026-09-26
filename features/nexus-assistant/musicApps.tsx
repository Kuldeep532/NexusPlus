import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { listInstalledMusicApps } from './musicIntent';

export function MusicAppsPanel({ selectedPackage, onSelect }: { selectedPackage?: string; onSelect: (packageName: string | undefined) => void }) {
  const colors = useColors();
  const [apps, setApps] = useState<Array<{ packageName: string; label: string }>>([]);

  useEffect(() => {
    void listInstalledMusicApps().then(setApps).catch(() => setApps([]));
  }, []);

  if (!apps.length) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Music Apps</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Choose an installed music app for Nexus Assistant commands.</Text>
      <View style={styles.row}>
        {apps.map((app) => {
          const selected = selectedPackage === app.packageName;
          return (
            <Pressable
              key={app.packageName}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${app.label}${selected ? ', selected' : ''}`}
              onPress={() => onSelect(selected ? undefined : app.packageName)}
              style={[styles.app, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background }]}
            >
              <Feather name="music" size={18} color={colors.foreground} />
              <Text style={[styles.appName, { color: colors.foreground }]}>{app.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginBottom: 8, padding: 12, borderWidth: 1, borderRadius: 16, gap: 6 },
  title: { fontSize: 16, fontWeight: '800' },
  subtitle: { fontSize: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  app: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  appName: { fontSize: 13, fontWeight: '700' },
});
