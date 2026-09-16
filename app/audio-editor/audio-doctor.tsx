import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';
import { useColors } from '@/hooks/useColors';
import { AudioEditorResultPanel } from '@/features/audio-editor/AudioEditorResultPanel';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import { DEFAULT_AUDIO_DOCTOR_SETTINGS, diagnoseAndRepairAudio, type AudioDoctorReport, type AudioDoctorSettings } from '@/features/audio-editor/audioDoctorEngine';
import type { AudioEditorSource } from '@/features/audio-editor/types';

const STAGES: Record<string, string> = {
  loading: 'Loading audio',
  analyzing: 'Detecting audio problems',
  'removing-noise': 'Removing noise',
  'fixing-hum': 'Removing hum',
  'fixing-clipping': 'Fixing clipping',
  'enhancing-voice': 'Enhancing voice clarity',
  'fixing-volume': 'Fixing volume',
  'mastering-sound': 'Mastering sound',
  saving: 'Saving repaired audio',
};

const LEVELS = [0.25, 0.5, 0.75, 1];

export default function AudioDoctorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [source, setSource] = useState<AudioEditorSource | null>(null);
  const [settings] = useState<AudioDoctorSettings>(DEFAULT_AUDIO_DOCTOR_SETTINGS);
  const [working, setWorking] = useState(false);
  const [stage, setStage] = useState<keyof typeof STAGES>('loading');
  const [message, setMessage] = useState('Choose an audio file to begin.');
  const [report, setReport] = useState<AudioDoctorReport | null>(null);

  const choose = useCallback(async () => {
    const picked = await pickAudioFromFileManager();
    if (!picked) return;
    setSource(picked);
    setReport(null);
    setMessage(`${picked.name} selected. Ready for one-step diagnosis and repair.`);
  }, []);

  const repair = useCallback(async () => {
    if (!source || working) return;
    setWorking(true);
    setReport(null);
    setStage('loading');
    try {
      const outputPath = await createAudioEditorOutputPath('Audio Doctor', source.name, 'repaired', 'm4a');
      const result = await diagnoseAndRepairAudio(source.uri, outputPath, settings, setStage);
      setReport(result);
      setMessage(result.repairable ? 'Analysis and repair completed successfully.' : 'Analysis completed. A best-effort repaired copy was created; some damage may remain.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Audio Doctor could not process this file.');
    } finally {
      setWorking(false);
    }
  }, [settings, source, working]);

  const reset = useCallback(() => {
    setSource(null);
    setReport(null);
    setMessage('Choose an audio file to begin.');
  }, []);

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 34 }}>
      <Stack.Screen options={{ title: 'Audio Doctor' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="activity" size={24} color={colors.primary} /></View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Audio Doctor</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Select audio once, then diagnose and repair it automatically in one step.</Text>
        </View>
      </View>

      {!source && !report && (
        <View style={[styles.sourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Audio source</Text>
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>After selection, this source stage disappears and only Audio Doctor controls remain.</Text>
          <Pressable onPress={choose} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
            <Feather name="folder" size={19} color={colors.primaryForeground} />
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Choose Audio</Text>
          </Pressable>
        </View>
      )}

      {source && !report && (
        <View style={[styles.editorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sourceHeader}>
            <View style={[styles.sourceIcon, { backgroundColor: colors.secondary }]}><Feather name="music" size={19} color={colors.primary} /></View>
            <View style={styles.sourceCopy}>
              <Text style={[styles.sourceTitle, { color: colors.foreground }]} numberOfLines={2}>{source.name}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>Automatic repair profile enabled</Text>
            </View>
          </View>

          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Automatic repair</Text>
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>Audio Doctor will automatically analyze the signal, remove detected noise/hum, reduce clipping, improve voice clarity, normalize safe volume, and master the repaired copy.</Text>

          <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="shield" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>The repair engine can only infer signal characteristics. It cannot reliably prove that a person intentionally damaged the recording.</Text>
          </View>

          <Pressable onPress={repair} disabled={working} accessibilityRole="button" accessibilityState={{ disabled: working }} style={[styles.primaryButton, { backgroundColor: working ? colors.muted : colors.primary }]}>
            {working ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="heart" size={19} color={colors.primaryForeground} />}
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{working ? 'Repairing & Analyzing…' : 'Repair & Analyze Audio'}</Text>
          </Pressable>
          <Pressable onPress={reset} disabled={working} accessibilityRole="button" accessibilityState={{ disabled: working }} style={[styles.secondaryButton, { borderColor: colors.border }]}>
            <Feather name="x" size={17} color={colors.foreground} />
            <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Choose Different Audio</Text>
          </Pressable>
        </View>
      )}

      {working && (
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.primary} />
          <Text accessibilityRole="header" style={[styles.progressTitle, { color: colors.foreground }]}>{STAGES[stage]}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>Audio Doctor is processing this file automatically.</Text>
        </View>
      )}

      {report && (
        <View>
          <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text accessibilityRole="header" style={[styles.reportTitle, { color: colors.foreground }]}>Audio diagnosis</Text>
            <Text style={[styles.resultStatus, { color: report.repairable ? colors.primary : colors.destructive }]}>{report.repairable ? 'Repairable signal' : 'Severely damaged signal'}</Text>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>Estimated SNR: {report.estimatedSnrDb.toFixed(1)} dB • Noise floor: {report.noiseFloorDb.toFixed(1)} dB • Clipping: {(report.clippingRatio * 100).toFixed(2)}%</Text>
            {report.diagnosis.map((item, index) => <View key={`${item}-${index}`} style={styles.diagnosisRow}><Feather name="alert-circle" size={16} color={report.repairable ? colors.primary : colors.destructive} /><Text style={[styles.diagnosisText, { color: colors.foreground }]}>{item}</Text></View>)}
            <View style={[styles.factRow, { borderColor: colors.border }]}><Text style={[styles.factLabel, { color: colors.mutedForeground }]}>Repair actions</Text><Text style={[styles.factValue, { color: colors.foreground }]}>{[report.repairedNoise && 'noise', report.repairedHum && 'hum', report.repairedClipping && 'clipping'].filter(Boolean).join(', ') || 'clarity / gain only'}</Text></View>
            <View style={[styles.factRow, { borderColor: colors.border }]}><Text style={[styles.factLabel, { color: colors.mutedForeground }]}>Intentional damage</Text><Text style={[styles.factValue, { color: colors.foreground }]}>Cannot be determined from audio alone</Text></View>
          </View>
          <AudioEditorResultPanel message={report.repairable ? 'Audio repaired and saved successfully.' : 'Best-effort repaired copy saved; original damage may remain.'} outputPath={report.outputPath} resultUri={`file://${report.outputPath}`} onClose={reset} />
        </View>
      )}

      {!report && !!message && !working && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:{flex:1}, headerRow:{flexDirection:'row',alignItems:'center',marginBottom:20}, heroIcon:{width:54,height:54,borderRadius:16,alignItems:'center',justifyContent:'center'}, headerCopy:{flex:1,marginLeft:14}, title:{fontSize:27,fontFamily:'Inter_700Bold',marginBottom:5}, subtitle:{fontSize:11.5,lineHeight:17}, sourceCard:{borderWidth:1,borderRadius:18,padding:16,gap:10}, editorCard:{borderWidth:1,borderRadius:18,padding:16,gap:12}, sourceHeader:{flexDirection:'row',alignItems:'center'}, sourceIcon:{width:44,height:44,borderRadius:13,alignItems:'center',justifyContent:'center'}, sourceCopy:{flex:1,marginLeft:11}, sourceTitle:{fontSize:14,fontFamily:'Inter_700Bold'}, sectionTitle:{fontSize:15,fontFamily:'Inter_700Bold'}, helper:{fontSize:11,lineHeight:16}, meta:{fontSize:10.5,lineHeight:15}, primaryButton:{minHeight:52,borderRadius:16,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:9,paddingHorizontal:16}, buttonText:{fontSize:13,fontFamily:'Inter_700Bold'}, secondaryButton:{minHeight:48,borderRadius:14,borderWidth:1,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8}, secondaryButtonText:{fontSize:12.5,fontFamily:'Inter_700Bold'}, infoBox:{borderWidth:1,borderRadius:14,padding:12,flexDirection:'row',gap:10}, infoText:{flex:1,fontSize:10.5,lineHeight:15}, progressCard:{marginTop:12,borderWidth:1,borderRadius:18,padding:16,alignItems:'center',gap:8}, progressTitle:{fontSize:14,fontFamily:'Inter_700Bold'}, reportCard:{borderWidth:1,borderRadius:18,padding:16,gap:10}, reportTitle:{fontSize:18,fontFamily:'Inter_700Bold'}, resultStatus:{fontSize:13,fontFamily:'Inter_700Bold'}, diagnosisRow:{flexDirection:'row',gap:8,alignItems:'flex-start'}, diagnosisText:{flex:1,fontSize:11.5,lineHeight:17}, factRow:{borderTopWidth:1,paddingTop:10,marginTop:2}, factLabel:{fontSize:10.5}, factValue:{fontSize:11.5,fontFamily:'Inter_700Bold',marginTop:3}, message:{marginTop:12,fontSize:11,lineHeight:16},
});
