import { Feather } from '@expo/vector-icons';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function AboutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 25, paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={[styles.mark, { backgroundColor: colors.primary }]}>
          <Text style={[styles.markText, { color: colors.primaryForeground }]}>N</Text>
        </View>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus Plus</Text>
        <Text style={[styles.version, { color: colors.primary }]}>VERSION 1.0.0</Text>
        <Text style={[styles.lead, { color: colors.mutedForeground }]}>A practical reading companion for documents, voices, and the work in between.</Text>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.panelHeading}>
          <Feather name="shield" size={17} color={colors.primary} />
          <Text style={[styles.panelTitle, { color: colors.foreground }]}>Private by default</Text>
        </View>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Nexus Plus keeps your books, images, and audio on this device. There is no account to create and no personal data collection.</Text>
      </View>
      <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.panelHeading}>
          <Feather name="sliders" size={17} color={colors.accent} />
          <Text style={[styles.panelTitle, { color: colors.foreground }]}>Built for access</Text>
        </View>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>OCR, adjustable playback, offline voices, and focused conversion tools live together so fewer steps stand between you and the content.</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Email Nexus Plus support"
        testID="about-contact-support"
        onPress={() => Linking.openURL('mailto:kuldeepky538@gmail.com')}
        style={({ pressed }) => [styles.support, { backgroundColor: colors.primary }, pressed && styles.pressed]}
      >
        <Feather name="mail" size={18} color={colors.primaryForeground} />
        <Text style={[styles.supportText, { color: colors.primaryForeground }]}>Contact support</Text>
      </Pressable>
      <Text style={[styles.legal, { color: colors.mutedForeground }]}>Privacy first. Version 1.0.0.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingHorizontal: 28, marginBottom: 27 },
  mark: { width: 70, height: 70, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 17 },
  markText: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  version: { fontSize: 10, letterSpacing: 1.5, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  lead: { textAlign: 'center', fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular' },
  panel: { marginHorizontal: 20, padding: 17, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  panelHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
  panelTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  body: { fontSize: 13, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  support: { marginHorizontal: 20, borderRadius: 13, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 9 },
  supportText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  legal: { textAlign: 'center', fontSize: 11, marginTop: 20, fontFamily: 'Inter_400Regular' },
  pressed: { opacity: 0.75 },
});