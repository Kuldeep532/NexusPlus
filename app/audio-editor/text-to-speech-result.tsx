import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useColors } from '@/hooks/useColors';
import { generateWithNexusTts, playGeneratedAudio, type TtsSettings } from '@/features/audio-editor/ttsEngine';
import { getInstalledVoices } from '@/features/voice-library/voiceStore';

export default function TextToSpeechResultScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ text?: string; voiceId?: string; voiceName?: string; language?: string; provider?: string; speed?: string; pitch?: string; emotion?: string }>();
  const [audioUri, setAudioUri] = useState('');
  const [playing, setPlaying] = useState(false);
  const [stop, setStop] = useState<(() => void) | null>(null);
  const [message, setMessage] = useState('Generating local speech…');

  const generate = async () => {
    const text = params.text ?? '';
    if (!text || (params.provider !== 'piper' && params.provider !== 'clone')) {
      setMessage('A local Piper or clone voice is required for this result.');
      return;
    }
    try {
      const installed = await getInstalledVoices();
      const voice = installed.find((item) => item.id === params.voiceId);
      if (!voice) throw new Error('The selected voice is no longer installed on this device.');
      const result = await generateWithNexusTts(text, { provider: params.provider as 'piper' | 'clone', id: voice.id, name: voice.name, language: voice.language, installed: true, modelPath: voice.modelPath, configPath: voice.configPath }, { autoTune: true, speed: Number(params.speed) || 1, pitch: Number(params.pitch) || 1 } as TtsSettings);
      setAudioUri(result.outputUri);
      setMessage(`Generated with ${result.provider}. Detected ${result.analysis.emotion}; speed ${result.analysis.speed.toFixed(2)}×, pitch ${result.analysis.pitch.toFixed(2)}×.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to generate local speech.');
    }
  };

  useEffect(() => { void generate(); return () => { stop?.(); }; }, []);

  const play = async () => {
    if (!audioUri) return;
    stop?.();
    setPlaying(true);
    try {
      const cleanup = await playGeneratedAudio(audioUri);
      setStop(() => cleanup);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to play generated audio.');
      setPlaying(false);
    }
  };

  const save = async () => {
    if (!audioUri) { setMessage('Generate speech before saving.'); return; }
    try {
      setMessage(`Saved locally at ${audioUri}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save audio.'); }
  };

  const share = async () => {
    if (!audioUri) { setMessage('Generate speech before sharing.'); return; }
    try {
      if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
      await Sharing.shareAsync(audioUri, { mimeType: 'audio/wav', dialogTitle: 'Share Nexus Plus speech' });
    } catch (error) { Alert.alert('Share unavailable', error instanceof Error ? error.message : 'Unable to share generated audio.'); }
  };

  const regenerate = () => { stop?.(); setStop(null); setPlaying(false); setAudioUri(''); setMessage('Regenerating local speech…'); void generate(); };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ title: 'Generated Speech' }} />
      <View style={styles.content}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name={audioUri ? 'check-circle' : 'volume-2'} size={28} color={colors.primary} /></View>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Generated Speech</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>{params.voiceName || params.voiceId}{params.language ? ` • ${params.language}` : ''}</Text>
        <View style={[styles.textCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.text, { color: colors.foreground }]}>{params.text || ''}</Text></View>
        <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
        <View style={styles.actions}>
          <Pressable disabled={!audioUri} onPress={play} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: audioUri ? colors.primary : colors.muted }]}><Feather name={playing ? 'volume-2' : 'play'} size={18} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{playing ? 'Playing' : 'Play'}</Text></Pressable>
          <Pressable disabled={!audioUri} onPress={save} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="save" size={18} color={colors.foreground} /><Text style={[styles.buttonText, { color: colors.foreground }]}>Save</Text></Pressable>
          <Pressable disabled={!audioUri} onPress={share} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="share-2" size={18} color={colors.foreground} /><Text style={[styles.buttonText, { color: colors.foreground }]}>Share</Text></Pressable>
          <Pressable onPress={regenerate} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="refresh-cw" size={18} color={colors.foreground} /><Text style={[styles.buttonText, { color: colors.foreground }]}>Regenerate</Text></Pressable>
        </View>
        <Pressable onPress={() => { stop?.(); router.back(); }} accessibilityRole="button" style={[styles.backButton, { borderColor: colors.border }]}><Feather name="arrow-left" size={18} color={colors.foreground} /><Text style={[styles.buttonText, { color: colors.foreground }]}>Back</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ root:{flex:1}, content:{flex:1,padding:20,justifyContent:'center'}, heroIcon:{width:62,height:62,borderRadius:18,alignItems:'center',justifyContent:'center',alignSelf:'center'}, title:{fontSize:24,fontFamily:'Inter_700Bold',textAlign:'center',marginTop:16}, meta:{fontSize:11,textAlign:'center',marginTop:5}, textCard:{borderWidth:1,borderRadius:18,padding:16,marginTop:22,maxHeight:250}, text:{fontSize:15,lineHeight:23}, message:{fontSize:11,lineHeight:16,textAlign:'center',marginTop:12}, actions:{gap:10,marginTop:18}, primaryButton:{minHeight:52,borderRadius:16,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:9}, secondaryButton:{minHeight:52,borderRadius:16,borderWidth:1,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:9}, backButton:{minHeight:50,borderRadius:15,borderWidth:1,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:9,marginTop:10}, buttonText:{fontSize:13,fontFamily:'Inter_700Bold'} });
