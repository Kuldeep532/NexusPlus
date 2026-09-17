import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { runStaticAppHealthChecks } from '@/features/app-stability/appHealth';

export default function AppHealthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const checks = runStaticAppHealthChecks();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28 }} accessibilityLabel="App Health">
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconButton}><Feather name="arrow-left" size={22} color={colors.foreground} /></Pressable>
          <Text accessibilityRole="header" style={[styles.headerTitle, { color: colors.foreground }]}>App Health</Text>
          <View style={styles.iconButton} />
        </View>
        <View style={styles.hero}>
          <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="activity" size={25} color={colors.primary} /></View>
          <Text style={[styles.title, { color: colors.foreground }]}>Nexus Plus stability</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>A lightweight diagnostics view for release-readiness checks. It does not modify app data or settings.</Text>
        </View>
        <View style={styles.list}>
          {checks.map((check) => {
            const icon = check.status === 'PASS' ? 'check-circle' : check.status === 'WARN' ? 'alert-triangle' : 'x-circle';
            const tone = check.status === 'PASS' ? colors.primary : check.status === 'WARN' ? colors.accent : colors.destructive;
            return (
              <View key={check.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.row}>
                  <Feather name={icon} size={20} color={tone} />
                  <View style={styles.copy}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{check.title}</Text>
                    <Text style={[styles.body, { color: colors.mutedForeground }]}>{check.detail}</Text>
                  </View>
                  <Text style={[styles.status, { color: tone }]}>{check.status}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 19, fontFamily: 'Inter_700Bold' },
  hero: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 20, paddingBottom: 22 },
  icon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 24, lineHeight: 30, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  body: { fontSize: 11.5, lineHeight: 17, marginTop: 6 },
  list: { paddingHorizontal: 16, gap: 10 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  copy: { flex: 1 },
  cardTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  status: { fontSize: 9, fontFamily: 'Inter_700Bold' },
});
