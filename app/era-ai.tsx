import { Feather } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { askEraAI, getEraHabitRecommendations } from '@/features/era-ai/eraAiService';
import { type EraLanguage, type EraRecommendation } from '@/features/era-ai/eraAiTypes';
import { scheduleEraRecommendationReminder } from '@/features/era-ai/eraAiReminder';

export default function EraAIScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [language, setLanguage] = useState<EraLanguage>('hi');
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [recommendations, setRecommendations] = useState<EraRecommendation[]>([]);
  const [status, setStatus] = useState('Era AI केवल आध्यात्मिक प्रश्नों के लिए है।');

  useEffect(() => {
    void getEraHabitRecommendations().then(setRecommendations).catch(() => setRecommendations([]));
  }, []);

  const ask = async () => {
    const question = input.trim();
    if (!question || busy) return;
    setBusy(true);
    setStatus(language === 'hi' ? 'Era AI उत्तर तैयार कर रहा है…' : 'Era AI is preparing a spiritual answer…');
    try {
      const result = await askEraAI({ message: question, language });
      setAnswer(result.text);
      setRecommendations(result.suggestions ?? []);
      setStatus(language === 'hi' ? 'आध्यात्मिक उत्तर तैयार है।' : 'Spiritual answer ready.');
      setInput('');
    } catch {
      setStatus(language === 'hi' ? 'अभी Era AI से उत्तर नहीं मिल पाया।' : 'Era AI could not answer right now.');
    } finally {
      setBusy(false);
    }
  };

  const useRecommendation = async (item: EraRecommendation) => {
    if (item.action === 'open-gita' && item.chapter && item.verse) {
      router.push(('/geeta-nexus/read?chapter=' + item.chapter + '&verse=' + item.verse) as never);
      return;
    }
    if (item.action === 'reminder' && item.reminderText) {
      try {
        await scheduleEraRecommendationReminder(item.reminderText);
        setStatus(language === 'hi' ? 'Era AI ने 5 मिनट का reminder लगा दिया है।' : 'Era AI scheduled a 5-minute reminder.');
      } catch {
        setStatus(language === 'hi' ? 'Reminder सेट नहीं हो पाया।' : 'The reminder could not be scheduled.');
      }
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to Nexus Plus" onPress={() => router.replace('/home' as never)} style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.kicker, { color: colors.primary }]}>ERA AI</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Spiritual AI</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {language === 'hi' ? 'केवल आध्यात्मिक जीवन-चिंतन, गीता और आदत सुधार के लिए।' : 'For spiritual reflection, Bhagavad Gita and habit improvement only.'}
            </Text>
          </View>
        </View>

        <View style={[styles.languageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.foreground }]}>Language</Text>
          <View style={styles.languageRow}>
            {(['hi', 'en'] as EraLanguage[]).map((item) => (
              <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: language === item }} onPress={() => setLanguage(item)} style={[styles.languageButton, { borderColor: language === item ? colors.primary : colors.border, backgroundColor: language === item ? colors.secondary : colors.background }]}>
                <Text style={[styles.languageText, { color: colors.foreground }]}>{item === 'hi' ? 'हिंदी' : 'English'}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.contextCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="heart" size={20} color={colors.primary} />
          <Text style={[styles.contextText, { color: colors.mutedForeground }]}>
            {language === 'hi'
              ? 'उदाहरण: “मेरी life में बहुत मुसीबतें हैं, क्या करूँ?” जैसे आध्यात्मिक प्रश्न पूछें। सामान्य chatbot काम के लिए Nexus Assistant इस्तेमाल करें।'
              : 'Example: “My life has many problems, what should I do?” Ask spiritual questions here. Use Nexus Assistant for general chatbot tasks.'}
          </Text>
        </View>

        <View style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            accessibilityLabel={language === 'hi' ? 'Era AI आध्यात्मिक प्रश्न' : 'Era AI spiritual question'}
            value={input}
            onChangeText={setInput}
            multiline
            placeholder={language === 'hi' ? 'अपना आध्यात्मिक प्रश्न लिखें…' : 'Ask a spiritual question…'}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <Pressable accessibilityRole="button" disabled={!input.trim() || busy} onPress={() => void ask()} style={[styles.askButton, { backgroundColor: colors.primary, opacity: !input.trim() || busy ? 0.5 : 1 }]}>
            {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <><Feather name="send" size={16} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Ask Era AI</Text></>}
          </Pressable>
        </View>

        <View accessibilityLiveRegion="polite" style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.primary }]}>ERA AI</Text>
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>{status}</Text>
        </View>

        {answer ? (
          <View style={[styles.answerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.answerTitle, { color: colors.foreground }]}>Era AI</Text>
            <Text selectable style={[styles.answerText, { color: colors.foreground }]}>{answer}</Text>
          </View>
        ) : null}

        {recommendations.length ? (
          <View style={[styles.recommendationsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.rowHeader}>
              <Text style={[styles.answerTitle, { color: colors.foreground }]}>Suggested for you</Text>
              <Feather name="sparkles" size={18} color={colors.primary} />
            </View>
            {recommendations.map((item) => (
              <View key={item.id} style={[styles.recommendation, { borderTopColor: colors.border }]}>
                <View style={styles.recommendationCopy}>
                  <Text style={[styles.recommendationTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.recommendationText, { color: colors.mutedForeground }]}>{item.body}</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={() => void useRecommendation(item)} style={[styles.smallButton, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Text style={[styles.smallButtonText, { color: colors.foreground }]}>{item.action === 'open-gita' ? 'Open Gita' : 'Remind me'}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.footerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.footerTitle, { color: colors.foreground }]}>Bhagavad Gita access</Text>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Era AI can be opened alongside the Gita experience, including from chapter and verse context.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/geeta-nexus/read?chapter=1&verse=1' as never)} style={[styles.smallButton, { alignSelf: 'flex-start', backgroundColor: colors.primary }]}>
            <Text style={[styles.smallButtonText, { color: colors.primaryForeground }]}>Open Bhagavad Gita</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  iconButton: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, paddingLeft: 12 },
  kicker: { fontSize: 9, letterSpacing: 1.5, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  subtitle: { fontSize: 11, lineHeight: 17 },
  languageCard: { borderWidth: 1, borderRadius: 18, padding: 13, marginBottom: 12 },
  label: { fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  languageRow: { flexDirection: 'row', gap: 8 },
  languageButton: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  languageText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  contextCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', gap: 10, marginBottom: 12 },
  contextText: { flex: 1, fontSize: 10.5, lineHeight: 16 },
  questionCard: { borderWidth: 1, borderRadius: 18, padding: 12 },
  input: { minHeight: 110, maxHeight: 180, borderWidth: 1, borderRadius: 14, padding: 12, fontSize: 12, lineHeight: 18, textAlignVertical: 'top' },
  askButton: { minHeight: 46, borderRadius: 13, marginTop: 9, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  buttonText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  statusCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 12 },
  statusText: { fontSize: 10.5, lineHeight: 16 },
  answerCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 12 },
  answerTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  answerText: { fontSize: 12.5, lineHeight: 20 },
  recommendationsCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 12 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  recommendation: { borderTopWidth: 1, paddingTop: 11, marginTop: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  recommendationCopy: { flex: 1 },
  recommendationTitle: { fontSize: 11.5, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  recommendationText: { fontSize: 10.5, lineHeight: 16 },
  smallButton: { minHeight: 40, borderRadius: 11, borderWidth: 1, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  smallButtonText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  footerCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 12 },
  footerTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  footerText: { fontSize: 10.5, lineHeight: 16, marginBottom: 9 },
});
