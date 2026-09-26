import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { ASSISTANT_LIMITS, ASSISTANT_MODELS, ASSISTANT_VOICES, NEXUS_CORE_MODEL_ID } from '@/features/nexus-assistant/assistantConfig';
import { addMessage, clearAllAssistantData, ensureSession, getHistoryEnabled, initAssistantStore, listMessages, listSessions, setHistoryEnabled, type ChatMessage } from '@/features/nexus-assistant/assistantStore';
import { useAuth } from '@/features/auth/useAuth';
import { downloadAssistantModel, downloadAssistantVoice } from '@/features/nexus-assistant/modelManager';
import { getLocalInferenceEngine } from '@/features/nexus-assistant/localInference';
import { streamAssistantReply } from '@/features/nexus-assistant/stage2Agent';
import { planCapability, formatCapabilityConfirmation, type CapabilityProposal } from '@/features/nexus-assistant/agentPlanner';
import { getAssistantToolCatalog, openAssistantTool, type AssistantToolDefinition } from '@/features/nexus-assistant/assistantToolAdapter';
import { answerNexusIdentityQuestion } from '@/features/nexus-assistant/nexusKnowledge';
import { parseAssistantPdfCommand, type AssistantPdfAttachment } from '@/features/nexus-assistant/pdfAssistantCommands';
import { runStage3Agent } from '@/features/nexus-assistant/stage3Agent';
import { getWeatherLocalFirst } from '@/features/nexus-assistant/stage6Weather';
import { createStage7VoiceBridge, speakAssistant, type VoiceRuntimeStatus } from '@/features/nexus-assistant/stage7VoiceBridge';
import type { Stage6VoiceBridge, VoiceInputState } from '@/features/nexus-assistant/stage6Voice';
import { routeAssistantRequest } from '@/features/nexus-assistant/stage9AssistantRouter';
import { getResolvedAssistantContext } from '@/features/nexus-assistant/assistantContextService';
import { getAssetStatus } from '@/features/nexus-assistant/stage8AssetManager';
import { MusicAppsPanel } from '@/features/nexus-assistant/musicApps';
import { usePersistentMedia } from '@/media-player/PersistentMediaController';

const SESSION_ID = 'default';
const CALCULATOR_SYSTEM_CONTRACT = 'For calculator requests, identify the module first; give an exact deterministic answer when calculator context contains one; then provide smart analysis as a compact table-like set of rows covering inflation, available live market context and what-if scenarios; finish with exactly two practical suggestions. Never invent live rates, salaries, prices or market trends. State when data is cached or unavailable.';
type PdfCommandMode = 'lock' | 'unlock' | 'compress' | 'rotate' | null;

function redactedAssistantUserText(text: string): string {
  const command = parseAssistantPdfCommand(text);
  if (!command) return text;
  if (command.kind === 'lock' || command.kind === 'unlock') return '/' + command.kind + ' [password redacted]';
  return text;
}

export default function NexusAssistantScreen() {
  const colors = useColors();
  const auth = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ calculatorContext?: string }>();
  const calculatorContext = typeof params.calculatorContext === 'string' ? params.calculatorContext : '';
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
  const [pdfAttachment, setPdfAttachment] = useState<AssistantPdfAttachment | null>(null);
  const [pdfMode, setPdfMode] = useState<PdfCommandMode>(null);
  const [pdfPassword, setPdfPassword] = useState('');
  const [showTools, setShowTools] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{ title: string; message: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyEnabled, setHistoryEnabledState] = useState(true);
  const [sessionList, setSessionList] = useState<Array<{ id: string; title: string; createdAt: number; messageCount: number }>>([]);
  const toolCatalog = useMemo(() => getAssistantToolCatalog(), []);
  const pinnedTools = useMemo(() => toolCatalog.filter((tool) => ['file','qr-code','pdf-lock','pdf-unlock','pdf-compress'].includes(tool.id) || /PDF|File|QR/i.test(tool.title)).slice(0, 10), [toolCatalog]);
  const hasText = input.trim().length > 0;

  useEffect(() => {
    const created = createStage7VoiceBridge(
      (next: VoiceRuntimeStatus) => {
        if (next.state === 'listening') setVoiceState('listening');
        else if (next.state === 'processing') setVoiceState('processing');
        else setVoiceState('idle');
        if (next.error) setStatus('Voice error: ' + next.error);
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
      const retention = await getHistoryEnabled();
      setHistoryEnabledState(retention);
      await ensureSession(SESSION_ID, 'Nexus Assistant');
      setMessages(retention ? await listMessages(SESSION_ID) : []);
      const context = await getResolvedAssistantContext();
      setActiveContextLabel(context.book?.title ?? context.file?.name ?? null);
      const engine = await getLocalInferenceEngine();
      const available = await engine.isAvailable();
      setEngineReady(available);
      setStatus(available ? 'Local assistant ready. Gemini chat and Nexus agent actions are ready.' : 'Assistant ready. Gemini chat is available through the Gateway when configured.');
      if (calculatorContext) setInput('Explain and analyze the calculator context I just opened.');
    })().catch(() => setStatus('Local chat storage could not be opened.'));
  }, []);

  const history = useMemo(
    () => messages.slice(-12).map((message) => ({
      role: message.role === 'assistant' ? 'assistant' as const : 'user' as const,
      text: message.content,
    })),
    [messages],
  );

  const refreshMessages = async () => setMessages(historyEnabled ? await listMessages(SESSION_ID) : []);
  const toggleHistory = async () => {
    const next = !historyEnabled;
    await setHistoryEnabled(next);
    setHistoryEnabledState(next);
    setMessages(next ? await listMessages(SESSION_ID) : []);
    setStatus(next ? 'Chat history is enabled and linked to your signed-in account.' : 'Chat history is off. New chats will not be saved.');
  };
  const clearChats = async () => {
    await clearAllAssistantData();
    await ensureSession(SESSION_ID, 'Nexus Assistant');
    setMessages([]);
    setSessionList([]);
    setStatus('All Nexus Assistant chats cleared from this device.');
  };
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

  const choosePdf = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: false, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setPdfAttachment({ uri: asset.uri, name: asset.name || 'document.pdf' });
    setStatus('Local PDF attached to Nexus Assistant.');
  };

  const choosePdfMode = (mode: PdfCommandMode) => {
    setPdfMode(mode);
    if (mode) setInput('/' + mode);
    if (mode === 'lock' || mode === 'unlock') setStatus('Enter the PDF password in the local password field. It is not sent to Gemini.');
  };

  const send = async (providedText?: string, fromLiveMode = liveMode) => {
    let text = (providedText ?? input).trim();
    if (pdfMode === 'lock' || pdfMode === 'unlock') {
      if (!pdfAttachment) {
        setStatus('Attach a local PDF first.');
        return;
      }
      if (!pdfPassword.trim()) {
        setStatus('Enter a PDF password first.');
        return;
      }
      text = '/' + pdfMode + ' ' + pdfPassword.trim();
    }
    if (!text || busy) return;

    const pdfCommand = parseAssistantPdfCommand(text);
    const identity = answerNexusIdentityQuestion(text);

    setBusy(true);
    setInput('');
    setStreaming('');
    setPendingProposal(null);
    setWebResults([]);

    try {
      await addMessage(SESSION_ID, 'user', redactedAssistantUserText(text));
      await refreshMessages();

      if (identity) {
        await addMessage(SESSION_ID, 'assistant', identity);
        await refreshMessages();
        setStatus('Answered from Nexus local product knowledge.');
        await speakResponseForMode(identity, fromLiveMode);
        return;
      }

      if (pdfCommand) {
        const result = await runStage3Agent({
          sessionId: SESSION_ID,
          userText: text,
          confirmed: true,
          pdfAttachment,
          onStatus: setStatus,
        });
        if (result) {
          setGeneratedResult(result.success ? { title: 'Nexus Assistant result', message: result.message } : null);
          await refreshMessages();
          setPdfPassword('');
          setPdfMode(null);
          if (result.success) setPdfAttachment(null);
          await speakResponseForMode(result.message, fromLiveMode);
          return;
        }
      }

      const proposal = planCapability(text);
      if (proposal) {
        if (proposal.capability.id === 'qr-generate' || proposal.capability.id === 'tool-open') {
          const result = await runStage3Agent({ sessionId: SESSION_ID, userText: text, confirmed: true, proposal, onStatus: setStatus });
          if (result?.success) setGeneratedResult({ title: 'Tool action ready', message: result.message });
          await refreshMessages();
          await speakResponseForMode(result?.message ?? '', fromLiveMode);
          return;
        }

        if (!proposal.requiresConfirmation) {
          const result = await runStage3Agent({ sessionId: SESSION_ID, userText: text, confirmed: false, proposal, onStatus: setStatus });
          if (result?.success) {
            setGeneratedResult({ title: 'Nexus Assistant action', message: result.message });
          }
          await refreshMessages();
          await speakResponseForMode(result?.message ?? '', fromLiveMode);
          return;
        }

        setPendingProposal(proposal);
        const confirmation = formatCapabilityConfirmation(proposal);
        await addMessage(SESSION_ID, 'assistant', confirmation);
        await refreshMessages();
        setStatus('Action prepared. Confirm it explicitly before Nexus Assistant executes it.');
        return;
      }

      const context = await getResolvedAssistantContext();

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
        setStatus(calculatorContext ? 'Processing calculator context through Gemini routing…' : 'Checking Gemini and optional web search through Nexus Gateway…');
        const routed = await routeAssistantRequest({ message: text, history, bookContext: context.book, fileContext: context.file });
        setWebResults(routed.web);
        if (routed.provider) {
          const responseText = calculatorContext
            ? CALCULATOR_SYSTEM_CONTRACT + '\n\nCALCULATOR CONTEXT:\n' + calculatorContext + '\n\nUSER REQUEST:\n' + text + '\n\nPROVIDER RESPONSE:\n' + routed.provider.text
            : routed.provider.text;
          await addMessage(SESSION_ID, 'assistant', responseText);
          await refreshMessages();
          const providerLabel = routed.provider.provider === 'anthropic' ? 'Claude (Anthropic)' : routed.provider.provider === 'openai' ? 'OpenAI' : 'Gemini';
          setStatus(providerLabel + ' response received through Nexus Assistant.');
          await speakResponseForMode(responseText, fromLiveMode);
          return;
        }
      } catch {}

      if (!engineReady) {
        const fallback = context.prompt
          ? 'Nexus Assistant could not reach an inference provider. Your selected context stays on this device.'
          : 'Nexus Assistant could not reach the selected chat provider and local inference is not available in this build. Your message is stored locally on this device.';
        await addMessage(SESSION_ID, 'assistant', fallback);
        await refreshMessages();
        setStatus('No chat inference provider available; message remains local.');
        await speakResponseForMode(fallback, fromLiveMode);
        return;
      }

      const model = ASSISTANT_MODELS.find((item) => item.id === NEXUS_CORE_MODEL_ID) ?? ASSISTANT_MODELS.find((item) => item.kind === 'chat');
      if (!model) throw new Error('NEXUS_CORE_MODEL_UNAVAILABLE');
      if (getAssetStatus(model.id) !== 'ready') setStatus('Nexus Core AI is still downloading in the background.');

      const base = calculatorContext
        ? CALCULATOR_SYSTEM_CONTRACT + '\n\nCALCULATOR CONTEXT:\n' + calculatorContext + '\n\nUSER REQUEST:\n' + text
        : context.prompt
          ? context.prompt + '\n\nUSER QUESTION:\n' + text
          : text;

      const localReply = await streamAssistantReply({
        sessionId: SESSION_ID,
        modelId: model.id,
        modelPath: model.url,
        userText: base,
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
    if (!voiceBridge) { setStatus('Voice bridge is still initializing.'); return; }
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
    if (!voiceBridge) { setStatus('Voice bridge is still initializing.'); return; }
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

  const confirmPendingAction = async () => {
    if (!pendingProposal || busy) return;
    setBusy(true);
    try {
      await runStage3Agent({
        sessionId: SESSION_ID,
        userText: pendingProposal.capability.id === 'open-url' ? 'open ' + (pendingProposal.args.url ?? '') : pendingProposal.capability.title,
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
    try { await downloadAssistantModel(model.id); setStatus('Local Nexus Core AI downloaded. It remains outside the APK.'); }
    catch { setStatus('Model download failed. Background retry will continue automatically.'); }
    finally { setAssetBusy(null); }
  };

  const downloadVoice = async () => {
    const voice = ASSISTANT_VOICES[0];
    setAssetBusy(voice.id);
    setStatus('Preparing the local Piper voice download…');
    try { await downloadAssistantVoice(voice.id); setStatus('Piper voice downloaded.'); }
    catch { setStatus('Voice download failed. Check your connection and try again.'); }
    finally { setAssetBusy(null); }
  };

  return <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}>
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open Nexus Assistant menu" onPress={() => setMenuOpen((v) => !v)} style={[styles.menuButton, { backgroundColor: colors.secondary, borderColor: colors.border }]}><Feather name="menu" size={22} color={colors.foreground} /></Pressable>
        <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="cpu" size={23} color={colors.primary} /></View>
      </View>
      <View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus Assistant</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Chat + manual tools • {historyEnabled ? 'History ON' : 'History OFF'}</Text></View>
    </View>
    {menuOpen ? (
      <View accessibilityLabel="Nexus Assistant menu" style={[styles.sideMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable accessibilityRole="button" onPress={async () => { setHistoryOpen(true); setMenuOpen(false); setSessionList(await listSessions()); }} style={styles.menuRow}><Feather name="clock" size={18} color={colors.primary} /><Text style={[styles.menuText, { color: colors.foreground }]}>Chat History</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => { setMenuOpen(false); setStatus('Assistant settings are available below.'); }} style={styles.menuRow}><Feather name="settings" size={18} color={colors.primary} /><Text style={[styles.menuText, { color: colors.foreground }]}>Settings</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => void toggleHistory()} style={styles.menuRow}><Feather name={historyEnabled ? 'eye-off' : 'eye'} size={18} color={colors.primary} /><Text style={[styles.menuText, { color: colors.foreground }]}>{historyEnabled ? 'Turn history off' : 'Turn history on'}</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => void clearChats()} style={styles.menuRow}><Feather name="trash-2" size={18} color={colors.destructive} /><Text style={[styles.menuText, { color: colors.destructive }]}>Clear Chats</Text></Pressable>
      </View>
    ) : null}

    <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statusTitle, { color: colors.foreground }]}>Assistant Settings</Text>
      <Text style={[styles.note, { color: colors.mutedForeground }]}>Signed in: {auth.session?.user.email ?? 'Not signed in'}</Text>
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: historyEnabled }} onPress={() => void toggleHistory()} style={[styles.settingRow, { borderColor: colors.border }]}>
        <View style={{ flex: 1 }}><Text style={[styles.menuText, { color: colors.foreground }]}>Save chat history</Text><Text style={[styles.note, { color: colors.mutedForeground }]}>When off, new conversations are not persisted.</Text></View>
        <Text style={[styles.buttonText, { color: colors.primary }]}>{historyEnabled ? 'On' : 'Off'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => void clearChats()} style={[styles.settingRow, { borderColor: colors.border }]}>
        <Text style={[styles.menuText, { color: colors.destructive }]}>Clear all chats</Text>
      </Pressable>
    </View>

    {historyOpen ? (
      <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.toolsHeader}><Text style={[styles.statusTitle, { color: colors.foreground }]}>Chat History</Text><Pressable accessibilityRole="button" onPress={() => setHistoryOpen(false)} style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.background }]}><Feather name="x" size={18} color={colors.foreground} /></Pressable></View>
        {sessionList.length ? sessionList.map((session) => <View key={session.id} style={[styles.historyRow, { borderColor: colors.border }]}><Text style={[styles.menuText, { color: colors.foreground }]}>{session.title}</Text><Text style={[styles.note, { color: colors.mutedForeground }]}>{session.messageCount} messages</Text></View>) : <Text style={[styles.note, { color: colors.mutedForeground }]}>No saved chats.</Text>}
      </View>
    ) : null}

    <View accessibilityLiveRegion="polite" style={[styles.status, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={[styles.statusTitle, { color: colors.foreground }]}>Runtime</Text>
      <Text style={[styles.note, { color: colors.mutedForeground }]}>{status}</Text>
      {calculatorContext ? <Text style={[styles.note, { color: colors.primary }]}>Calculator context attached.</Text> : null}
      {activeContextLabel ? <Text style={[styles.note, { color: colors.primary }]}>Active context: {activeContextLabel}</Text> : null}
      {pdfAttachment ? <Text style={[styles.note, { color: colors.primary }]}>Local PDF attached: {pdfAttachment.name}</Text> : null}
    </View>

    {pdfAttachment ? (
      <View style={[styles.pdfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.statusTitle, { color: colors.foreground }]}>PDF Command</Text>
        <View style={styles.actionRow}>
          {(['lock', 'unlock', 'compress', 'rotate'] as const).map((mode) => (
            <Pressable key={mode} accessibilityRole="button" onPress={() => choosePdfMode(mode)} style={[styles.secondaryButton, { borderColor: pdfMode === mode ? colors.primary : colors.border }]}>
              <Text style={[styles.buttonText, { color: colors.foreground }]}>/{mode}</Text>
            </Pressable>
          ))}
        </View>
        {(pdfMode === 'lock' || pdfMode === 'unlock') && <TextInput
          accessibilityLabel="Local PDF password"
          placeholder="PDF password"
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry
          value={pdfPassword}
          onChangeText={setPdfPassword}
          style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
        />}
        <Text style={[styles.note, { color: colors.mutedForeground }]}>Password stays on the device and is not sent to Gemini.</Text>
      </View>
    ) : null}

    <View style={styles.chat} accessibilityLiveRegion="polite">
      {messages.map((message) => <View key={message.id} style={[styles.message, { backgroundColor: message.role === 'user' ? colors.secondary : colors.card, borderColor: colors.border }]}>
        <Text style={[styles.role, { color: colors.foreground }]}>{message.role === 'user' ? 'You' : message.role === 'system' ? 'System' : 'Nexus Assistant'}</Text>
        <Text selectable style={[styles.body, { color: colors.foreground }]}>{message.content}</Text>
      </View>)}
      {streaming ? <View style={[styles.message, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.role, { color: colors.foreground }]}>Nexus Assistant</Text><Text selectable style={[styles.body, { color: colors.foreground }]}>{streaming}</Text></View> : null}
    </View>

    {pendingProposal ? <View style={[styles.confirm, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statusTitle, { color: colors.foreground }]}>Confirmation required</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>{formatCapabilityConfirmation(pendingProposal)}</Text>
      <View style={styles.actionRow}>
        <Pressable accessibilityRole="button" onPress={() => { setPendingProposal(null); setStatus('Action cancelled.'); }} style={[styles.secondaryButton, { borderColor: colors.border }]}><Text style={[styles.buttonText, { color: colors.foreground }]}>Cancel</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => { const proposal = pendingProposal; setPendingProposal(null); void runStage3Agent({ sessionId: SESSION_ID, userText: proposal.capability.id === 'open-url' ? 'open ' + (proposal.args.url ?? '') : proposal.capability.title, confirmed: true, proposal, onStatus: setStatus }).then(() => refreshMessages()).catch(() => undefined); }} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Confirm</Text></Pressable>
      </View>
    </View> : null}

    {showTools ? (
      <View accessibilityLabel="Nexus Assistant tool attachments" style={[styles.toolsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.toolsHeader}>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>Attach a tool</Text>
          <Pressable accessibilityRole="button" onPress={() => setShowTools(false)} style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.background }]}><Feather name="x" size={18} color={colors.foreground} /></Pressable>
        </View>
        <View style={styles.toolGrid}>
          <MusicAppsPanel />
          {pinnedTools.filter((tool) => !['file', 'qr-code'].includes(tool.id)).map((tool) => (
            <Pressable key={tool.id} accessibilityRole="button" accessibilityLabel={tool.title} onPress={() => { openAssistantTool(tool); setStatus(tool.title + ' opened through the existing Nexus Plus tool.'); }} style={[styles.toolChip, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Feather name="tool" size={16} color={colors.primary} />
              <Text style={[styles.toolChipText, { color: colors.foreground }]}>{tool.title}</Text>
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" accessibilityLabel="Document" onPress={() => void choosePdf()} style={[styles.toolChip, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Feather name="file-text" size={16} color={colors.primary} />
            <Text style={[styles.toolChipText, { color: colors.foreground }]}>Document</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="QR code generation" onPress={() => { const qr = pinnedTools.find((tool) => tool.id === 'qr-code'); if (qr) openAssistantTool(qr); }} style={[styles.toolChip, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Feather name="grid" size={16} color={colors.primary} />
            <Text style={[styles.toolChipText, { color: colors.foreground }]}>QR Code</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Document reader" onPress={() => { const reader = toolCatalog.find((tool) => /document reader|book reader|reader/i.test(tool.title)); if (reader) openAssistantTool(reader); else setStatus('Document Reader is not registered on this build.'); }} style={[styles.toolChip, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Feather name="book-open" size={16} color={colors.primary} />
            <Text style={[styles.toolChipText, { color: colors.foreground }]}>Document Reader</Text>
          </Pressable>
        </View>
      </View>
    ) : null}

    {generatedResult ? (
      <View accessibilityLiveRegion="polite" style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text accessibilityRole="header" style={[styles.statusTitle, { color: colors.foreground }]}>{generatedResult.title}</Text>
        <Text selectable style={[styles.body, { color: colors.mutedForeground }]}>{generatedResult.message}</Text>
        <View style={styles.actionRow}>
          <Pressable accessibilityRole="button" onPress={() => setGeneratedResult(null)} style={[styles.secondaryButton, { borderColor: colors.border }]}><Text style={[styles.buttonText, { color: colors.foreground }]}>Close</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => void send('regenerate')} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Regenerate</Text></Pressable>
        </View>
      </View>
    ) : null}

    <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TextInput accessibilityLabel="Assistant message" value={input} onChangeText={setInput} multiline placeholder="Ask Nexus Assistant…" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground }]} />
      <View style={styles.actionRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Attach a Nexus tool" onPress={() => setShowTools((v) => !v)} style={[styles.secondaryButton, { borderColor: showTools ? colors.primary : colors.border }]}><Text style={[styles.buttonText, { color: colors.foreground }]}>Attach</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={toggleVoiceInput} style={[styles.secondaryButton, { borderColor: colors.border }]}><Text style={[styles.buttonText, { color: colors.foreground }]}>{voiceState === 'listening' ? 'Stop voice' : 'Voice'}</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => void toggleLiveMode()} style={[styles.secondaryButton, { borderColor: colors.border }]}><Text style={[styles.buttonText, { color: colors.foreground }]}>{liveMode ? 'End Live' : 'Live Mode'}</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={!hasText || busy} onPress={() => void send()} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: !hasText || busy ? 0.5 : 1 }]}><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{busy ? 'Working…' : 'Send'}</Text></Pressable>
      </View>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  backgroundMusicCard: { marginHorizontal: 12, marginBottom: 8, borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center' },
  backgroundMusicCopy: { flex: 1 }, musicTitle: { fontSize: 15, fontWeight: '800', marginTop: 3 }, musicArtist: { fontSize: 12, marginTop: 2 }, musicActions: { flexDirection: 'row', gap: 4 },
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuButton: { width: 44, height: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sideMenu: { borderWidth: 1, borderRadius: 18, padding: 10, marginBottom: 12, gap: 2 },
  menuRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8 },
  menuText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  settingsCard: { borderWidth: 1, borderRadius: 18, padding: 13, marginBottom: 12, gap: 8 },
  settingRow: { minHeight: 48, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  historyCard: { borderWidth: 1, borderRadius: 18, padding: 13, marginBottom: 12 },
  historyRow: { borderTopWidth: 1, paddingVertical: 9 },
  icon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 12 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  body: { fontSize: 11, lineHeight: 17 },
  status: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 4, marginBottom: 14 },
  statusTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  note: { fontSize: 10.5, lineHeight: 16 },
  chat: { gap: 9 },
  message: { borderWidth: 1, borderRadius: 16, padding: 13 },
  role: { fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  pdfCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 12, gap: 8 },
  confirm: { borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 12, gap: 7 },
  inputCard: { borderWidth: 1, borderRadius: 18, padding: 12, marginTop: 12 },
  toolsCard: { borderWidth: 1, borderRadius: 18, padding: 12, marginTop: 12 },
  toolsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  toolChip: { minHeight: 48, borderRadius: 13, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7, width: '48%' },
  toolChipText: { flex: 1, fontSize: 10.5, fontFamily: 'Inter_700Bold' },
  resultCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 12 },
  input: { minHeight: 48, maxHeight: 150, fontSize: 12, lineHeight: 18, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 9 },
  secondaryButton: { minHeight: 44, borderWidth: 1, borderRadius: 13, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center', flex: 1 },
  primaryButton: { minHeight: 44, borderRadius: 13, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', flex: 1 },
  buttonText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
});