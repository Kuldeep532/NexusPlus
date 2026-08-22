import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { AccessibilityInfo, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getProtectedComputer, isRemoteComputerProtectionConfigured, isRemoteComputerSessionUnlocked, setRemoteComputerSessionUnlocked } from '@/src/remote-computer/remoteComputerProtection';
import { requestRemoteUnlock, sendRemoteCommand } from '@/src/remote-computer/remoteComputerTransport';
import { getRemoteAgentRelease, type RemoteAgentRelease } from '@/src/content/contentRepository';
import type { RemoteComputerCommand } from '@/src/remote-computer/remoteComputerTypes';

const platforms: RemoteAgentRelease['platform'][] = ['windows', 'macos', 'ubuntu'];

export default function RemoteComputerControl() {
  const colors = useColors(); const insets = useSafeAreaInsets(); const params = useLocalSearchParams<{ url?: string; computerId?: string }>();
  const [stored, setStored] = useState<{ computerId: string; computerName: string; agentUrl: string } | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false); const [busy, setBusy] = useState(false); const [status, setStatus] = useState('Ready');
  const [releases, setReleases] = useState<Partial<Record<RemoteAgentRelease['platform'], RemoteAgentRelease>>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      const configured = await isRemoteComputerProtectionConfigured();
      const computer = await getProtectedComputer();
      if (!configured || !computer || !isRemoteComputerSessionUnlocked()) { router.replace('/remote-computer/protection'); return; }
      if (active) setStored(computer);
      const entries = await Promise.all(platforms.map(async (platform) => [platform, await getRemoteAgentRelease(platform)] as const));
      if (active) setReleases(Object.fromEntries(entries.filter(([, release]) => release)) as Partial<Record<RemoteAgentRelease['platform'], RemoteAgentRelease>>);
    })();
    return () => { active = false; };
  }, []);

  const url = String(params.url || stored?.agentUrl || ''); const computerId = String(params.computerId || stored?.computerId || '');
  const connected = useMemo(() => Boolean(url && computerId && stored), [url, computerId, stored]);

  const protectedAction = async (command: RemoteComputerCommand, label: string) => {
    if (!isRemoteComputerSessionUnlocked()) { setRemoteComputerSessionUnlocked(false); router.replace('/remote-computer/protection'); return; }
    if (!connected) { setStatus('Connect a computer first.'); AccessibilityInfo.announceForAccessibility('Connect a computer first.'); return; }
    setBusy(true); setStatus(`${label}…`);
    try { const result = await sendRemoteCommand(url, { computerId, command, source: voiceEnabled ? 'voice' : 'touch' }); const next = result.ok ? `${label} completed.` : `${label} was denied.`; setStatus(next); AccessibilityInfo.announceForAccessibility(next); }
    catch (error) { const next = error instanceof Error ? error.message : `${label} failed.`; setStatus(next); AccessibilityInfo.announceForAccessibility(next); }
    finally { setBusy(false); }
  };

  const unlock = async () => {
    if (!connected) return;
    setBusy(true); setStatus('Waiting for phone biometric authentication.');
    try { const result = await requestRemoteUnlock(url, computerId); const next = result.ok ? 'Computer unlock request accepted.' : 'Computer refused the unlock request.'; setStatus(next); AccessibilityInfo.announceForAccessibility(next); }
    catch (error) { const next = error instanceof Error ? error.message : 'Unlock failed.'; setStatus(next); AccessibilityInfo.announceForAccessibility(next); }
    finally { setBusy(false); }
  };
  const toggleVoice = (enabled: boolean) => { setVoiceEnabled(enabled); const message = enabled ? 'Voice input on.' : 'Voice input off.'; AccessibilityInfo.announceForAccessibility(message); setStatus(message); };
  const openRelease = async (release: RemoteAgentRelease) => { if (!/^https:\/\//i.test(release.download_url)) return; await Linking.openURL(release.download_url); };

  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 45 }}>
    <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><MaterialCommunityIcons name="arrow-left" size={25} color={colors.foreground} /><Text style={[styles.backText, { color: colors.foreground }]}>Back</Text></Pressable>
    <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="remote-desktop" size={30} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Control computer</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{stored?.computerName || 'Protected computer'}</Text></View></View>
    <View accessible accessibilityRole="text" style={[styles.status, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.dot, { backgroundColor: connected ? colors.primary : colors.mutedForeground }]} /><View style={styles.copy}><Text style={[styles.statusTitle, { color: colors.foreground }]}>{connected ? 'Secure connection ready' : 'Connecting to protected computer'}</Text><Text style={[styles.statusDetail, { color: colors.mutedForeground }]}>{status}</Text></View></View>
    <View style={[styles.voiceCard, { backgroundColor: voiceEnabled ? colors.secondary : colors.card, borderColor: colors.border }]}><View style={[styles.voiceIcon, { backgroundColor: colors.background }]}><MaterialCommunityIcons name={voiceEnabled ? 'microphone' : 'microphone-off'} size={26} color={voiceEnabled ? colors.primary : colors.mutedForeground} /></View><View style={styles.copy}><Text style={[styles.voiceTitle, { color: colors.foreground }]}>Voice input</Text><Text style={[styles.voiceDetail, { color: colors.mutedForeground }]}>{voiceEnabled ? 'On — voice commands can be sent to the computer.' : 'Off — use touch controls only.'}</Text></View><Switch accessibilityRole="switch" accessibilityLabel="Voice input" accessibilityState={{ checked: voiceEnabled }} value={voiceEnabled} onValueChange={toggleVoice} trackColor={{ false: colors.muted, true: colors.primary }} thumbColor={voiceEnabled ? colors.primaryForeground : colors.mutedForeground} /></View>
    <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick controls</Text><View style={styles.grid}>
      <ActionButton colors={colors} icon="volume-high" label="Read current" disabled={busy} onPress={() => void protectedAction({ type: 'screen-reader', action: 'read-current' }, 'Read current')} />
      <ActionButton colors={colors} icon="arrow-down" label="Next item" disabled={busy} onPress={() => void protectedAction({ type: 'screen-reader', action: 'next' }, 'Next item')} />
      <ActionButton colors={colors} icon="arrow-up" label="Previous item" disabled={busy} onPress={() => void protectedAction({ type: 'screen-reader', action: 'previous' }, 'Previous item')} />
      <ActionButton colors={colors} icon="pause" label="Pause reader" disabled={busy} onPress={() => void protectedAction({ type: 'screen-reader', action: 'pause' }, 'Pause reader')} />
      <ActionButton colors={colors} icon="keyboard" label="Press Enter" disabled={busy} onPress={() => void protectedAction({ type: 'keyboard', action: 'press', key: 'ENTER' }, 'Press Enter')} />
      <ActionButton colors={colors} icon="lock" label="Lock computer" disabled={busy} onPress={() => void protectedAction({ type: 'system', action: 'lock' }, 'Lock computer')} />
    </View></View>
    <View style={[styles.downloadCard, { backgroundColor: colors.card, borderColor: colors.border }]} accessible accessibilityRole="summary"><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Desktop agent</Text><Text style={[styles.downloadNote, { color: colors.mutedForeground }]}>Download only the signed agent for your computer. Links are read from Supabase and are never accepted from the remote computer.</Text>{platforms.map((platform) => { const release = releases[platform]; const label = `${platform === 'macos' ? 'macOS' : platform === 'ubuntu' ? 'Ubuntu' : 'Windows'}${release ? ` ${release.version}` : ''}`; return <Pressable key={platform} accessibilityRole="button" accessibilityLabel={`Download ${label} agent`} disabled={!release} onPress={() => release && void openRelease(release)} style={[styles.downloadButton, { borderColor: colors.border, opacity: release ? 1 : 0.5 }]}><MaterialCommunityIcons name="download" size={21} color={colors.primary} /><Text style={[styles.downloadText, { color: colors.foreground }]}>{release ? `Download ${label}` : `${label} — not published`}</Text></Pressable>; })}<Text style={[styles.downloadNote, { color: colors.mutedForeground }]}>This phone never stores or downloads private signing keys. Release integrity must be verified by the desktop installer.</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Unlock computer with phone biometric" disabled={busy || !connected} onPress={() => void unlock()} style={[styles.unlock, { backgroundColor: colors.primary, opacity: busy || !connected ? 0.5 : 1 }]}><MaterialCommunityIcons name="fingerprint" size={22} color={colors.primaryForeground} /><Text style={[styles.unlockText, { color: colors.primaryForeground }]}>{busy ? 'Working…' : 'Unlock with phone biometric'}</Text></Pressable>
    <Text style={[styles.note, { color: colors.mutedForeground }]}>The Protection Password unlocks this app session. The phone biometric separately authorizes protected commands. Android is the controller; the desktop agent remains the OS-side security boundary.</Text>
  </ScrollView>;
}

function ActionButton({ colors, icon, label, disabled, onPress }: { colors: any; icon: string; label: string; disabled: boolean; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border, opacity: disabled ? 0.5 : 1 }]}><View style={[styles.actionIcon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name={icon as never} size={22} color={colors.primary} /></View><Text style={[styles.actionText, { color: colors.foreground }]}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({ screen: { flex: 1 }, back: { marginHorizontal: 20, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }, backText: { fontSize: 14, fontWeight: '600' }, header: { paddingHorizontal: 20, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 14 }, icon: { width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, title: { fontSize: 27, fontWeight: '700' }, subtitle: { marginTop: 4, fontSize: 12, lineHeight: 18 }, status: { margin: 20, marginTop: 24, borderRadius: 18, borderWidth: 1, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }, dot: { width: 11, height: 11, borderRadius: 6 }, statusTitle: { fontSize: 14, fontWeight: '700' }, statusDetail: { marginTop: 3, fontSize: 12, lineHeight: 17 }, voiceCard: { marginHorizontal: 20, borderRadius: 19, borderWidth: 1, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }, voiceIcon: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, voiceTitle: { fontSize: 15, fontWeight: '700' }, voiceDetail: { marginTop: 3, fontSize: 11, lineHeight: 16 }, section: { marginTop: 28, paddingHorizontal: 20 }, sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, action: { width: '48%', minHeight: 105, borderRadius: 17, borderWidth: 1, padding: 12, justifyContent: 'center', alignItems: 'center', gap: 8 }, actionIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, actionText: { fontSize: 12, fontWeight: '700', textAlign: 'center' }, downloadCard: { margin: 20, marginTop: 28, borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 }, downloadButton: { minHeight: 50, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 }, downloadText: { flex: 1, fontSize: 13, fontWeight: '700' }, downloadNote: { fontSize: 11, lineHeight: 16 }, unlock: { marginHorizontal: 20, minHeight: 54, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, unlockText: { fontSize: 14, fontWeight: '800' }, note: { margin: 24, marginTop: 12, fontSize: 11, lineHeight: 17, textAlign: 'center' } });
