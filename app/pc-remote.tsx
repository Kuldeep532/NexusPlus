import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { loadPairedPcs, removePairedPc, type PairedPc } from '@/features/pc-remote/remoteStore';
import { PcRemoteController } from '@/features/pc-remote/pcRemoteController';

const controller = new PcRemoteController();

export default function PcRemoteScreen() {
  const colors = useColors();
  const [devices, setDevices] = useState<PairedPc[]>([]);
  const [selected, setSelected] = useState<PairedPc | null>(null);
  const [host, setHost] = useState('');
  const [port, setPort] = useState('8765');
  const [token, setToken] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    void loadPairedPcs().then(setDevices);
    controller.onConnectionChange(setConnected);
    return () => controller.disconnect();
  }, []);

  const status = useMemo(() => {
    if (!selected) return 'No PC selected';
    return connected ? `Connected to ${selected.displayName}` : `Ready: ${selected.displayName}`;
  }, [connected, selected]);

  async function pairByAddress(): Promise<void> {
    if (!host.trim() || !token.trim()) {
      Alert.alert('Pairing details required', 'Enter the PC address and the pairing token shown by the Nexus PC agent.');
      return;
    }
    const next: PairedPc = {
      deviceId: `manual-${host.trim()}-${port.trim()}`,
      displayName: `PC at ${host.trim()}`,
      os: 'windows',
      host: host.trim(),
      port: Number(port) || 8765,
      token: token.trim(),
      pairedAt: Date.now(),
    };
    const nextDevices = [...devices.filter((d) => d.deviceId !== next.deviceId), next];
    const { savePairedPcs } = await import('@/features/pc-remote/remoteStore');
    await savePairedPcs(nextDevices);
    setDevices(nextDevices);
    setSelected(next);
    setToken('');
  }

  function connect(): void {
    if (!selected) return;
    controller.connect(selected);
  }

  function confirmSystemAction(action: 'lock' | 'shutdown'): void {
    const message = action === 'lock' ? 'Lock the paired PC now?' : 'Shut down the paired PC after 30 seconds?';
    Alert.alert(action === 'lock' ? 'Lock PC' : 'Shutdown PC', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action === 'lock' ? 'Lock' : 'Shutdown',
        style: action === 'shutdown' ? 'destructive' : 'default',
        onPress: () => {
          try {
            if (action === 'lock') controller.lock();
            else controller.shutdown(30);
          } catch {
            Alert.alert('Not connected', 'Connect to the PC before sending this command.');
          }
        },
      },
    ]);
  }

  function sendDemoClick(): void {
    try {
      controller.click('left');
    } catch {
      Alert.alert('Not connected', 'Connect to the PC before using remote controls.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>PC Remote Control</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>Control an authorized Windows or Ubuntu computer over your local network.</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Add / pair PC</Text>
        <TextInput accessibilityLabel="PC address" placeholder="192.168.1.20" placeholderTextColor={colors.muted} value={host} onChangeText={setHost} style={[styles.input, { color: colors.text, borderColor: colors.border }]} autoCapitalize="none" />
        <TextInput accessibilityLabel="WebSocket port" placeholder="8765" placeholderTextColor={colors.muted} value={port} onChangeText={setPort} keyboardType="number-pad" style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
        <TextInput accessibilityLabel="Pairing token" placeholder="Pairing token" placeholderTextColor={colors.muted} value={token} onChangeText={setToken} style={[styles.input, { color: colors.text, borderColor: colors.border }]} autoCapitalize="none" secureTextEntry />
        <Pressable accessibilityRole="button" onPress={() => void pairByAddress()} style={styles.button}>
          <Text style={styles.buttonText}>Save paired PC</Text>
        </Pressable>
      </View>

      <Text style={[styles.status, { color: colors.text }]}>{status}</Text>
      {devices.map((device) => (
        <View key={device.deviceId} style={[styles.device, { borderColor: colors.border }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Select ${device.displayName}`} onPress={() => setSelected(device)} style={styles.deviceMain}>
            <Text style={[styles.deviceName, { color: colors.text }]}>{device.displayName}</Text>
            <Text style={{ color: colors.muted }}>{device.os.toUpperCase()} · {device.host}:{device.port}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => void removePairedPc(device.deviceId).then(() => setDevices((items) => items.filter((item) => item.deviceId !== device.deviceId)))}>
            <Text style={{ color: colors.danger }}>Remove</Text>
          </Pressable>
        </View>
      ))}

      <View style={styles.controls}>
        <Pressable accessibilityRole="button" onPress={connect} style={styles.button}><Text style={styles.buttonText}>Connect</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={sendDemoClick} style={styles.secondary}><Text style={[styles.secondaryText, { color: colors.text }]}>Left click</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => confirmSystemAction('lock')} style={styles.secondary}><Text style={[styles.secondaryText, { color: colors.text }]}>Lock PC</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => confirmSystemAction('shutdown')} style={styles.secondary}><Text style={[styles.secondaryText, { color: colors.text }]}>Shutdown</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 16, lineHeight: 23 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  cardTitle: { fontSize: 19, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16 },
  button: { borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center', backgroundColor: '#5B21B6' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondary: { borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1, borderColor: '#BDBDBD' },
  secondaryText: { fontSize: 16, fontWeight: '700' },
  status: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  device: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderWidth: 1, borderRadius: 12, padding: 13 },
  deviceMain: { flex: 1, gap: 3 },
  deviceName: { fontSize: 17, fontWeight: '700' },
  controls: { gap: 10, marginTop: 8 },
});
