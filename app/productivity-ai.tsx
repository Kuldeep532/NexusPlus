import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getFeatureTtsLanguage } from '@/features/language-preferences/languagePreferences';
import { buildProductivityWorkflow, renderEmailDraft } from '@/features/productivity-ai/workflowEngine';
import { discoverGatewayEndpoints } from '@/features/api-gateway/apiGatewayClient';

export default function NexusAiWorkflowScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState('');
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);
  const [language, setLanguage] = useState<'english' | 'hinglish'>('english');
  const [gatewayStatus, setGatewayStatus] = useState('Checking connected productivity services…');

  useEffect(() => {
    let cancelled = false;
    getFeatureTtsLanguage().then((locale) => {
      if (!cancelled) setLanguage(locale === 'hi-IN' ? 'hinglish' : 'english');
    });
    discoverGatewayEndpoints()
      .then((endpoints) => {
        if (!cancelled) setGatewayStatus(
          endpoints.length ? `${endpoints.length} connected API endpoint${endpoints.length === 1 ? '' : 's'} available.` : 'Gateway connected; no productivity endpoints are published yet.',
        );
      })
      .catch(() => {
        if (!cancelled) setGatewayStatus('Productivity services are not connected yet.');
      });
    return () => { cancelled = true; };
  }, []);

  const generate = () => {
    const text = request.trim();
    if (!text) return;
    const draft = renderEmailDraft({
      purpose: 'email',
      subject: 'Quick update',
      keyPoints: [text],
      language,
      tone: 'professional',
    });
    setPreview(draft);
    buildProductivityWorkflow({
      email: {
        to: '',
        context: {
          purpose: 'email',
          subject: draft.subject,
          keyPoints: [text],
          language,
        },
      },
    });
  };

  return <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}>
    <View style={styles.header}>
      <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="zap" size={22} color={colors.primary} /></View>
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus AI Workflow</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Your app-native productivity assistant for messages, meetings and calendar workflows.</Text>
      </View>
    </View>

    <View accessibilityLiveRegion="polite" style={[styles.status, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={[styles.statusTitle, { color: colors.foreground }]}>Connected services</Text>
      <Text style={[styles.note, { color: colors.mutedForeground }]}>{gatewayStatus}</Text>
      <Text style={[styles.note, { color: colors.mutedForeground }]}>Language and voice preferences come from Settings.</Text>
    </View>

    <Text style={[styles.section, { color: colors.foreground }]}>What should Nexus AI Workflow do?</Text>
    <TextInput accessibilityLabel="Describe your productivity task" multiline value={request} onChangeText={setRequest} placeholder="Example: Rahul को कल 11 बजे meeting का update भेजो" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} />
    <Pressable accessibilityRole="button" accessibilityLabel="Create Nexus AI message" onPress={generate} style={[styles.button, { backgroundColor: colors.primary }]}>
      <Feather name="edit-3" size={18} color={colors.primaryForeground} />
      <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Create with Nexus AI</Text>
    </Pressable>

    {preview ? <View accessibilityLiveRegion="polite" style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.previewTitle, { color: colors.foreground }]}>{preview.subject}</Text>
      <Text selectable style={[styles.body, { color: colors.foreground }]}>{preview.body}</Text>
      <Text style={[styles.note, { color: colors.mutedForeground }]}>External sending and calendar changes use the authenticated gateway provider.</Text>
    </View> : null}

    <View style={styles.features}>
      <Feature title="Email Assistant" text="Draft concise Hindi, English or Hinglish messages from the key points you provide." colors={colors} />
      <Feature title="Meeting Scheduler" text="Build meeting actions with attendees, time and agenda through the gateway." colors={colors} />
      <Feature title="Calendar Manager" text="Read, create and cancel calendar actions through authenticated provider endpoints." colors={colors} />
      <Feature title="Voice-first" text="Uses the app voice service when available; otherwise uses the device's installed speech services." colors={colors} />
    </View>
  </ScrollView>;
}

function Feature({ title, text, colors }: { title: string; text: string; colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.feature, { borderColor: colors.border }]}><Text style={[styles.featureTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 12 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  body: { fontSize: 12, lineHeight: 18 },
  status: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  statusTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  section: { fontSize: 14, fontFamily: 'Inter_700Bold', marginTop: 10, marginBottom: 8 },
  input: { minHeight: 120, borderWidth: 1, borderRadius: 16, padding: 14, textAlignVertical: 'top', fontSize: 14 },
  button: { minHeight: 52, borderRadius: 16, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  preview: { marginTop: 18, padding: 16, borderWidth: 1, borderRadius: 16, gap: 10 },
  previewTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  note: { fontSize: 11, lineHeight: 16, marginTop: 8 },
  features: { marginTop: 20, gap: 10 },
  feature: { borderWidth: 1, borderRadius: 16, padding: 14 },
  featureTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 4 },
});
