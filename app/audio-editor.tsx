import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getAudioEditorTools } from '@/features/audio-editor/audioEditorRegistry';

export default function AudioEditorScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tools = getAudioEditorTools();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}
      accessibilityLabel="Audio Editor"
    >
      <Stack.Screen options={{ title: 'Audio Editor' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="edit-3" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Audio Editor</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Professional audio editing tools, organized one feature per screen.</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Editing tools</Text>
      <View style={styles.list}>
        {tools.map((tool) => (
          <Pressable
            key={tool.id}
            accessibilityRole="button"
            accessibilityLabel={`${tool.title}. ${tool.description}`}
            onPress={() => router.push(tool.route as never)}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
              <Feather name={tool.icon as never} size={20} color={colors.primary} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{tool.title}</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>{tool.description}</Text>
            </View>
            <Feather name="chevron-right" size={19} color={colors.mutedForeground} accessibilityElementsHidden />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 14 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  subtitle: { fontSize: 11.5, lineHeight: 17 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  list: { gap: 10 },
  card: { minHeight: 80, borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 12, marginRight: 8 },
  cardTitle: { fontSize: 13.5, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  description: { fontSize: 11, lineHeight: 16 },
});
