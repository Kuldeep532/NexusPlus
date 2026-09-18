import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useColors } from '@/hooks/useColors';
import * as Speech from 'expo-speech';
import { speakWithPiper } from '@/features/time-announcer/piperTts';

export default function DiscoverWebViewScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ url?: string; title?: string; summary?: string; language?: string }>();
  const url = typeof params.url === 'string' ? params.url : '';
  const title = typeof params.title === 'string' ? params.title : 'Article';
  const summary = typeof params.summary === 'string' ? params.summary : '';
  const [speaking, setSpeaking] = useState(false);

  const listen = async () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    const text = [title, summary].filter(Boolean).join('. ').trim();
    if (!text) return;
    setSpeaking(true);
    try {
      const language = typeof params.language === 'string' && params.language.toLowerCase().startsWith('hi') ? 'hi' : 'en';
      const spoken = await speakWithPiper(text, language);
      if (!spoken) Speech.speak(text, { language: language === 'hi' ? 'hi-IN' : 'en-IN' });
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.toolbar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to Discover" onPress={() => router.back()} style={styles.button}>
          <Feather name="arrow-left" size={21} color={colors.foreground} />
        </Pressable>
        <View style={styles.titleWrap}><Text numberOfLines={2} style={[styles.title, { color: colors.foreground }]}>{title}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={speaking ? 'Stop listening' : 'Listen to article summary'} onPress={() => void listen()} style={[styles.listen, { backgroundColor: colors.secondary }]}>
          <Feather name={speaking ? 'square' : 'volume-2'} size={18} color={colors.primary} />
          <Text style={[styles.listenText, { color: colors.foreground }]}>{speaking ? 'Stop' : 'Listen'}</Text>
        </Pressable>
      </View>
      <WebView
        source={{ uri: url }}
        style={styles.web}
        startInLoadingState
        accessibilityLabel="News article web view"
        allowsBackForwardNavigationGestures
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  toolbar: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingHorizontal: 8, gap: 8 },
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1 },
  title: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  listen: { minHeight: 42, borderRadius: 13, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 6 },
  listenText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  web: { flex: 1 },
});
