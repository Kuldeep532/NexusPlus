import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { ASSISTANT_LIMITS, ASSISTANT_MODELS, ASSISTANT_VOICES, NEXUS_CORE_MODEL_ID } from '@/features/nexus-assistant/assistantConfig';
import { addMessage, ensureSession, initAssistantStore, listMessages, type ChatMessage } from '@/features/nexus-assistant/assistantStore';
import { downloadAssistantModel, downloadAssistantVoice } from '@/features/nexus-assistant/modelManager';
import { getLocalInferenceEngine } from '@/features/nexus-assistant/localInference';
import { streamAssistantReply } from '@/features/nexus-assistant/stage2Agent';
import { planCapability, formatCapabilityConfirmation, type CapabilityProposal } from '@/features/nexus-assistant/agentPlanner';
import { runStage3Agent } from '@/features/nexus-assistant/stage3Agent';
import { getWeatherLocalFirst } from '@/features/nexus-assistant/stage6Weather';
import { createStage7VoiceBridge, speakAssistant, type VoiceRuntimeStatus } from '@/features/nexus-assistant/stage7VoiceBridge';
import type { Stage6VoiceBridge, VoiceInputState } from '@/features/nexus-assistant/stage6Voice';
import { routeAssistantRequest } from '@/features/nexus-assistant/stage9AssistantRouter';
import { getResolvedAssistantContext } from '@/features/nexus-assistant/assistantContextService';
import { isBookQuestion } from '@/features/nexus-assistant/bookContext';
import { getAssetStatus } from '@/features/nexus-assistant/stage8AssetManager';

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
  const [activeContextLabel, setActiveContextLabel] = useState<string | null>(null);
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
        if (liveMode) void send(text, true);
      },
    );
    setVoiceBridge(created.bridge);
    return created.dispose;
  }, [liveMode]);

  useEffect(() => {
    void (async () => {
      await initAssistantStore();
      await ensureSession(SESSION_ID, 'Nexus Assistant');
      setMessages(await listMessages(SESSION_ID));
      const context = await getResolvedAssistantContext();
      setActiveContextLabel(context.book?.title ?? context.file?.name ?? null);
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

  const speakResponseForMode = async (text: string, live: boolean) => {
    if (!live || !text.trim()) return;
    const result = await speakAssistant(text, 'en-US', 'live-call');
    if (result === 'piper') setStatus('Speaking with the Live Voice Call voice.');
    else {
      const Speech = await import('expo-speech');
      Speech.stop();
      Speech.speak(text, { language: 'en-US' });
      setStatus('Speaking with the device voice fallback.');
    }
  };

  const send = async (providedText?: string, fromLiveMode = liveMode) => {
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

      const context = await getResolvedAssistantContext();
      if (isBookQuestion(text) && context.book) setStatus(`Using ${context.book.title} as the primary source…`);
      else if (context.file) setStatus(`Using ${context.file.name} as the primary source…`);

      if (/\b(weather|forecast|temperature|rain|raining|humidity|wind)\b|मौसम|तापमान|बारिश|हवा/i.test(text) && !context.book && !context.file) {
        setStatus('Checking local weather cache first…');
        const weather = await getWeatherLocalFirst({ location: text });
        if (weather) {
          await addMessage(SESSION_ID, 'assistant', weather.text);
          await refreshMessages();
          setStatus(weather.source === 'cache' ? 'Weather served from the on-device cache.' : 'Weather refreshed through the Gateway and cached locally.');
          await speakResponseForMode(weather.text, fromLiveMode);
          return;
        }
      }

      try {
        setStatus(context.prompt ? 'Answering with your selected local context…' : 'Checking web search and optional cloud providers through Nexus Gateway…');
        const routed = await routeAssistantRequest({
          message: text,
          history,
          bookContext: context.book,
          fileContext: context.file,
        });
        setWebResults(routed.web);
        if (routed.provider) {
          await addMessage(SESSION_ID, 'assistant', routed.provider.text);
          await refreshMessages();
          setStatus(`${routed.provider.provider === 'openai' ? 'OpenAI' : 'Gemini'} response received through Nexus Gateway.`);
          await speakResponseForMode(routed.provider.text, fromLiveMode);
          return;
        }
      } catch {
        // Cloud routing is optional. Continue to local inference/fallback.
      }

      if (!engineReady) {
        const fallback = context.prompt
          ? 'Nexus Assistant could not reach an inference provider. Your selected context stays on this device.'
          : 'Nexus Assistant could not reach the available cloud provider and local inference is not available in this build. Your message is stored locally on this device.';
        await addMessage(SESSION_ID, 'assistant', fallback);
        await refreshMessages();
        setStatus('No inference provider available; message remains local.');
        await speakResponseForMode(fallback, fromLiveMode);
        return;
      }

      const model = ASSISTANT_MODELS.find((item) => item.id === NEXUS_CORE_MODEL_ID) ?? ASSISTANT_MODELS.find((item) => item.kind === 'chat');
      if (!model) throw new Error('NEXUS_CORE_MODEL_UNAVAILABLE');
      if (getAssetStatus(model.id) !== 'ready') {
        setStatus('Nexus Core AI is still downloading in the background.');
      }
      const modelContext = context.prompt ? `${context.prompt}\n\nUSER QUESTION:\n${text}` : text;
      const localReply = await streamAssistantReply({
        sessionId: SESSION_ID,
        modelId: model.id,
        modelPath: model.url,
        userText: modelContext,
        onStatus: setStatus,
        onToken: (chunk) => setStreaming((value) => value + chunk),
      });
      await refreshMessages();
      setStreaming('');
      setStatus('Local response complete.');
      await speakResponseForMode(localReply.text, fromLiveMode);
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
      const Speech = await import('expo-speech');
      Speech.stop();
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
    const Speech = await import('expo-speech');
    Speech.stop();
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
    const model = ASSISTANT_MODELS.find((item) => item.id === NEXUS_CORE_MODEL_ID);
    if (!model) return;
    setAssetBusy(model.id);
    setStatus('Preparing the local chat model download…');
    try {
      await downloadAssistantModel(model.id);
      setStatus('Local Nexus Core AI downloaded. It remains outside the APK.');
    } catch {
      setStatus('Model download failed. Background retry will continue automatically.');
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
        {activeContextLabel ? <Text style={[styles.note, { color: colors.primary }]}>Active context: {activeContextLabel}</Text> : null}
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
        <Text style={[styles.section, { color: colors.foreground }]}>Web results</Text>
        {webResults.map((item) => <View key={item.url} style={styles.webResult}><Text style={[styles.webTitle, { color: colors.foreground }]}>{item.title}</Text><Text selectable style={[styles.note, { color: colors.mutedForeground }]}>{item.url}</Text>{item.snippet ? <Text selectable style={[styles.note, { color: colors.mutedForeground }]}>{item.snippet}</Text> : null}</View>)}
      </View> : null}

      {pendingProposal ? <View accessibilityLiveRegion="polite" style={[styles.proposal, { borderColor: colors.primary, backgroundColor: colors.card }]}>
        <Text style={[styles.proposalTitle, { color: colors.foreground }]}>{pendingProposal.capability.title}</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>{formatCapabilityConfirmation(pendingProposal)}</Text>
        <View style={styles.liveActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Confirm action" onPress={() => void confirmPendingAction()} style={[styles.talkButton, { backgroundColor: colors.primary }]}><Text style={[styles.controlText, { color: colors.primaryForeground }]}>Confirm</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel action" onPress={() => void cancelPendingAction()} style={[styles.controlButton, { borderColor: colors.border, backgroundColor: colors.card }]}><Text style={[styles.controlText, { color: colors.foreground }]}>Cancel</Text></Pressable>
        </View>
      </View> : null}

      <View style={[styles.composer, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <TextInput accessibilityLabel="Assistant message" value={input} onChangeText={setInput} multiline placeholder="Ask Nexus Assistant…" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground }]} />
        <View style={styles.liveActions}>
          <Pressable accessibilityRole="button" accessibilityLabel={voiceState === 'listening' ? 'Stop voice input' : 'Start voice input'} onPress={() => void toggleVoiceInput()} style={[styles.controlButton, { borderColor: colors.border, backgroundColor: colors.background }]}><Feather name="mic" size={18} color={colors.foreground} /><Text style={[styles.controlText, { color: colors.foreground }]}>{voiceState === 'listening' ? 'Stop' : 'Voice'}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Send assistant message" disabled={!hasText || busy} onPress={() => void send()} style={[styles.talkButton, { backgroundColor: colors.primary, opacity: !hasText || busy ? 0.45 : 1 }]}><Feather name="send" size={17} color={colors.primaryForeground} /><Text style={[styles.controlText, { color: colors.primaryForeground }]}>{busy ? 'Working…' : 'Send'}</Text></Pressable>
        </View>
      </View>

      <View style={[styles.proposal, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.proposalTitle, { color: colors.foreground }]}>Assistant assets</Text>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>Nexus Core AI is downloaded outside the APK and bootstrapped quietly after login. Voice assets remain separate because speech synthesis is a different runtime.</Text>
        <View style={styles.liveActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Download Nexus Core AI" onPress={() => void downloadModel()} disabled={assetBusy !== null} style={[styles.controlButton, { borderColor: colors.border, backgroundColor: colors.card }]}><Text style={[styles.controlText, { color: colors.foreground }]}>{assetBusy === NEXUS_CORE_MODEL_ID ? 'Downloading…' : 'Download AI'}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Download assistant voice" onPress={() => void downloadVoice()} disabled={assetBusy !== null} style={[styles.controlButton, { borderColor: colors.border, backgroundColor: colors.card }]}><Text style={[styles.controlText, { color: colors.foreground }]}>{assetBusy && assetBusy !== NEXUS_CORE_MODEL_ID ? 'Downloading…' : 'Download Voice'}</Text></Pressable>
        </View>
      </View>

      {liveMode ? <View style={[styles.proposal, { borderColor: colors.primary, backgroundColor: colors.card }]}>
        <Text style={[styles.proposalTitle, { color: colors.foreground }]}>Nexus Live Mode</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Voice state: {voiceState}. Hold Talk to speak. Release Talk to process the captured audio. End Live Call exits this mode.</Text>
        <View style={styles.liveActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Hold to talk" onPressIn={() => void holdToTalk()} onPressOut={() => { void releaseTalk(); }} style={[styles.talkButton, { backgroundColor: colors.primary }]}><Feather name="mic" size={23} color={colors.primaryForeground} /><Text style={[styles.controlText, { color: colors.primaryForeground }]}>Hold to Talk</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Stop voice output" onPress={() => void voiceBridge?.stopOutput().catch(() => undefined)} style={[styles.controlButton, { borderColor: colors.border, backgroundColor: colors.card }]}><Feather name="volume-x" size={19} color={colors.foreground} /><Text style={[styles.controlText, { color: colors.foreground }]}>Stop Output</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="End Live Call" onPress={() => void endLiveMode()} style={[styles.endButton, { backgroundColor: colors.destructive ?? colors.primary }]}><Feather name="phone-off" size={19} color={colors.primaryForeground} /><Text style={[styles.controlText, { color: colors.primaryForeground }]}>End Live Call</Text></Pressable>
        </View>
      </View> : <Pressable accessibilityRole="button" accessibilityLabel="Open Live Mode" onPress={() => void toggleLiveMode()} style={[styles.liveButton, { borderColor: colors.border, backgroundColor: colors.card }]}><Feather name="phone" size={18} color={colors.foreground} /><Text style={[styles.controlText, { color: colors.foreground }]}>Open Live Mode</Text></Pressable>}

      {voiceInput ? <Text accessibilityLiveRegion="polite" style={[styles.note, { color: colors.mutedForeground }]}>Voice input state: {voiceState}. Transcription is submitted through the same Assistant route as typed text.</Text> : null}
      <Text style={[styles.note, { color: colors.mutedForeground }]}>APK limit {ASSISTANT_LIMITS.maxApkSizeMb}MB · bundled chat model {ASSISTANT_LIMITS.maxBundledModelMb}MB · bundled voice {ASSISTANT_LIMITS.maxBundledVoiceMb}MB</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  body: { fontSize: 14, lineHeight: 21 },
  note: { fontSize: 12, lineHeight: 18 },
  status: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 14, gap: 4 },
  statusTitle: { fontSize: 13, fontWeight: '800' },
  chat: { gap: 10, marginBottom: 14 },
  message: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 5 },
  role: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  webCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 14 },
  section: { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  webResult: { paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  webTitle: { fontSize: 12, fontWeight: '700' },
  proposal: { borderWidth: 1, borderRadius: 16, padding: 13, marginBottom: 14, gap: 7 },
  proposalTitle: { fontSize: 13, fontWeight: '800' },
  liveActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  talkButton: { minHeight: 48, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  controlButton: { minHeight: 48, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  endButton: { minHeight: 48, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  controlText: { fontSize: 13, fontWeight: '800' },
  composer: { borderWidth: 1, borderRadius: 18, padding: 10, marginBottom: 14, gap: 10 },
  input: { minHeight: 86, fontSize: 16, lineHeight: 22, paddingHorizontal: 8, paddingTop: 8, textAlignVertical: 'top' },
  liveButton: { minHeight: 52, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
});
