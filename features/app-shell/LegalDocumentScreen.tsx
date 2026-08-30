import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Section = { title: string; body: string };

type Props = {
  title: string;
  subtitle: string;
  sections: Section[];
};

export function LegalDocumentScreen({ title, subtitle, sections }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28 }}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.iconSlot}>
              <Feather name="arrow-left" size={21} color={colors.foreground} />
            </Pressable>
            <Text accessibilityRole="header" style={[styles.header, { color: colors.foreground }]}>{title}</Text>
            <View style={styles.iconSlot}><Feather name="shield" size={20} color={colors.primary} accessibilityElementsHidden /></View>
          </View>
          <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
            <Text style={[styles.updated, { color: colors.primary }]}>Last updated: 30 August 2026</Text>
          </View>
          {sections.map((section) => (
            <View key={section.title} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{section.title}</Text>
              <Text selectable style={[styles.body, { color: colors.mutedForeground }]}>{section.body}</Text>
            </View>
          ))}
          <Text style={[styles.footer, { color: colors.mutedForeground }]}>Nexus Plus • Nexus Wave Technologies</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 18 },
  topBar: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconSlot: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  header: { flex: 1, textAlign: 'center', fontSize: 20, fontFamily: 'Inter_700Bold' },
  hero: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 },
  subtitle: { fontSize: 13, lineHeight: 20 },
  updated: { marginTop: 10, fontSize: 11, fontFamily: 'Inter_700Bold' },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 12 },
  sectionTitle: { fontSize: 15, lineHeight: 21, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  body: { fontSize: 12, lineHeight: 19 },
  footer: { fontSize: 11, textAlign: 'center', marginTop: 22, marginBottom: 8 },
});
