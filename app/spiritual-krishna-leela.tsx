import * as Speech from 'expo-speech';
import { Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useColors } from '@/hooks/useColors';
import { KRISHNA_LEELA_STORIES, type KrishnaLeelaStory } from '@/features/spiritual/krishnaLeelaCatalog';

export default function KrishnaLeelaScreen() {
  const colors = useColors();
  const [selected, setSelected] = useState<KrishnaLeelaStory>(KRISHNA_LEELA_STORIES[0]);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => { Speech.stop(); }, []);

  const speak = async () => {
    await Speech.stop();
    setSpeaking(true);
    Speech.speak(selected.text, {
      language: 'hi-IN',
      rate: 0.82,
      pitch: 1.0,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const stop = async () => {
    await Speech.stop();
    setSpeaking(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'कृष्ण लीला' }} />
      <ScrollView
        accessibilityLabel="कृष्ण लीला"
        contentContainerStyle={styles.content}
      >
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>
          कृष्ण लीला
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          बालकृष्ण की सरल और लोकप्रिय कथाएँ। कहानी पढ़ें या हिंदी टेक्स्ट-टू-स्पीच से सुनें।
        </Text>

        <View accessibilityRole="tablist" style={styles.storyList}>
          {KRISHNA_LEELA_STORIES.map((story) => (
            <Pressable
              key={story.id}
              accessibilityRole="button"
              accessibilityState={{ selected: story.id === selected.id }}
              accessibilityLabel={story.title}
              onPress={() => {
                void Speech.stop();
                setSpeaking(false);
                setSelected(story);
              }}
              style={[
                styles.storyButton,
                {
                  backgroundColor: story.id === selected.id ? colors.secondary : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.storyTitle, { color: colors.foreground }]}>{story.title}</Text>
              <Text style={[styles.summary, { color: colors.mutedForeground }]}>{story.summary}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.reader, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.readerTitle, { color: colors.foreground }]}>
            {selected.title}
          </Text>
          <Text selectable style={[styles.body, { color: colors.foreground }]}>
            {selected.text}
          </Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={speaking ? 'कहानी सुनना रोकें' : 'कहानी सुनें'}
              onPress={() => void (speaking ? stop() : speak())}
              style={[styles.action, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.actionText, { color: colors.primaryForeground }]}>
                {speaking ? 'सुनना रोकें' : 'कहानी सुनें'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 18, paddingBottom: 40 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  subtitle: { fontSize: 12, lineHeight: 18, marginBottom: 18 },
  storyList: { gap: 10 },
  storyButton: { borderWidth: 1, borderRadius: 16, padding: 14 },
  storyTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  summary: { fontSize: 11, lineHeight: 16 },
  reader: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 14 },
  readerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  body: { fontSize: 16, lineHeight: 28 },
  actions: { marginTop: 16 },
  action: { minHeight: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  actionText: { fontFamily: 'Inter_700Bold' },
});
