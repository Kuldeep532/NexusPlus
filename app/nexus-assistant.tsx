import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { ASSISTANT_LIMITS, ASSISTANT_MODELS, ASSISTANT_VOICES } from '@/features/nexus-assistant/assistantConfig';
import { addMessage, ensureSession, initAssistantStore, listMessages, type ChatMessage } from '@/features/nexus-assistant/assistantStore';
import { downloadAssistantModel, downloadAssistantVoice } from '@/features/nexus-assistant/modelManager';
import { getLocalInferenceEngine } from '@/features/nexus-assistant/localInference';
import { streamAssistantReply } from '@/features/nexus-assistant/stage2Agent';
import { planCapability, formatCapabilityConfirmation, type CapabilityProposal } from '@/features/nexus-assistant/agentPlanner';
import { runStage3Agent } from '@/features/nexus-assistant/stage3Agent';
import { askGeminiThroughGateway, looksLikeWeatherRequest } from '@/features/nexus-assistant/stage5Cloud';
import { getWeatherLocalFirst } from '@/features/nexus-assistant/stage6Weather';
import { createStage7VoiceBridge, type VoiceRuntimeStatus } from '@/features/nexus-assistant/stage7VoiceBridge';
import type { Stage6VoiceBridge, VoiceInputState } from '@/features/nexus-assistant/stage6Voice';

const SESSION_ID = 'default';

export default function NexusAssistantScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Checking Nexus Assistant…');
  const [assetBusy, setAssetBusy] = useState<string | null>(null);
  const [streaming, setStreaming] = useState('');
  const [engineReady, setEngineReady] = useState(false);
  const [pendingProposal, setPendingProposal] = useState<CapabilityProposal | null>(null);
  const [voiceInput, setVoiceInput] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceInputState>('idle');
  const [voiceBridge, setVoiceBridge] = useState<Stage6VoiceBridge | null>(null);
  const hasText = input.trim().length > 0;

  useEffect(() => {
    const created = createStage7VoiceBridge(
      (next: VoiceRuntimeStatus) => {
        if (next.state === 'listening') setVoiceState('listening');
        else if (next.state === 'processing') setVoiceState('processing');
        else setVoiceState('idle');
        if (next.error) setStatus(`Voice error: ${next.error}`);
      },
      (text: string) => {
        setInput(text);
        setVoiceState('idle');
        setVoiceInput(true);
        setStatus('Voice transcription ready. Press Send to submit.');
      },
    );
    setVoiceBridge(created.bridge);
    return created.dispose;
  }, []);

  useEffect(() => {
    void (async () => {
      await initAssistantStore();
      await ensureSession(SESSION_ID, 'Nexus Assistant');
      setMessages(await listMessages(SESSION_ID));
      const engine = await getLocalInferenceEngine();
      const available = await engine.isAvailable();
      setEngineReady(available);
      setStatus(available ? 'Local assistant ready. Cloud enrichment is available through the Gateway.' : 'Assistant ready. Local inference engine is not available in this build.');
    })().catch(() => setStatus('Local chat storage could not be opened.'));
  }, []);

  const history = useMemo(() => messages.slice(-12).map((message) => ({
    role: message.role === 'assistant' ? 'assistant' as const : 'user' as const,
    text: message.content,
  })), [messages]);

  const refreshMessages = async () => setMessages(await listMessages(SESSION_ID));

  const send = async (providedText?: string) => {
    const text = (providedText ?? input).trim();
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

      if (looksLikeWeatherRequest(text)) {
        setStatus('Checking local weather cache first…');
        const weather = await getWeatherLocalFirst({ location: text });
        if (weather) {
          await addMessage(SESSION_ID, 'assistant', weather.text);
          await refreshMessages();
          setStatus(weather.source === 'cache' ? 'Weather served from the on-device cache.' : 'Weather refreshed through the Gateway and cached locally.');
          return;
        }
      }

      try {
        setStatus('Getting Gemini response through Nexus Gateway…');
        const gemini = await askGeminiThroughGateway({ message: text, history });
        if (gemini) {
          await addMessage(SESSION_ID, 'assistant', gemini.text);
          await refreshMessages();
          setStatus('Gemini response received through the Gateway.');
          return;
        }
      } catch {
        // Fall through to local inference when the gateway/Gemini route is unavailable.
      }

      if (!engineReady) {
        const fallback = 'Nexus Assistant could not reach the Gateway and local inference is not available in this build. Your message is stored locally on this device.';
        await addMessage(SESSION_ID, 'assistant', fallback);
        await refreshMessages();
        setStatus('No inference provider available; message remains local.');
        return;
      }

      const model = ASSISTANT_MODELS.find((item) => item.kind === 'chat') ?? ASSISTANT_MODELS[0];
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
      setStatus(error instanceof Error ? error.message : 'Assistant request failed.');
      await refreshMessages();
      setStreaming('');
    } finally {
      setBusy(false);
    }
  };

  const toggleVoiceInput = async () => {
    if (!voiceBridge) {
      setStatus('Voice bridge is still initializing.');
      return;
    }
    if (voiceState === 'listening') {
      await voiceBridge.stopListening().catch(() => undefined);
      setVoiceState('idle');
      setVoiceInput(false);
      setStatus('Voice input stopped.');
      return;
    }
    const available = await voiceBridge.isAvailable();
    if (!available) {
      setVoiceInput(true);
      setStatus('Microphone access is unavailable on this device or build.');
      return;
    }
    setVoiceInput(true);
    setVoiceState('listening');
    setStatus('Listening…');
    await voiceBridge.startListening().catch((error) => {
      setVoiceState('idle');
      setStatus(error instanceof Error ? error.message : 'Voice input failed.');
    });
  };

  const toggleLiveMode = async () => {
    if (!voiceBridge) {
      setStatus('Voice bridge is still initializing.');
      return;
    }
    const next = !liveMode;
    setLiveMode(next);
    if (!next) {
      await voiceBridge.stopListening().catch(() => undefined);
      await voiceBridge.stopOutput().catch(() => undefined);
      setVoiceState('idle');
      setStatus('Live Mode closed.');
      return;
    }
    const available = await voiceBridge.isAvailable();
    if (!available) {
      setLiveMode(false);
      setStatus('Live Mode needs microphone access on this device.');
      return;
    }
    setStatus('Live Mode opened. Local speech bridge is active; ASR/TTS model loading is handled on demand.');
    await voiceBridge.startListening().catch((error) => {
      setVoiceState('idle');
      setStatus(error instanceof Error ? error.message : 'Live Mode could not start.');
    });
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
    const model = ASSISTANT_MODELS.find((item) => item.kind === 'chat');
    if (!model) return;
    setAssetBusy(model.id);
    setStatus('Preparing the local chat model download…');
    try {
      await downloadAssistantModel(model.id);
      setStatus('Local chat model downloaded. It remains outside the APK.');
    } catch {
      setStatus('Model download failed. Check your connection and try again.');
    } finally {
      setAssetBusy(null);
    }
  };

  const downloadVoice = async () => {
    const voice = ASSISTANT_VOICES[0];
    setAssetBusy(voice.id);
    setStatus('Preparing the local Piper voice download…');
    try {
      await downloadAssistantVoice(voice.id);
      setStatus('Piper voice downloaded.');
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
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Local agent + Gemini Gateway + weather + live controls.</Text>
        </View>
      </View>

      <View accessibilityLiveRegion="polite" style={[styles.status, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.statusTitle, { color: colors.foreground }]}>Runtime</Text>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>{status}</Text>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>Chat history stays in SQLite. Heavy AI assets are kept outside the APK and downloaded only when a feature needs them.</Text>
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

      {liveMode ? <View accessibilityLiveRegion="polite" style={[styles.liveCard, { borderColor: colors.primary, backgroundColor: colors.card }]}>
        <Text style={[styles.proposalTitle, { color: colors.foreground }]}>Open Live Mode</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Hands-free mode is active. Voice state: {voiceState}. Speech models are loaded only when voice functions need them.</Text>
      </View> : null}

      <TextInput accessibilityLabel="Message Nexus Assistant" multiline value={input} onChangeText={setInput} placeholder="Ask Nexus Assistant…" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} />
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voice Input" onPress={() => void toggleVoiceInput()} style={[styles.controlButton, { borderColor: voiceInput ? colors.primary : colors.border, backgroundColor: voiceInput ? colors.secondary : colors.card }]}>
          <Feather name="mic" size={19} color={colors.foreground} />
          <Text style={[styles.controlText, { color: colors.foreground }]}>Voice Input</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={liveMode ? 'Close Live Mode' : 'Open Live Mode'} onPress={() => void toggleLiveMode()} style={[styles.controlButton, { borderColor: liveMode ? colors.primary : colors.border, backgroundColor: liveMode ? colors.secondary : colors.card }]}>
          <Feather name="radio" size={19} color={colors.foreground} />
          <Text style={[styles.controlText, { color: colors.foreground }]}>{liveMode ? 'Close Live Mode' : 'Open Live Mode'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={hasText ? 'Send message' : 'Voice Input'} disabled={busy || !voiceBridge} onPress={() => void (hasText ? send() : toggleVoiceInput())} style={[styles.sendControl, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}>
          {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name={hasText ? 'send' : 'mic'} size={19} color={colors.primaryForeground} />}
          <Text style={[styles.controlText, { color: colors.primaryForeground }]}>{hasText ? 'Send' : 'Voice Input'}</Text>
        </Pressable>
      </View>

      <View style={[styles.assetCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.section, { color: colors.foreground }]}>Local AI assets</Text>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>APK target: under {ASSISTANT_LIMITS.maxApkSizeMb} MB. We do not bundle model weights; each asset is downloaded only when its feature is used.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Download Nexus Small Chat model" disabled={!!assetBusy} onPress={() => void downloadModel()} style={[styles.secondaryButton, { borderColor: colors.border, opacity: assetBusy ? 0.6 : 1 }]}>
          <Feather name="download" size={17} color={colors.foreground} />
          <Text style={[styles.buttonText, { color: colors.foreground }]}>{assetBusy ? 'Preparing download…' : 'Download local chat model'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Download high quality Piper voice" disabled={!!assetBusy} onPress={() => void downloadVoice()} style={[styles.secondaryButton, { borderColor: colors.border, opacity: assetBusy ? 0.6 : 1 }]}>
          <Feather name="volume-2" size={17} color={colors.foreground} />
          <Text style={[styles.buttonText, { color: colors.foreground }]}>{assetBusy === ASSISTANT_VOICES[0].id ? 'Preparing download…' : 'Download Piper voice'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  icon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800' },
  status: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 14, gap: 5 },
  statusTitle: { fontSize: 15, fontWeight: '800' },
  chat: { gap: 10, marginBottom: 14 },
  message: { borderWidth: 1, borderRadius: 16, padding: 13, gap: 6 },
  role: { fontSize: 13, fontWeight: '800' },
  body: { fontSize: 16, lineHeight: 24 },
  note: { fontSize: 13, lineHeight: 19 },
  proposal: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10, marginBottom: 14 },
  proposalTitle: { fontSize: 16, fontWeight: '800' },
  proposalActions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  confirmButton: { minHeight: 48, borderRadius: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { minHeight: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '700' },
  liveCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 8, marginBottom: 14 },
  input: { minHeight: 120, borderWidth: 1, borderRadius: 16, padding: 14, textAlignVertical: 'top', fontSize: 16, marginBottom: 10 },
  controls: { gap: 10, marginBottom: 14 },
  controlButton: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  sendControl: { minHeight: 54, borderRadius: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  controlText: { fontSize: 15, fontWeight: '800' },
  assetCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  section: { fontSize: 17, fontWeight: '800' },
  secondaryButton: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
