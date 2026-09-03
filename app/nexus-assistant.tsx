import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ASSISTANT_LIMITS, ASSISTANT_MODELS, ASSISTANT_VOICES } from '@/features/nexus-assistant/assistantConfig';
import { addMessage, ensureSession, initAssistantStore, listMessages, type ChatMessage } from '@/features/nexus-assistant/assistantStore';
import { downloadAssistantModel, downloadAssistantVoice } from '@/features/nexus-assistant/modelManager';
import { getLocalInferenceEngine } from '@/features/nexus-assistant/localInference';
import { streamAssistantReply } from '@/features/nexus-assistant/stage2Agent';
import { planCapability, formatCapabilityConfirmation, type CapabilityProposal } from '@/features/nexus-assistant/agentPlanner';
import { runStage3Agent } from '@/features/nexus-assistant/stage3Agent';
import { getWeatherLocalFirst } from '@/features/nexus-assistant/stage6Weather';
import { createStage7VoiceBridge, type VoiceRuntimeStatus } from '@/features/nexus-assistant/stage7VoiceBridge';
import type { Stage6VoiceBridge, VoiceInputState } from '@/features/nexus-assistant/stage6Voice';
import { routeAssistantRequest } from '@/features/nexus-assistant/stage9AssistantRouter';

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
  const [webResults, setWebResults] = useState<Array<{ title: string; url: string; snippet?: string }>>([]);
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
      setStatus(available ? 'Local assistant ready. Cloud providers and web search are optional through the Gateway.' : 'Assistant ready. Local inference engine is not available in this build.');
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
    setWebResults([]);
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

      if (/\b(weather|forecast|temperature|rain|raining|humidity|wind)\b|मौसम|तापमान|बारिश|हवा/i.test(text)) {
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
        setStatus('Checking web search and optional cloud providers through Nexus Gateway…');
        const routed = await routeAssistantRequest({ message: text, history });
        setWebResults(routed.web);
        if (routed.provider) {
          await addMessage(SESSION_ID, 'assistant', routed.provider.text);
          await refreshMessages();
          setStatus(`${routed.provider.provider === 'openai' ? 'OpenAI' : 'Gemini'} response received through Nexus Gateway.`);
          return;
        }
      } catch {
        // Cloud routing is optional. Continue to local inference/fallback.
      }

      if (!engineReady) {
        const fallback = 'Nexus Assistant could not reach the available cloud provider and local inference is not available in this build. Your message is stored locally on this device.';
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
    setStatus('Live Mode opened. Hold the Talk button to capture voice; release to process.');
    await voiceBridge.startListening().catch((error) => {
      setLiveMode(false);
      setVoiceState('idle');
      setStatus(error instanceof Error ? error.message : 'Live Mode could not start.');
    });
  };

  const holdToTalk = async () => {
    if (!liveMode || !voiceBridge || voiceState === 'listening') return;
    setVoiceState('listening');
    await voiceBridge.startListening().catch((error) => setStatus(error instanceof Error ? error.message : 'Voice capture failed.'));
  };

  const releaseTalk = async () => {
    if (!liveMode || !voiceBridge || voiceState !== 'listening') return;
    await voiceBridge.stopListening().catch(() => undefined);
    setVoiceState('processing');
    setStatus('Voice captured. Waiting for local ASR transcript…');
  };

  const endLiveMode = async () => {
    setLiveMode(false);
    await voiceBridge?.stopListening().catch(() => undefined);
    await voiceBridge?.stopOutput().catch(() => undefined);
    setVoiceState('idle');
    setStatus('Live Mode ended.');
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
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Local agent + Gemini + optional OpenAI + Gateway web search.</Text>
        </View>
      </View>

      <View accessibilityLiveRegion="polite" style={[styles.status, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.statusTitle, { color: colors.foreground }]}>Runtime</Text>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>{status}</Text>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>Cloud providers and web search are optional. OpenAI failure never blocks Gemini or local fallback.</Text>
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

      {webResults.length > 0 ? <View accessibilityLiveRegion="polite" style={[styles.webCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.section, { color: colors.foreground }]}>Web sources</Text>
        {webResults.map((result) => <View key={result.url} style={styles.webResult}><Text selectable style={[styles.webTitle, { color: colors.foreground }]}>{result.title}</Text><Text selectable style={[styles.note, { color: colors.mutedForeground }]}>{result.url}</Text>{result.snippet ? <Text selectable style={[styles.note, { color: colors.mutedForeground }]}>{result.snippet}</Text> : null}</View>)}
      </View> : null}

      {pendingProposal ? <View accessibilityLiveRegion="polite" style={[styles.proposal, { borderColor: colors.primary, backgroundColor: colors.card }]}>
        <Text style={[styles.proposalTitle, { color: colors.foreground }]}>Action confirmation</Text>
        <Text style={[styles.body, { color: colors.foreground }]}>{formatCapabilityConfirmation(pendingProposal)}</Text>
        <View style={styles.proposalActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Confirm Nexus Assistant action" disabled={busy} onPress={() => void confirmPendingAction()} style={[styles.confirmButton, { backgroundColor: colors.primary }]}><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Confirm action</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel Nexus Assistant action" disabled={busy} onPress={() => void cancelPendingAction()} style={[styles.cancelButton, { borderColor: colors.border }]}><Text style={[styles.buttonText, { color: colors.foreground }]}>Cancel</Text></Pressable>
        </View>
      </View> : null}

      {liveMode ? <View accessibilityLiveRegion="polite" style={[styles.liveCard, { borderColor: colors.primary, backgroundColor: colors.card }]}>
        <Text accessibilityRole="header" style={[styles.proposalTitle, { color: colors.foreground }]}>Nexus Live Mode</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Voice state: {voiceState}. Hold Talk to speak. Release Talk to hand the captured audio to the local voice pipeline. End Live Call exits this mode.</Text>
        <View style={styles.liveActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Hold to talk" onPressIn={() => void holdToTalk()} onPressOut={() => void releaseTalk()} style={[styles.talkButton, { backgroundColor: colors.primary }]}><Feather name="mic" size={23} color={colors.primaryForeground} /><Text style={[styles.controlText, { color: colors.primaryForeground }]}>Hold to Talk</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Stop voice output" onPress={() => void voiceBridge?.stopOutput().catch(() => undefined)} style={[styles.controlButton, { borderColor: colors.border, backgroundColor: colors.card }]}><Feather name="volume-x" size={19} color={colors.foreground} /><Text style={[styles.controlText, { color: colors.foreground }]}>Stop Output</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="End Live Call" onPress={() => void endLiveMode()} style={[styles.endButton, { backgroundColor: colors.destructive ?? colors.primary }]}><Feather name="phone-off" size={19} color={colors.primaryForeground} /><Text style={[styles.controlText, { color: colors.primaryForeground }]}>End Live Call</Text></Pressable>
        </View>
      </View> : null}

      <TextInput accessibilityLabel="Message Nexus Assistant" multiline value={input} onChangeText={setInput} placeholder="Ask Nexus Assistant…" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} />
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voice Input" onPress={() => void toggleVoiceInput()} style={[styles.controlButton, { borderColor: voiceInput ? colors.primary : colors.border, backgroundColor: voiceInput ? colors.secondary : colors.card }]}><Feather name="mic" size={19} color={colors.foreground} /><Text style={[styles.controlText, { color: colors.foreground }]}>Voice Input</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={liveMode ? 'Close Live Mode' : 'Open Live Mode'} onPress={() => void toggleLiveMode()} style={[styles.controlButton, { borderColor: liveMode ? colors.primary : colors.border, backgroundColor: liveMode ? colors.secondary : colors.card }]}><Feather name="radio" size={19} color={colors.foreground} /><Text style={[styles.controlText, { color: colors.foreground }]}>{liveMode ? 'Close Live Mode' : 'Open Live Mode'}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={hasText ? 'Send message' : 'Voice Input'} disabled={busy || !voiceBridge} onPress={() => void (hasText ? send() : toggleVoiceInput())} style={[styles.sendControl, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}>{busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name={hasText ? 'send' : 'mic'} size={19} color={colors.primaryForeground} />}<Text style={[styles.controlText, { color: colors.primaryForeground }]}>{hasText ? 'Send' : 'Voice Input'}</Text></Pressable>
      </View>

      <View style={[styles.assetCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.section, { color: colors.foreground }]}>Local AI assets</Text>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>APK target: under {ASSISTANT_LIMITS.maxApkSizeMb} MB. Heavy model and voice files remain outside the APK.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Download Nexus Small Chat model" disabled={!!assetBusy} onPress={() => void downloadModel()} style={[styles.secondaryButton, { borderColor: colors.border, opacity: assetBusy ? 0.6 : 1 }]}><Feather name="download" size={17} color={colors.foreground} /><Text style={[styles.buttonText, { color: colors.foreground }]}>{assetBusy === (ASSISTANT_MODELS.find((item) => item.kind === 'chat')?.id ?? '') ? 'Downloading model…' : 'Download local chat model'}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Download high quality Piper voice" disabled={!!assetBusy} onPress={() => void downloadVoice()} style={[styles.secondaryButton, { borderColor: colors.border, opacity: assetBusy ? 0.6 : 1 }]}><Feather name="volume-2" size={17} color={colors.foreground} /><Text style={[styles.buttonText, { color: colors.foreground }]}>{assetBusy === ASSISTANT_VOICES[0].id ? 'Downloading voice…' : 'Download Piper voice'}</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 12 },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  body: { fontSize: 12, lineHeight: 18 },
  note: { fontSize: 10.5, lineHeight: 16, marginTop: 4 },
  status: { borderWidth: 1, borderRadius: 16, padding: 13, marginBottom: 14 },
  statusTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  chat: { gap: 9, marginBottom: 14 },
  message: { borderWidth: 1, borderRadius: 16, padding: 12 },
  role: { fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  webCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 14 },
  webResult: { borderTopWidth: 1, borderTopColor: 'transparent', paddingVertical: 7 },
  webTitle: { fontSize: 11.5, fontFamily: 'Inter_700Bold' },
  proposal: { borderWidth: 1, borderRadius: 16, padding: 13, marginBottom: 14 },
  proposalTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  proposalActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  confirmButton: { minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, flex: 1 },
  cancelButton: { minHeight: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  liveCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 14 },
  liveActions: { gap: 9, marginTop: 12 },
  talkButton: { minHeight: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  endButton: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  input: { minHeight: 94, borderWidth: 1, borderRadius: 16, padding: 13, textAlignVertical: 'top', marginBottom: 10 },
  controls: { gap: 9, marginBottom: 14 },
  controlButton: { minHeight: 48, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  sendControl: { minHeight: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  controlText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  assetCard: { borderWidth: 1, borderRadius: 16, padding: 13 },
  section: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  secondaryButton: { minHeight: 46, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 9 },
  buttonText: { fontSize: 10.5, fontFamily: 'Inter_700Bold' },
});
