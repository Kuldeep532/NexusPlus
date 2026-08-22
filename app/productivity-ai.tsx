import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { buildProductivityWorkflow, renderEmailDraft } from '@/features/productivity-ai/workflowEngine';
import { DEFAULT_VOICE_PREFERENCES, DEFAULT_VOICE_LOCALES, NexusVoiceLocale } from '@/features/productivity-ai/voiceBridge';

export default function NexusAiWorkflowScreen() {
  const colors = useColors(); const insets = useSafeAreaInsets();
  const [request, setRequest] = useState(''); const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);
  const [locale, setLocale] = useState<NexusVoiceLocale>(DEFAULT_VOICE_PREFERENCES.locale);
  const [voiceStatus, setVoiceStatus] = useState('App voice preferred; system voice is the fallback.');
  const languages = useMemo(() => DEFAULT_VOICE_LOCALES, []);

  const generate = () => {
    const text = request.trim(); if (!text) return;
    const draft = renderEmailDraft({ purpose: 'email', subject: 'Quick update', keyPoints: [text], language: locale === 'en-IN' ? 'english' : 'hinglish', tone: 'professional' });
    setPreview(draft);
    buildProductivityWorkflow({ email: { to: '', context: { purpose: 'email', subject: draft.subject, keyPoints: [text], language: locale === 'en-IN' ? 'english' : 'hinglish' } } });
  };

  return <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}>
    <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="zap" size={22} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus AI Workflow</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Your app-native productivity assistant for messages, meetings and calendar workflows.</Text></View></View>
    <Text style={[styles.section, { color: colors.foreground }]}>Language & voice</Text>
    <View accessibilityRole="radiogroup" style={styles.languageRow}>{languages.map((item) => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: locale === item }} accessibilityLabel={`Use ${item} voice`} onPress={() => { setLocale(item); setVoiceStatus('Preference saved for this workflow. App voice is preferred when available.'); }} style={[styles.language, { borderColor: locale === item ? colors.primary : colors.border, backgroundColor: colors.card }]}><Text style={[styles.languageText, { color: colors.foreground }]}>{item === 'hi-IN' ? 'हिन्दी' : item === 'en-IN' ? 'English' : 'Hinglish'}</Text></Pressable>)}</View>
    <Text accessibilityLiveRegion="polite" style={[styles.note, { color: colors.mutedForeground }]}>{voiceStatus}</Text>
    <Text style={[styles.section, { color: colors.foreground }]}>What should Nexus AI Workflow do?</Text>
    <TextInput accessibilityLabel="Describe your productivity task" multiline value={request} onChangeText={setRequest} placeholder="Example: Rahul को कल 11 बजे meeting का update भेजो" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} />
    <Pressable accessibilityRole="button" accessibilityLabel="Create Nexus AI message" onPress={generate} style={[styles.button, { backgroundColor: colors.primary }]}><Feather name="edit-3" size={18} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Create with Nexus AI</Text></Pressable>
    {preview ? <View accessibilityLiveRegion="polite" style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.previewTitle, { color: colors.foreground }]}>{preview.subject}</Text><Text selectable style={[styles.body, { color: colors.foreground }]}>{preview.body}</Text><Text style={[styles.note, { color: colors.mutedForeground }]}>External sending or calendar changes are executed only through an authenticated provider in the next integration stage.</Text></View> : null}
    <View style={styles.features}><Feature title="Email Assistant" text="Draft concise Hindi, English or Hinglish messages from the key points you provide." colors={colors} /><Feature title="Meeting Scheduler" text="Build meeting actions with attendees, time and agenda." colors={colors} /><Feature title="Calendar Manager" text="Prepare calendar actions through the authenticated provider boundary." colors={colors} /><Feature title="Voice-first" text="Uses the app voice service when available; otherwise falls back to the device's installed speech recognition and TTS." colors={colors} /></View>
  </ScrollView>;
}
function Feature({ title, text, colors }: { title: string; text: string; colors: ReturnType<typeof useColors> }) { return <View style={[styles.feature, { borderColor: colors.border }]}><Text style={[styles.featureTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{text}</Text></View>; }
const styles = StyleSheet.create({ root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 }, icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 12 }, title: { fontSize: 26, fontFamily: 'Inter_700Bold' }, body: { fontSize: 12, lineHeight: 18 }, section: { fontSize: 14, fontFamily: 'Inter_700Bold', marginTop: 10, marginBottom: 8 }, languageRow: { flexDirection: 'row', gap: 8 }, language: { minHeight: 46, flex: 1, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }, languageText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, note: { fontSize: 11, lineHeight: 16, marginTop: 8 }, input: { minHeight: 120, borderWidth: 1, borderRadius: 16, padding: 14, textAlignVertical: 'top', fontSize: 14 }, button: { minHeight: 52, borderRadius: 16, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, buttonText: { fontSize: 14, fontFamily: 'Inter_700Bold' }, preview: { marginTop: 18, padding: 16, borderWidth: 1, borderRadius: 16, gap: 10 }, previewTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' }, features: { marginTop: 20, gap: 10 }, feature: { borderWidth: 1, borderRadius: 16, padding: 14 }, featureTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 4 } });
