import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { analyzeTextEmotion, listTtsVoices, type TtsSettings, type TtsVoiceOption } from '@/features/audio-editor/ttsEngine';
import { stopTextToSpeech } from '@/features/audio-editor/textToSpeech';

const ALL = 'all';

type SelectedVoice = Exclude<TtsVoiceOption, { provider: 'system' }>;

export default function TextToSpeechScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [voices, setVoices] = useState<TtsVoiceOption[]>([]);
  const [language, setLanguage] = useState(ALL);
  const [provider, setProvider] = useState<'piper' | 'clone'>('piper');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<TtsSettings>({ speed: 1, pitch: 1, autoTune: true });
  const [message, setMessage] = useState('');

  const loadVoices = useCallback(async () => {
    setLoading(true);
    try {
      const available = await listTtsVoices();
      setVoices(available);
      setSelectedVoiceId((current) => current && available.some((voice) => voice.id === current) ? current : available[0]?.id ?? '');
      setMessage(`${available.filter((voice) => voice.provider !== 'system').length} Nexus voices loaded, including installed Piper and clone voices.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load TTS voices.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadVoices(); return () => { void stopTextToSpeech(); }; }, [loadVoices]);

  const languages = useMemo(() => Array.from(new Set(voices.filter((voice) => voice.provider !== 'system').map((voice) => voice.language).filter(Boolean))).sort(), [voices]);
  const filtered = useMemo(() => voices.filter((voice) => voice.provider === provider && (language === ALL || voice.language === language)), [voices, provider, language]);
  const selected = (voices.find((voice) => voice.id === selectedVoiceId && voice.provider === provider) ?? filtered[0] ?? null) as SelectedVoice | null;
  const analysis = useMemo(() => analyzeTextEmotion(text), [text]);

  useEffect(() => {
    if (!filtered.some((voice) => voice.id === selectedVoiceId)) setSelectedVoiceId(filtered[0]?.id ?? '');
  }, [filtered, selectedVoiceId]);

  const openSettings = () => {
    setSettings((current) => current.autoTune ? { ...current, speed: analysis.speed, pitch: analysis.pitch } : current);
    setSettingsOpen(true);
  };

  const generate = () => {
    if (!text.trim()) { setMessage('Enter text before generating speech.'); return; }
    if (!selected) { setMessage('Select an installed Piper or clone voice.'); return; }
    if (!selected.installed) { setMessage('This voice is in the catalog but is not installed locally. Install it from Voice Library first.'); return; }
    router.push({ pathname: '/audio-editor/text-to-speech-result', params: { text, voiceId: selected.id, voiceName: selected.name, language: selected.language ?? '', provider: selected.provider, speed: String(settings.autoTune ? analysis.speed : settings.speed), pitch: String(settings.autoTune ? analysis.pitch : settings.pitch), emotion: analysis.emotion } } as never);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ title: 'Text to Speech' }} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => `${item.provider}:${item.id}`}
        contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }}
        ListHeaderComponent={<View>
          <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="volume-2" size={24} color={colors.primary} /></View><View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus Text to Speech</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Offline Piper voices and installed clone voices with automatic expression tuning.</Text></View></View>
          <Text style={[styles.label, { color: colors.foreground }]}>Engine</Text>
          <View style={styles.segment}><Pressable onPress={() => setProvider('piper')} accessibilityRole="button" accessibilityState={{ selected: provider === 'piper' }} style={[styles.segmentButton, { backgroundColor: provider === 'piper' ? colors.secondary : colors.card, borderColor: provider === 'piper' ? colors.primary : colors.border }]}><Text style={[styles.buttonText, { color: colors.foreground }]}>Piper TTS</Text></Pressable><Pressable onPress={() => setProvider('clone')} accessibilityRole="button" accessibilityState={{ selected: provider === 'clone' }} style={[styles.segmentButton, { backgroundColor: provider === 'clone' ? colors.secondary : colors.card, borderColor: provider === 'clone' ? colors.primary : colors.border }]}><Text style={[styles.buttonText, { color: colors.foreground }]}>Clone Voice</Text></Pressable></View>
          <Text style={[styles.label, { color: colors.foreground }]}>Select language</Text><View style={styles.chips}><Pressable onPress={() => setLanguage(ALL)} style={[styles.chip, { backgroundColor: language === ALL ? colors.secondary : colors.card, borderColor: language === ALL ? colors.primary : colors.border }]}><Text style={[styles.chipText, { color: colors.foreground }]}>All languages</Text></Pressable>{languages.map((item) => <Pressable key={item} onPress={() => setLanguage(item)} style={[styles.chip, { backgroundColor: language === item ? colors.secondary : colors.card, borderColor: language === item ? colors.primary : colors.border }]}><Text style={[styles.chipText, { color: colors.foreground }]}>{item}</Text></Pressable>)}</View>
          <Text style={[styles.label, { color: colors.foreground }]}>Select voice</Text>
          <View style={[styles.voicePanel, { backgroundColor: colors.card, borderColor: colors.border }]}>{loading ? <ActivityIndicator color={colors.primary} style={{ padding: 18 }} /> : filtered.length ? filtered.map((voice) => <Pressable key={voice.id} onPress={() => setSelectedVoiceId(voice.id)} accessibilityRole="radio" accessibilityState={{ checked: voice.id === selectedVoiceId }} style={[styles.voiceRow, { borderBottomColor: colors.border }]}><View style={[styles.radio, { borderColor: voice.id === selectedVoiceId ? colors.primary : colors.border }]}>{voice.id === selectedVoiceId && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}</View><View style={styles.voiceCopy}><Text style={[styles.voiceName, { color: colors.foreground }]}>{voice.name}</Text><Text style={[styles.voiceMeta, { color: colors.mutedForeground }]}>{voice.language}{'quality' in voice && voice.quality ? ` • ${voice.quality}` : ''}{'installed' in voice && voice.installed ? ' • Installed' : ' • Not installed'}</Text></View></Pressable>) : <Text style={[styles.empty, { color: colors.mutedForeground }]}>No {provider} voices match this language.</Text>}</View>
          <Text style={[styles.label, { color: colors.foreground }]}>Enter text</Text>
          <TextInput value={text} onChangeText={setText} multiline textAlignVertical="top" placeholder="Type text. Emotion cues, punctuation, and wording are analyzed automatically." placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} accessibilityLabel="Enter text for Nexus text to speech" />
          <View style={[styles.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View><Text style={[styles.analysisTitle, { color: colors.foreground }]}>Automatic tuning</Text><Text style={[styles.analysisText, { color: colors.mutedForeground }]}>Emotion: {analysis.emotion} • Speed: {analysis.speed.toFixed(2)}× • Pitch: {analysis.pitch.toFixed(2)}×</Text></View><Pressable onPress={openSettings} accessibilityRole="button" style={[styles.tuneButton, { borderColor: colors.primary }]}><Feather name="sliders" size={17} color={colors.primary} /><Text style={[styles.tuneText, { color: colors.primary }]}>Speed & Pitch</Text></Pressable></View>
          <Pressable disabled={!selected || !selected.installed || loading} onPress={generate} accessibilityRole="button" style={[styles.generate, { backgroundColor: selected?.installed ? colors.primary : colors.muted }]}><Feather name="play" size={20} color={colors.primaryForeground} /><Text style={[styles.generateText, { color: colors.primaryForeground }]}>Generate Speech</Text></Pressable>
          {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
        </View>}
        renderItem={null}
      />

      <Modal visible={settingsOpen} transparent animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
        <View style={styles.modalOverlay}><View style={[styles.modal, { backgroundColor: colors.card, borderColor: colors.border }]}><Text accessibilityRole="header" style={[styles.modalTitle, { color: colors.foreground }]}>Speed & Pitch</Text><Text style={[styles.modalInfo, { color: colors.mutedForeground }]}>Automatic values are taken from the text analysis. Turn off Auto optimize to manually adjust them.</Text>
          <View style={styles.autoRow}><Text style={[styles.autoLabel, { color: colors.foreground }]}>Auto optimize</Text><Pressable onPress={() => setSettings((current) => ({ ...current, autoTune: !current.autoTune }))} accessibilityRole="switch" accessibilityState={{ checked: settings.autoTune }} style={[styles.switch, { backgroundColor: settings.autoTune ? colors.primary : colors.muted }]}><View style={[styles.thumb, { alignSelf: settings.autoTune ? 'flex-end' : 'flex-start', backgroundColor: colors.primaryForeground }]} /></Pressable></View>
          <Text style={[styles.sliderLabel, { color: colors.foreground }]}>Speed: {(settings.autoTune ? analysis.speed : settings.speed).toFixed(2)}×</Text><View style={styles.sliderRow}>{[0.75,0.85,0.95,1,1.05,1.15,1.25].map((value) => <Pressable key={value} disabled={settings.autoTune} onPress={() => setSettings((current) => ({ ...current, speed: value }))} style={[styles.valueChip, { borderColor: (!settings.autoTune && settings.speed === value) ? colors.primary : colors.border, backgroundColor: (!settings.autoTune && settings.speed === value) ? colors.secondary : colors.background }]}><Text style={[styles.valueText, { color: colors.foreground }]}>{value.toFixed(2)}</Text></Pressable>)}</View>
          <Text style={[styles.sliderLabel, { color: colors.foreground }]}>Pitch: {(settings.autoTune ? analysis.pitch : settings.pitch).toFixed(2)}×</Text><View style={styles.sliderRow}>{[0.80,0.90,0.95,1,1.05,1.15,1.25].map((value) => <Pressable key={value} disabled={settings.autoTune} onPress={() => setSettings((current) => ({ ...current, pitch: value }))} style={[styles.valueChip, { borderColor: (!settings.autoTune && settings.pitch === value) ? colors.primary : colors.border, backgroundColor: (!settings.autoTune && settings.pitch === value) ? colors.secondary : colors.background }]}><Text style={[styles.valueText, { color: colors.foreground }]}>{value.toFixed(2)}</Text></Pressable>)}</View>
          <Pressable onPress={() => { setSettingsOpen(false); setSettings((current) => current.autoTune ? { ...current, speed: analysis.speed, pitch: analysis.pitch } : current); }} style={[styles.done, { backgroundColor: colors.primary }]}><Text style={[styles.generateText, { color: colors.primaryForeground }]}>Apply</Text></Pressable>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({ root:{flex:1}, header:{flexDirection:'row',alignItems:'center',marginBottom:18}, icon:{width:54,height:54,borderRadius:16,alignItems:'center',justifyContent:'center'},headerCopy:{flex:1,marginLeft:14},title:{fontSize:26,fontFamily:'Inter_700Bold',marginBottom:5},subtitle:{fontSize:11.5,lineHeight:17},label:{fontSize:14,fontFamily:'Inter_700Bold',marginTop:15,marginBottom:9},segment:{flexDirection:'row',gap:8},segmentButton:{flex:1,minHeight:48,borderWidth:1,borderRadius:14,alignItems:'center',justifyContent:'center'},buttonText:{fontSize:12.5,fontFamily:'Inter_700Bold'},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{borderWidth:1,borderRadius:14,paddingHorizontal:12,paddingVertical:8},chipText:{fontSize:11.5},voicePanel:{borderWidth:1,borderRadius:16,overflow:'hidden'},voiceRow:{minHeight:66,padding:12,borderBottomWidth:1,flexDirection:'row',alignItems:'center'},radio:{width:22,height:22,borderRadius:11,borderWidth:2,alignItems:'center',justifyContent:'center'},dot:{width:10,height:10,borderRadius:5},voiceCopy:{flex:1,marginLeft:11},voiceName:{fontSize:12.5,fontFamily:'Inter_700Bold'},voiceMeta:{fontSize:10.5,marginTop:3},empty:{padding:16,fontSize:11},input:{minHeight:165,borderWidth:1,borderRadius:16,padding:14,fontSize:14,lineHeight:21},analysisCard:{marginTop:12,borderWidth:1,borderRadius:16,padding:13,flexDirection:'row',alignItems:'center',gap:10},analysisTitle:{fontSize:12.5,fontFamily:'Inter_700Bold'},analysisText:{fontSize:10.5,lineHeight:15,marginTop:4},tuneButton:{minHeight:42,borderWidth:1,borderRadius:12,paddingHorizontal:10,flexDirection:'row',alignItems:'center',gap:6},tuneText:{fontSize:10.5,fontFamily:'Inter_700Bold'},generate:{minHeight:54,borderRadius:16,marginTop:14,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:9},generateText:{fontSize:13,fontFamily:'Inter_700Bold'},message:{marginTop:12,fontSize:11,lineHeight:16},modalOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'flex-end'},modal:{borderTopLeftRadius:24,borderTopRightRadius:24,borderWidth:1,padding:20,gap:12},modalTitle:{fontSize:21,fontFamily:'Inter_700Bold'},modalInfo:{fontSize:11,lineHeight:16},autoRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},autoLabel:{fontSize:13,fontFamily:'Inter_700Bold'},switch:{width:50,height:30,borderRadius:15,padding:3,justifyContent:'center'},thumb:{width:24,height:24,borderRadius:12},sliderLabel:{fontSize:12,fontFamily:'Inter_700Bold',marginTop:4},sliderRow:{flexDirection:'row',flexWrap:'wrap',gap:7},valueChip:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:7},valueText:{fontSize:10.5},done:{minHeight:50,borderRadius:15,alignItems:'center',justifyContent:'center',marginTop:3} });
