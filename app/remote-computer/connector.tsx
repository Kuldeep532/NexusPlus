import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { confirmDesktopPairing, pairWithDesktopAgent } from '@/src/remote-computer/remoteComputerTransport';

export default function RemoteComputerConnector() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [url, setUrl] = useState('ws://127.0.0.1:47821');
  const [pairing, setPairing] = useState<{ computerId: string; code: string; publicKey: string } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const connect = async () => {
    setBusy(true); setMessage('Connecting to desktop agent.');
    try {
      const result = await pairWithDesktopAgent(url.trim());
      setPairing(result);
      setMessage(`Pairing code received: ${result.code}`);
      AccessibilityInfo.announceForAccessibility(`Pairing code ${result.code}. Confirm it on your computer.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Connection failed.');
      AccessibilityInfo.announceForAccessibility('Connection failed.');
    } finally { setBusy(false); }
  };

  const confirm = async () => {
    if (!pairing || code.trim().length < 4) return;
    setBusy(true); setMessage('Confirming pairing.');
    try {
      await confirmDesktopPairing(url.trim(), code.trim(), pairing.publicKey);
      AccessibilityInfo.announceForAccessibility('Computer paired successfully.');
      router.replace({ pathname: '/remote-computer/control', params: { url: url.trim(), computerId: pairing.computerId } });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Pairing confirmation failed.');
      AccessibilityInfo.announceForAccessibility('Pairing confirmation failed.');
    } finally { setBusy(false); }
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><MaterialCommunityIcons name="arrow-left" size={25} color={colors.foreground} /><Text style={[styles.backText, { color: colors.foreground }]}>Back</Text></Pressable>
      <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="lan-connect" size={30} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Connect computer</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Enter the desktop agent address, then verify the pairing code shown on both devices.</Text></View></View>

      <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.foreground }]}>Desktop agent address</Text>
        <TextInput accessibilityLabel="Desktop agent WebSocket address" autoCapitalize="none" autoCorrect={false} value={url} onChangeText={setUrl} placeholder="ws://computer:47821" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.input, backgroundColor: colors.background }]} />
        <Pressable accessibilityRole="button" accessibilityLabel={busy ? 'Connecting' : 'Connect'} disabled={busy || !url.trim()} onPress={() => void connect()} style={[styles.primary, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}><MaterialCommunityIcons name="connection" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>{busy ? 'Working…' : 'Connect'}</Text></Pressable>
      </View>

      {pairing ? <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.foreground }]}>Verify pairing</Text>
        <Text style={[styles.helper, { color: colors.mutedForeground }]}>Ask the computer user interface to display its code. Enter the same code here.</Text>
        <View accessible accessibilityRole="text" accessibilityLabel={`Pairing code ${pairing.code}`} style={[styles.codeBox, { backgroundColor: colors.secondary }]}><Text style={[styles.code, { color: colors.secondaryForeground }]}>{pairing.code}</Text></View>
        <TextInput accessibilityLabel="Pairing confirmation code" keyboardType="number-pad" value={code} onChangeText={setCode} placeholder="Enter computer code" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.input, backgroundColor: colors.background }]} />
        <Pressable accessibilityRole="button" accessibilityLabel="Confirm pairing" disabled={busy || code.trim().length < 4} onPress={() => void confirm()} style={[styles.primary, { backgroundColor: colors.primary, opacity: busy || code.trim().length < 4 ? 0.5 : 1 }]}><MaterialCommunityIcons name="shield-check" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Confirm pairing</Text></Pressable>
      </View> : null}

      {message ? <View accessible accessibilityRole="text" style={[styles.message, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="information-outline" size={20} color={colors.primary} /><Text style={[styles.messageText, { color: colors.secondaryForeground }]}>{message}</Text></View> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 }, back: { marginHorizontal: 20, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }, backText: { fontSize: 14, fontWeight: '600' }, header: { paddingHorizontal: 20, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 14 }, icon: { width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, title: { fontSize: 27, fontWeight: '700' }, subtitle: { marginTop: 4, fontSize: 13, lineHeight: 19 }, panel: { margin: 20, marginTop: 24, borderRadius: 20, borderWidth: 1, padding: 17 }, label: { fontSize: 14, fontWeight: '700', marginBottom: 9 }, helper: { fontSize: 12, lineHeight: 18, marginBottom: 14 }, input: { minHeight: 50, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, fontSize: 14 }, primary: { minHeight: 50, marginTop: 14, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, primaryText: { fontSize: 14, fontWeight: '700' }, codeBox: { minHeight: 74, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, code: { fontSize: 32, fontWeight: '800', letterSpacing: 5 }, message: { marginHorizontal: 20, borderRadius: 15, padding: 14, flexDirection: 'row', gap: 9 }, messageText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
