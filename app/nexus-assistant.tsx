import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { ASSISTANT_LIMITS, ASSISTANT_MODELS, ASSISTANT_VOICES } from '@/features/nexus-assistant/assistantConfig';
import { addMessage, ensureSession, initAssistantStore, listMessages, type ChatMessage } from '@/features/nexus-assistant/assistantStore';
import { downloadAssistantModel, downloadAssistantVoice } from '@/features/nexus-assistant/modelManager';
import { getLocalInferenceEngine } from '@/features/nexus-assistant/localInference';
import { streamAssistantReply } from '@/features/nexus-assistant/stage2Agent';
import { planCapability, formatCapabilityConfirmation, type CapabilityProposal } from '@/features/nexus-assistant/agentPlanner';
import { runStage3Agent } from '@/features/nexus-assistant/stage3Agent';

const SESSION_ID = 'default';

export default function NexusAssistantScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Checking local inference engine…');
  const [assetBusy, setAssetBusy] = useState<string | null>(null);
  const [streaming, setStreaming] = useState('');
  const [engineReady, setEngineReady] = useState(false);
  const [pendingProposal, setPendingProposal] = useState<CapabilityProposal | null>(null);

  useEffect(() => {
    void (async () => {
      await initAssistantStore();
      await ensureSession(SESSION_ID, 'Nexus Assistant');
      setMessages(await listMessages(SESSION_ID));
      const engine = await getLocalInferenceEngine();
      const available = await engine.isAvailable();
      setEngineReady(available);
      setStatus(available ? 'Local inference engine ready.' : 'Native local inference engine is not available in this build yet.');
    })().catch(() => setStatus('Local chat storage could not be opened.'));
  }, []);

  const refreshMessages = async () => setMessages(await listMessages(SESSION_ID));

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setInput('');
    setStreaming('');
    setPendingProposal(null);
    try {
      await addMessage(SESSION_ID, 'user', text);
      await refreshMessages();

      const proposal = planCapability(text);
      if (proposal) {
        setPendingProposal(proposal);
        const confirmation = formatCapabilityConfirmation(proposal);
        await addMessage(SESSION_ID, 'assistant', confirmation);
        await refreshMessages();
        setStatus('Action prepared. Confirm it explicitly before Nexus Assistant executes it.');
        return;
      }

      if (!engineReady) {
        const fallback = 'Nexus Assistant local inference is not available in this build yet. Your message has been saved locally on this device.';
        await addMessage(SESSION_ID, 'assistant', fallback);
        await refreshMessages();
        setStatus('Message saved locally; native local inference is unavailable in this build.');
        return;
      }

      const model = ASSISTANT_MODELS[0];
      await streamAssistantReply({
        sessionId: SESSION_ID,
        modelId: model.id,
        modelPath: model.url,
        userText: text,
        onStatus: setStatus,
        onToken: (chunk) => setStreaming((value) => value + chunk),
      });
      await refreshMessages();
      setStreaming('');
      setStatus('Local response complete.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Local inference failed.');
      await refreshMessages();
      setStreaming('');
    } finally {
      setBusy(false);
    }
  };

  const confirmPendingAction = async () => {
    if (!pendingProposal || busy) return;
    setBusy(true);
    try {
      await runStage3Agent({
        sessionId: SESSION_ID,
        userText: pendingProposal.capability.id === 'open-url' ? `open ${pendingProposal.args.url ?? ''}` : pendingProposal.capability.title,
        confirmed: true,
        onStatus: setStatus,
      });
      setPendingProposal(null);
      await refreshMessages();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  const cancelPendingAction = async () => {
    if (!pendingProposal) return;
    setPendingProposal(null);
    setStatus('Action cancelled. No capability was executed.');
    await addMessage(SESSION_ID, 'assistant', 'Action cancelled. No device or app action was executed.');
    await refreshMessages();
  };

  const downloadModel = async () => {
    setAssetBusy(ASSISTANT_MODELS[0].id);
    setStatus('Downloading the selected local chat model to this device…');
    try {
      await downloadAssistantModel(ASSISTANT_MODELS[0].id);
      setStatus('Local chat model downloaded. It is stored outside the APK and can be deleted later.');
    } catch {
      setStatus('Model download failed. Check your connection and try again.');
    } finally {
      setAssetBusy(null);
    }
  };

  const downloadVoice = async () => {
    setAssetBusy(ASSISTANT_VOICES[0].id);
    setStatus('Downloading the high-quality Piper voice…');
    try {
      await downloadAssistantVoice(ASSISTANT_VOICES[0].id);
      setStatus('Piper voice downloaded. Native Piper playback is added in the voice stage.');
    } catch {
      setStatus('Voice download failed. Check your connection and try again.');
    } finally {
      setAssetBusy(null);
    }
  };

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="cpu" size={23} color={colors.primary} /></View>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus Assistant</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Private, on-device-first agent with safe app and device actions.</Text>
        </View>
      </View>

      <View accessibilityLiveRegion="polite" style={[styles.status, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.statusTitle, { color: colors.foreground }]}>Privacy & runtime</Text>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>{status}</Text>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>Local chat mode stores conversation in SQLite. Registered actions execute locally and confirmation is required for consequential actions.</Text>
      </View>

      <View style={styles.chat} accessibilityLiveRegion="polite">
        {messages.map((message) => (
          <View key={message.id} style={[styles.message, { backgroundColor: message.role === 'user' ? colors.secondary : colors.card, borderColor: colors.border }]}>
            <Text style={[styles.role, { color: colors.foreground }]}>{message.role === 'user' ? 'You' : message.role === 'system' ? 'System' : 'Nexus Assistant'}</Text>
            <Text selectable style={[styles.body, { color: colors.foreground }]}>{message.content}</Text>
          </View>
        ))}
        {streaming ? <View style={[styles.message, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <Text style={[styles.role, { color: colors.foreground }]}>Nexus Assistant · live</Text>
          <Text selectable style={[styles.body, { color: colors.foreground }]}>{streaming}</Text>
        </View> : null}
        {messages.length === 0 && !streaming ? <Text style={[styles.note, { color: colors.mutedForeground }]}>Start a private local conversation.</Text> : null}
      </View>

      {pendingProposal ? <View accessibilityLiveRegion="polite" style={[styles.proposal, { borderColor: colors.primary, backgroundColor: colors.card }]}>
        <Text style={[styles.proposalTitle, { color: colors.foreground }]}>Action confirmation</Text>
        <Text style={[styles.body, { color: colors.foreground }]}>{formatCapabilityConfirmation(pendingProposal)}</Text>
        <View style={styles.proposalActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Confirm Nexus Assistant action" disabled={busy} onPress={() => void confirmPendingAction()} style={[styles.confirmButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Confirm action</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel Nexus Assistant action" disabled={busy} onPress={() => void cancelPendingAction()} style={[styles.cancelButton, { borderColor: colors.border }]}>
            <Text style={[styles.buttonText, { color: colors.foreground }]}>Cancel</Text>
          </Pressable>
        </View>
      </View> : null}

      <TextInput accessibilityLabel="Message Nexus Assistant" multiline value={input} onChangeText={setInput} placeholder="Ask Nexus Assistant…" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} />
      <Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={busy} onPress={() => void send()} style={[styles.button, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}>
        {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="send" size={18} color={colors.primaryForeground} />}
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{busy ? 'Working locally…' : 'Send'}</Text>
      </Pressable>

      <View style={[styles.assetCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.section, { color: colors.foreground }]}>Optional local downloads</Text>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>APK target: under {ASSISTANT_LIMITS.maxApkSizeMb} MB. Model and voice weights stay outside the APK.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Download Nexus Small Chat model" disabled={!!assetBusy} onPress={() => void downloadModel()} style={[styles.secondaryButton, { borderColor: colors.border, opacity: assetBusy ? 0.6 : 1 }]}>
          <Feather name="download" size={17} color={colors.foreground} />
          <Text style={[styles.buttonText, { color: colors.foreground }]}>{assetBusy === ASSISTANT_MODELS[0].id ? 'Downloading model…' : 'Download local chat model'}</Text>
        </Pressable>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>Selected profile: {ASSISTANT_MODELS[0].title} · about {ASSISTANT_MODELS[0].sizeMb} MB</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Download high quality Piper voice" disabled={!!assetBusy} onPress={() => void downloadVoice()} style={[styles.secondaryButton, { borderColor: colors.border, opacity: assetBusy ? 0.6 : 1 }]}>
          <Feather name="volume-2" size={17} color={colors.foreground} />
          <Text style={[styles.buttonText, { color: colors.foreground }]}>{assetBusy === ASSISTANT_VOICES[0].id ? 'Downloading voice…' : 'Download Piper voice'}</Text>
        </Pressable>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>Selected voice: {ASSISTANT_VOICES[0].title} · high quality</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 12 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  body: { fontSize: 13, lineHeight: 19 },
  status: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12 },
  statusTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  note: { fontSize: 11, lineHeight: 16, marginTop: 6 },
  chat: { gap: 9, marginBottom: 12 },
  message: { borderWidth: 1, borderRadius: 15, padding: 12 },
  role: { fontSize: 11, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  input: { minHeight: 100, borderWidth: 1, borderRadius: 16, padding: 14, textAlignVertical: 'top', fontSize: 14 },
  button: { minHeight: 52, borderRadius: 16, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  proposal: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12, gap: 8 },
  proposalTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  proposalActions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  confirmButton: { flex: 1, minHeight: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  cancelButton: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  assetCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 18, gap: 8 },
  section: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  secondaryButton: { minHeight: 48, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12, marginTop: 6 },
});
