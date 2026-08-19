import { Feather } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Section = { heading: string; body: string };

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Section[];
};

export function LegalPage({ eyebrow, title, intro, sections }: LegalPageProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.intro, { color: colors.mutedForeground }]}>{intro}</Text>

      <View style={[styles.document, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {sections.map((section, index) => (
          <View key={section.heading} style={[styles.section, index > 0 && styles.sectionBorder, index > 0 && { borderTopColor: colors.border }]}>
            <View style={[styles.marker, { backgroundColor: colors.secondary }]}>
              <Feather name="file-text" size={16} color={colors.primary} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.heading, { color: colors.foreground }]}>{section.heading}</Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>{section.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  eyebrow: { fontSize: 10, letterSpacing: 2, fontFamily: 'Inter_700Bold', marginBottom: 9 },
  title: { fontSize: 30, lineHeight: 36, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  intro: { fontSize: 13, lineHeight: 20, fontFamily: 'Inter_400Regular', marginBottom: 20 },
  document: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  section: { flexDirection: 'row', padding: 16 },
  sectionBorder: { borderTopWidth: 1 },
  marker: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 12 },
  heading: { fontSize: 14, lineHeight: 19, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  body: { fontSize: 12, lineHeight: 19, fontFamily: 'Inter_400Regular' },
});
