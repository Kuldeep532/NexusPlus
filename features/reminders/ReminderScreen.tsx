import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { VOICE_CATALOG } from '@/features/voice-library/voiceCatalog';
import { getInstalledVoices, type InstalledVoice } from '@/features/voice-library/voiceStore';
import { cancelReminder, configureReminderNotifications, scheduleReminder } from './reminderScheduler';
import { speakReminder } from './reminderVoice';
import type { ReminderItem } from './reminderTypes';

const PRESETS = ['5', '15', '30', '60'];

export default function ReminderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [delayMinutes, setDelayMinutes] = useState('5');
  const [language, setLanguage] = useState<'en-US' | 'hi-IN'>('en-US');
  const [voiceId, setVoiceId] = useState<string | undefined>();
  const [installed, setInstalled] = useState<InstalledVoice[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');

  useEffect(() => {
    void configureReminderNotifications().catch(() => undefined);
    void getInstalledVoices().then(setInstalled).catch(() => undefined);
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as { type?: string; title?: string; body?: string; language?: string; voiceId?: string | null };
      if (data.type !== 'nexus-reminder') return;
      const spokenText = [data.title, data.body].filter(Boolean).join('. ');
      if (!spokenText) return;
      void speakReminder(spokenText, data.language || 'en-US', data.voiceId || undefined);
      AccessibilityInfo.announceForAccessibility(`Reminder: ${spokenText}`);
    });
    return () => subscription.remove();
  }, []);

  const matchingVoices = useMemo(
    () => installed.filter((voice) => voice.language.toLowerCase().startsWith(language.slice(0, 2).toLowerCase())),
    [installed, language],
  );

  const selectedVoice = matchingVoices.find((voice) => voice.id === voiceId);

  useEffect(() => {
    if (voiceId && !matchingVoices.some((voice) => voice.id === voiceId)) setVoiceId(undefined);
  }, [matchingVoices, voiceId]);

  const preview = async () => {
    const text = [title.trim(), body.trim()].filter(Boolean).join('. ') || (language === 'hi-IN' ? 'यह Nexus Plus रिमाइंडर है।' : 'This is your Nexus Plus reminder.');
    const result = await speakReminder(text, language, voiceId);
    setVoiceStatus(result.mode === 'piper' ? `Downloaded voice: ${result.voice?.name ?? 'selected voice'}` : 'System TTS fallback is active');
    AccessibilityInfo.announceForAccessibility(`Voice preview started. ${result.mode === 'piper' ? 'Downloaded high quality voice.' : 'System voice.'}`);
  };

  const addReminder = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const reminder = await scheduleReminder({ title, body, delayMinutes, language, voiceId });
      setReminders((current) => [reminder, ...current]);
      setTitle('');
      setBody('');
      setDelayMinutes('5');
      AccessibilityInfo.announceForAccessibility(`Reminder scheduled for ${reminder.scheduledAt}.`);
    } catch (error) {
      AccessibilityInfo.announceForAccessibility(error instanceof Error ? error.message : 'Reminder could not be scheduled.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (reminder: ReminderItem) => {
    await cancelReminder(reminder);
    setReminders((current) => current.filter((item) => item.id !== reminder.id));
    AccessibilityInfo.announceForAccessibility(`Reminder ${reminder.title} cancelled.`);
  };

  const voiceCatalogHint = VOICE_CATALOG.some((voice) => voice.language === language && voice.quality === 'high');

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={[styles.backButton, { borderColor: colors.border }]}><Feather name="arrow-left" size={20} color={colors.foreground} /></Pressable>
        <View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>My Reminders</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Accessible voice reminders with local notification delivery</Text></View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeading}><MaterialCommunityIcons name="bell-ring-outline" size={22} color={colors.primary} /><Text style={[styles.cardTitle, { color: colors.foreground }]}>Create reminder</Text></View>
        <TextInput accessibilityLabel="Reminder title" value={title} onChangeText={setTitle} placeholder="Reminder title" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
        <TextInput accessibilityLabel="Reminder message" value={body} onChangeText={setBody} placeholder="Message (optional)" placeholderTextColor={colors.mutedForeground} multiline style={[styles.input, styles.message, { color: colors.foreground, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.foreground }]}>Trigger delay in minutes</Text>
        <TextInput accessibilityLabel="Trigger delay in minutes" value={delayMinutes} onChangeText={(value) => setDelayMinutes(value.replace(/[^0-9]/g, ''))} keyboardType="number-pad" style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
        <View style={styles.chipRow}>{PRESETS.map((preset) => <Pressable key={preset} accessibilityRole="radio" accessibilityState={{ selected: delayMinutes === preset }} accessibilityLabel={`${preset} minute delay`} onPress={() => setDelayMinutes(preset)} style={[styles.chip, { borderColor: colors.border, backgroundColor: delayMinutes === preset ? colors.primary : colors.background }]}><Text style={{ color: delayMinutes === preset ? colors.primaryForeground : colors.foreground }}>{preset} min</Text></Pressable>)}</View>

        <Text style={[styles.label, { color: colors.foreground }]}>Reminder language</Text>
        <View style={styles.chipRow}>{(['en-US', 'hi-IN'] as const).map((item) => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: language === item }} accessibilityLabel={item === 'hi-IN' ? 'Hindi voice' : 'English voice'} onPress={() => setLanguage(item)} style={[styles.chip, { borderColor: colors.border, backgroundColor: language === item ? colors.primary : colors.background }]}><Text style={{ color: language === item ? colors.primaryForeground : colors.foreground }}>{item === 'hi-IN' ? 'Hindi' : 'English'}</Text></Pressable>)}</View>

        <Text style={[styles.label, { color: colors.foreground }]}>Downloaded voice</Text>
        {matchingVoices.length === 0 ? <Text style={[styles.helper, { color: colors.mutedForeground }]}>{voiceCatalogHint ? 'No voice is downloaded yet. Download one from Voices to use high-quality local speech.' : 'No downloaded voice matches this language. System TTS will be used.'}</Text> : <View style={styles.voiceList}>{matchingVoices.map((voice) => <Pressable key={voice.id} accessibilityRole="radio" accessibilityState={{ selected: voiceId === voice.id }} accessibilityLabel={`${voice.name}, downloaded, high quality`} onPress={() => setVoiceId(voice.id)} style={[styles.voiceOption, { borderColor: colors.border, backgroundColor: voiceId === voice.id ? colors.secondary : colors.background }]}><View style={styles.voiceCopy}><Text style={[styles.voiceName, { color: colors.foreground }]}>{voice.name}</Text><Text style={[styles.voiceMeta, { color: colors.mutedForeground }]}>{voice.languageName} · {voice.quality} quality · downloaded</Text></View><Feather name={voiceId === voice.id ? 'check-circle' : 'circle'} size={20} color={voiceId === voice.id ? colors.primary : colors.mutedForeground} /></Pressable>)}</View>}

        <Pressable accessibilityRole="button" accessibilityLabel="Preview reminder voice" onPress={() => void preview()} style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="volume-2" size={17} color={colors.foreground} /><Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold' }}>Preview voice</Text></Pressable>
        {!!voiceStatus && <Text accessibilityRole="status" style={[styles.status, { color: colors.primary }]}>{voiceStatus}</Text>}
        <Pressable accessibilityRole="button" accessibilityLabel="Schedule reminder" accessibilityState={{ busy }} disabled={busy} onPress={() => void addReminder()} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: busy ? 0.55 : 1 }]}><Feather name="bell" size={18} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>{busy ? 'Scheduling…' : 'Schedule reminder'}</Text></Pressable>
      </View>

      <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active reminders</Text>{reminders.length === 0 ? <Text style={[styles.empty, { color: colors.mutedForeground }]}>No active reminders.</Text> : reminders.map((reminder) => <View key={reminder.id} style={[styles.reminderRow, { backgroundColor: colors.card, borderColor: colors.border }]} accessible accessibilityRole="text" accessibilityLabel={`${reminder.title}. ${reminder.body}. Fires at ${reminder.scheduledAt}.`}><View style={styles.reminderCopy}><Text style={[styles.reminderTitle, { color: colors.foreground }]}>{reminder.title}</Text>{!!reminder.body && <Text style={[styles.reminderBody, { color: colors.mutedForeground }]}>{reminder.body}</Text>}<Text style={[styles.reminderMeta, { color: colors.primary }]}>{reminder.scheduledAt} · {reminder.voiceId ? 'Downloaded voice' : 'System TTS fallback'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Cancel ${reminder.title}`} onPress={() => void remove(reminder)}><Feather name="x-circle" size={21} color={colors.mutedForeground} /></Pressable></View>)}</View>

      <View style={[styles.note, { backgroundColor: colors.secondary, borderColor: colors.border }]} accessible accessibilityRole="text" accessibilityLabel="Voice delivery note. Downloaded ONNX voices are selected when the native Piper bridge is available. System TTS is the reliable fallback. Background spoken delivery will be completed in the next native runtime stage; local notification delivery is already scheduled in this stage."><Feather name="info" size={17} color={colors.primary} /><Text style={[styles.noteText, { color: colors.foreground }]}>Downloaded ONNX voices are preferred when Piper is available; system TTS is the fallback.</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 16 }, backButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold' }, subtitle: { marginTop: 3, fontSize: 12, lineHeight: 17 }, card: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 }, cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 3 }, cardTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' }, input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 14, fontFamily: 'Inter_400Regular' }, message: { minHeight: 82, textAlignVertical: 'top', paddingTop: 12 }, label: { fontSize: 12, fontFamily: 'Inter_700Bold', marginTop: 3 }, chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, chip: { minHeight: 40, borderRadius: 20, borderWidth: 1, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' }, helper: { fontSize: 11, lineHeight: 16 }, voiceList: { gap: 7 }, voiceOption: { minHeight: 60, borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' }, voiceCopy: { flex: 1 }, voiceName: { fontSize: 13, fontFamily: 'Inter_700Bold' }, voiceMeta: { marginTop: 3, fontSize: 10 }, secondaryButton: { minHeight: 46, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 3 }, primaryButton: { minHeight: 48, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 3 }, primaryText: { fontFamily: 'Inter_700Bold' }, status: { fontSize: 11, fontFamily: 'Inter_600SemiBold' }, section: { marginTop: 26, paddingHorizontal: 20, gap: 9 }, sectionTitle: { fontSize: 19, fontFamily: 'Inter_700Bold' }, empty: { fontSize: 12, paddingVertical: 18 }, reminderRow: { minHeight: 76, borderRadius: 15, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center' }, reminderCopy: { flex: 1, paddingRight: 10 }, reminderTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' }, reminderBody: { marginTop: 3, fontSize: 11, lineHeight: 16 }, reminderMeta: { marginTop: 5, fontSize: 10, fontFamily: 'Inter_600SemiBold' }, note: { margin: 20, borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: 'row', gap: 9, alignItems: 'flex-start' }, noteText: { flex: 1, fontSize: 11, lineHeight: 16 },});
