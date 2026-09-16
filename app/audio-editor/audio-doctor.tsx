import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { AudioEditorResultPanel } from '@/features/audio-editor/AudioEditorResultPanel';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import { DEFAULT_AUDIO_DOCTOR_SETTINGS, diagnoseAndRepairAudio, type AudioDoctorReport, type AudioDoctorSettings } from '@/features/audio-editor/audioDoctorEngine';
import type { AudioEditorSource } from '@/features/audio-editor/types';

const LEVELS = [0.25, 0.5, 0.75, 1];

export default function AudioDoctorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [source, setSource] = useState<AudioEditorSource | null>(null);
  const [settings, setSettings] = useState<AudioDoctorSettings>(DEFAULT_AUDIO_DOCTOR_SETTINGS);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('Choose an audio file to begin.');
  const [report, setReport] = useState<AudioDoctorReport | null>(null);

  const choose = useCallback(async () => {
    const picked = await pickAudioFromFileManager();
    if (!picked) return;
    setSource(picked);
    setReport(null);
    setMessage('Audio selected. Audio Doctor is ready to diagnose and repair it.');
  }, []);

  const setLevel = (key: keyof AudioDoctorSettings, value: number) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const generate = useCallback(async () => {
    if (!source || working) return;
    setWorking(true);
    setReport(null);
    setMessage('Audio Doctor is analyzing noise, hum, clipping and possible damage…');
    try {
      const outputPath = await createAudioEditorOutputPath('Audio Doctor', source.name, 'repaired', 'm4a');
      const result = await diagnoseAndRepairAudio(source.uri, outputPath, settings);
      setReport(result);
      setMessage(result.repairable ? 'Diagnosis complete. A repaired audio file was generated and saved.' : 'Diagnosis complete. The source has damage that this repair pipeline cannot fully recover.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Audio Doctor could not process this file.');
    } finally {
      setWorking(false);
    }
  }, [settings, source, working]);

  const reset = useCallback(() => {
    setSource(null);
    setReport(null);
    setSettings(DEFAULT_AUDIO_DOCTOR_SETTINGS);
    setMessage('Choose an audio file to begin.');
  }, []);

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 34 }}>
      <Stack.Screen options={{ title: 'Audio Doctor' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="activity" size={24} color={colors.primary} /></View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Audio Doctor</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Diagnose common audio damage and apply real-time signal repairs before export.</Text>
        </View>
      </View>

      {!source && !report && (
        <View style={[styles.sourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Audio source</Text>
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>Select an audio file first. After selection, this source screen is hidden and only the Doctor controls remain.</Text>
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
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>Selected audio • Doctor analysis mode</Text>
            </View>
          </View>

          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Repair controls</Text>
          <LevelControl label="Noise reduction" value={settings.noiseReduction} onChange={(v) => setLevel('noiseReduction', v)} colors={colors} />
          <LevelControl label="Voice clarity" value={settings.voiceClarity} onChange={(v) => setLevel('voiceClarity', v)} colors={colors} />
          <LevelControl label="Hum removal" value={settings.humRemoval} onChange={(v) => setLevel('humRemoval', v)} colors={colors} />
          <LevelControl label="De-clip" value={settings.deClip} onChange={(v) => setLevel('deClip', v)} colors={colors} />

          <View style={[styles.autoRow, { borderColor: colors.border }]}>
            <View style={styles.autoCopy}>
              <Text style={[styles.autoTitle, { color: colors.foreground }]}>Automatic gain</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>Normalize a quiet repaired signal without exceeding the safe peak target.</Text>
            </View>
            <Switch value={settings.autoGain} onValueChange={(value) => setSettings((current) => ({ ...current, autoGain: value }))} accessibilityLabel="Automatic gain" />
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="info" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>Doctor checks the signal itself. It can report measurable clipping, hum, noise and probable codec damage, but it cannot prove who caused the damage or whether it was intentional.</Text>
          </View>

          <Pressable onPress={generate} disabled={working} accessibilityRole="button" accessibilityState={{ disabled: working }} style={[styles.primaryButton, { backgroundColor: working ? colors.muted : colors.primary }]}>
            {working ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="heart" size={19} color={colors.primaryForeground} />}
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{working ? 'Diagnosing & Repairing…' : 'Diagnose & Repair'}</Text>
          </Pressable>
          <Pressable onPress={reset} disabled={working} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.border }]}>
            <Feather name="x" size={17} color={colors.foreground} />
            <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Choose Different Audio</Text>
          </Pressable>
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

      {!report && !!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
    </ScrollView>
  );
}

function LevelControl({ label, value, onChange, colors }: { label: string; value: number; onChange: (value: number) => void; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.control}>
      <View style={styles.controlHeader}><Text style={[styles.controlLabel, { color: colors.foreground }]}>{label}</Text><Text style={[styles.controlValue, { color: colors.primary }]}>{Math.round(value * 100)}%</Text></View>
      <View style={styles.levelRow}>{LEVELS.map((level) => <Pressable key={level} onPress={() => onChange(level)} accessibilityRole="button" accessibilityState={{ selected: value === level }} style={[styles.level, { borderColor: value === level ? colors.primary : colors.border, backgroundColor: value === level ? colors.secondary : colors.background }]}><Text style={[styles.levelText, { color: colors.foreground }]}>{Math.round(level * 100)}%</Text></Pressable>)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:{flex:1}, headerRow:{flexDirection:'row',alignItems:'center',marginBottom:20}, heroIcon:{width:54,height:54,borderRadius:16,alignItems:'center',justifyContent:'center'}, headerCopy:{flex:1,marginLeft:14}, title:{fontSize:27,fontFamily:'Inter_700Bold',marginBottom:5}, subtitle:{fontSize:11.5,lineHeight:17}, sourceCard:{borderWidth:1,borderRadius:18,padding:16,gap:10}, editorCard:{borderWidth:1,borderRadius:18,padding:16,gap:12}, sourceHeader:{flexDirection:'row',alignItems:'center'}, sourceIcon:{width:44,height:44,borderRadius:13,alignItems:'center',justifyContent:'center'}, sourceCopy:{flex:1,marginLeft:11}, sourceTitle:{fontSize:14,fontFamily:'Inter_700Bold'}, sectionTitle:{fontSize:15,fontFamily:'Inter_700Bold'}, helper:{fontSize:11,lineHeight:16}, meta:{fontSize:10.5,lineHeight:15}, primaryButton:{minHeight:52,borderRadius:16,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:9,paddingHorizontal:16}, buttonText:{fontSize:13,fontFamily:'Inter_700Bold'}, secondaryButton:{minHeight:48,borderRadius:14,borderWidth:1,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8}, secondaryButtonText:{fontSize:12.5,fontFamily:'Inter_700Bold'}, control:{gap:8}, controlHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, controlLabel:{fontSize:12,fontFamily:'Inter_700Bold'}, controlValue:{fontSize:12,fontFamily:'Inter_700Bold'}, levelRow:{flexDirection:'row',gap:8}, level:{flex:1,minHeight:40,borderWidth:1,borderRadius:11,alignItems:'center',justifyContent:'center'}, levelText:{fontSize:10.5,fontFamily:'Inter_700Bold'}, autoRow:{borderWidth:1,borderRadius:14,padding:12,flexDirection:'row',alignItems:'center',gap:10}, autoCopy:{flex:1}, autoTitle:{fontSize:12.5,fontFamily:'Inter_700Bold'}, infoBox:{borderWidth:1,borderRadius:14,padding:12,flexDirection:'row',gap:10}, infoText:{flex:1,fontSize:10.5,lineHeight:15}, reportCard:{borderWidth:1,borderRadius:18,padding:16,gap:10}, reportTitle:{fontSize:18,fontFamily:'Inter_700Bold'}, resultStatus:{fontSize:13,fontFamily:'Inter_700Bold'}, diagnosisRow:{flexDirection:'row',gap:8,alignItems:'flex-start'}, diagnosisText:{flex:1,fontSize:11.5,lineHeight:17}, factRow:{borderTopWidth:1,paddingTop:10,marginTop:2}, factLabel:{fontSize:10.5}, factValue:{fontSize:11.5,fontFamily:'Inter_700Bold',marginTop:3}, message:{marginTop:12,fontSize:11,lineHeight:16},
});
