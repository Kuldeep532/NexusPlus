import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { ASSISTANT_LIMITS, ASSISTANT_MODELS, ASSISTANT_VOICES } from '@/features/nexus-assistant/assistantConfig';
import { addMessage, ensureSession, initAssistantStore, listMessages, type ChatMessage } from '@/features/nexus-assistant/assistantStore';
import { downloadAssistantModel, downloadAssistantVoice } from '@/features/nexus-assistant/modelManager';

const SESSION_ID = 'default';

export default function NexusAssistantScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Local assistant is ready.');
  const [assetBusy, setAssetBusy] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      await initAssistantStore();
      await ensureSession(SESSION_ID, 'Nexus Assistant');
      setMessages(await listMessages(SESSION_ID));
    })().catch(() => setStatus('Local chat storage could not be opened.'));
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setInput('');
    try {
      await addMessage(SESSION_ID, 'user', text);
      // Stage 1 intentionally does not execute inference. Native local-agent runtime is added next.
      await addMessage(SESSION_ID, 'assistant', 'Nexus Assistant local inference engine will answer here in the next stage. Your message was saved locally on this device.');
      setMessages(await listMessages(SESSION_ID));
    } catch {
      setStatus('Could not save this message locally.');
    } finally {
      setBusy(false);
    }
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
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Private, on-device-first agent with downloadable local models.</Text>
        </View>
      </View>

      <View accessibilityLiveRegion="polite" style={[styles.status, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.statusTitle, { color: colors.foreground }]}>Privacy</Text>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>{status}</Text>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>Chat history uses SQLite on the phone. This stage sends chat text to no remote AI service.</Text>
      </View>

      <View style={styles.chat} accessibilityLiveRegion="polite">
        {messages.length === 0 ? <Text style={[styles.note, { color: colors.mutedForeground }]}>Start a private local conversation.</Text> : messages.map((message) => (
          <View key={message.id} style={[styles.message, { backgroundColor: message.role === 'user' ? colors.secondary : colors.card, borderColor: colors.border }]}>
            <Text style={[styles.role, { color: colors.foreground }]}>{message.role === 'user' ? 'You' : 'Nexus Assistant'}</Text>
            <Text selectable style={[styles.body, { color: colors.foreground }]}>{message.content}</Text>
          </View>
        ))}
      </View>

      <TextInput accessibilityLabel="Message Nexus Assistant" multiline value={input} onChangeText={setInput} placeholder="Ask Nexus Assistant…" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} />
      <Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={busy} onPress={() => void send()} style={[styles.button, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}>
        {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="send" size={18} color={colors.primaryForeground} />}
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{busy ? 'Saving…' : 'Send'}</Text>
      </Pressable>

      <View style={[styles.assetCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.section, { color: colors.foreground }]}>Optional local downloads</Text>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>APK target: under {ASSISTANT_LIMITS.maxApkSizeMb} MB. Model and voice weights are downloaded only when you choose them.</Text>
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
  assetCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 18, gap: 8 },
  section: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  secondaryButton: { minHeight: 48, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12, marginTop: 6 },
});
