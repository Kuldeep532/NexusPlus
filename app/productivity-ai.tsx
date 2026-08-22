import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { loadLanguagePreferences } from '@/features/language-preferences/languagePreferences';
import { generateWithGemini } from '@/features/productivity-ai/geminiGateway';
import { buildProductivityWorkflow } from '@/features/productivity-ai/workflowEngine';

export default function ProductivityAiScreen() {
  const colors = useColors(); const insets = useSafeAreaInsets();
  const [request, setRequest] = useState(''); const [preview, setPreview] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const generate = async () => {
    const text = request.trim(); if (!text || busy) return; setBusy(true); setError(null); setPreview(null);
    try {
      const prefs = await loadLanguagePreferences();
      const result = await generateWithGemini({ language: prefs.featureTtsLanguage, instruction: 'Write a concise, natural bilingual productivity message. Preserve names, dates, times, attendees and explicit user facts. Never invent missing details. Return only message text.', context: text, maxOutputTokens: 700 });
      setPreview(result.text);
      buildProductivityWorkflow({ email: { to: '', context: { purpose: 'email', subject: 'Quick update', keyPoints: [text], language: prefs.featureTtsLanguage === 'hi-IN' ? 'hindi' : 'english' } } });
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to reach Nexus AI gateway.'); } finally { setBusy(false); }
  };
  return <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}>
    <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="zap" size={22} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus AI Workflow</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Lightweight AI workflows using your global app language and voice preferences.</Text></View></View>
    <Text style={[styles.label, { color: colors.foreground }]}>What should Nexus Plus do?</Text>
    <TextInput accessibilityLabel="Describe your productivity task" multiline value={request} onChangeText={setRequest} placeholder="Example: Send Rahul a meeting update for tomorrow at 11 AM" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} />
    <Pressable accessibilityRole="button" accessibilityLabel={busy ? 'Generating message' : 'Create message with Nexus AI'} disabled={busy} onPress={() => void generate()} style={[styles.button, { backgroundColor: colors.primary, opacity: busy ? 0.65 : 1 }]}><Feather name="edit-3" size={18} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{busy ? 'Thinking…' : 'Create Message'}</Text></Pressable>
    {error ? <Text accessibilityLiveRegion="assertive" style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
    {preview ? <View accessibilityLiveRegion="polite" style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.previewTitle, { color: colors.foreground }]}>Nexus AI draft</Text><Text selectable style={[styles.body, { color: colors.foreground }]}>{preview}</Text><Text style={[styles.note, { color: colors.mutedForeground }]}>Language and voice are managed globally in Settings → Language and Preference.</Text></View> : null}
    <View style={styles.features}><Feature title="Email Assistant" text="Draft messages from the request without adding facts the user did not provide." colors={colors} /><Feature title="Meeting Scheduler" text="Build meeting actions from attendees, time and agenda when available." colors={colors} /><Feature title="Calendar Manager" text="Prepare calendar actions through the authenticated provider boundary." colors={colors} /><Feature title="Voice-first" text="Uses the global app voice preference; system speech services remain the lightweight fallback." colors={colors} /></View>
  </ScrollView>;
}
function Feature({ title, text, colors }: { title: string; text: string; colors: ReturnType<typeof useColors> }) { return <View style={[styles.feature, { borderColor: colors.border }]}><Text style={[styles.featureTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{text}</Text></View>; }
const styles = StyleSheet.create({ root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 }, icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 12 }, title: { fontSize: 26, fontFamily: 'Inter_700Bold' }, body: { fontSize: 12, lineHeight: 18 }, label: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 8 }, input: { minHeight: 120, borderWidth: 1, borderRadius: 16, padding: 14, textAlignVertical: 'top', fontSize: 14 }, button: { minHeight: 52, borderRadius: 16, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, buttonText: { fontSize: 14, fontFamily: 'Inter_700Bold' }, error: { marginTop: 12, fontSize: 12, lineHeight: 18 }, preview: { marginTop: 18, padding: 16, borderWidth: 1, borderRadius: 16, gap: 10 }, previewTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' }, note: { fontSize: 11, lineHeight: 16 }, features: { marginTop: 20, gap: 10 }, feature: { borderWidth: 1, borderRadius: 16, padding: 14 }, featureTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 4 } });
