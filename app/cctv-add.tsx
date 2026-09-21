import { Stack } from 'expo-router';
import { useState } from 'react';
import { discoverCctvCameras } from '@/features/cctv/cctvDiscovery';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { verifyAndSaveCctvCamera } from '@/features/cctv/cctvController';
import type { CctvCameraRecord } from '@/features/cctv/cctvBackend';

/** Stage 3 security gate: discovery/enrollment UI never persists a camera without a verified endpoint. */
export default function CctvAddScreen() {
  const colors = useColors();
  const [host, setHost] = useState('');
  const [port, setPort] = useState('443');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('CCTV Camera');
  const [busy, setBusy] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discovered, setDiscovered] = useState<CctvCameraRecord[]>([]);

  const discover = async () => {
    setDiscovering(true);
    try {
      const result = await discoverCctvCameras({ source: 'lan', timeoutMs: 7000 });
      setDiscovered(result.cameras);
      if (!result.cameras.length) Alert.alert('No compatible camera found', 'No secure ONVIF HTTPS camera was discovered on the current local network. You can still enter a verified endpoint manually.');
    } catch (error) { Alert.alert('Discovery failed', error instanceof Error ? error.message : 'Secure camera discovery failed.'); }
    finally { setDiscovering(false); }
  };

  const selectCamera = (camera: CctvCameraRecord) => {
    setHost(camera.host ?? '');
    setPort(String(camera.port ?? 443));
    setSerialNumber(camera.serialNumber ?? '');
    setManufacturer(camera.manufacturer ?? '');
    setModel(camera.model ?? '');
    setName(camera.name);
  };

  const verify = async () => {
    const normalizedHost = host.trim();
    const normalizedSerial = serialNumber.trim();
    const normalizedManufacturer = manufacturer.trim();
    const normalizedModel = model.trim();
    const normalizedUsername = username.trim();
    const numericPort = Number(port.trim());
    if (!normalizedHost || !Number.isInteger(numericPort) || numericPort < 1 || numericPort > 65535) return Alert.alert('Secure endpoint required', 'Enter a valid local HTTPS camera endpoint.');
    if (!normalizedUsername || !password) return Alert.alert('Camera credentials required', 'Enter the camera username and password.');
    if (!normalizedSerial && (!normalizedManufacturer || !normalizedModel)) return Alert.alert('Camera identity required', 'Provide the camera serial number, or both manufacturer and model.');
    setBusy(true);
    try {
      const candidate: CctvCameraRecord = {
        id: `onboarding_${Date.now()}`,
        name: name.trim() || 'CCTV Camera',
        serialNumber: normalizedSerial || undefined,
        manufacturer: normalizedManufacturer || undefined,
        model: normalizedModel || undefined,
        protocol: 'onvif',
        deviceKind: 'ip_camera',
        host: normalizedHost,
        port: numericPort,
        username: normalizedUsername,
        passwordRef: `onboarding_${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),        capabilities: { liveView: false, recordings: false, playback: false, panTiltZoom: false },
        securityProfile: { secureTransport: true, authenticated: false, protocolFamily: 'onvif', securityLevel: 'detected', reason: 'Awaiting native authenticated verification.' },
        connectionState: 'idle',
        schemaVersion: 3,
      };
      await verifyAndSaveCctvCamera({ camera: candidate, username: normalizedUsername, password, authorizedIdentity: candidate });
      Alert.alert('Camera verified', 'The camera passed native authenticated verification and was saved securely.');
    } catch (error) {
      Alert.alert('Camera not saved', error instanceof Error ? error.message : 'Secure camera verification failed.');
    } finally {
      setPassword('');
      setBusy(false);
    }
  };

  return <View style={[styles.root, { backgroundColor: colors.background }]}><Stack.Screen options={{ title: 'Secure CCTV Setup' }} /><View style={styles.content}><Text style={[styles.title, { color: colors.foreground }]}>Secure CCTV Setup</Text><Text style={[styles.text, { color: colors.mutedForeground }]}>A camera is saved only after HTTPS transport, credentials, and native ONVIF device identity are verified. Network details are used internally and are not echoed after verification.</Text><Pressable accessibilityRole="button" accessibilityLabel="Discover ONVIF cameras on local network" disabled={discovering || busy} onPress={() => void discover()} style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.card, opacity: discovering ? 0.6 : 1 }]}><Text style={[styles.secondaryText, { color: colors.foreground }]}>{discovering ? 'Discovering secure ONVIF cameras…' : 'Discover Cameras on Local Network'}</Text></Pressable>{discovered.length > 0 && <View style={styles.discoveryList}>{discovered.map((camera) => <Pressable key={camera.id} accessibilityRole="button" accessibilityLabel={`Use discovered camera ${camera.name}`} onPress={() => selectCamera(camera)} style={[styles.discoveryCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.discoveryTitle, { color: colors.foreground }]}>{camera.name}</Text><Text style={[styles.discoveryMeta, { color: colors.mutedForeground }]}>{camera.manufacturer ?? 'ONVIF'}{camera.model ? ` · ${camera.model}` : ''}{camera.port ? ` · HTTPS ${camera.port}` : ''}</Text></Pressable>)}</View>} /><Field label="Camera name" value={name} onChangeText={setName} colors={colors} /><Field label="Camera host" value={host} onChangeText={setHost} colors={colors} autoCapitalize="none" /><Field label="HTTPS port" value={port} onChangeText={setPort} colors={colors} keyboardType="number-pad" autoCapitalize="none" /><Field label="Serial number" value={serialNumber} onChangeText={setSerialNumber} colors={colors} autoCapitalize="none" /><Field label="Manufacturer" value={manufacturer} onChangeText={setManufacturer} colors={colors} autoCapitalize="none" /><Field label="Model" value={model} onChangeText={setModel} colors={colors} autoCapitalize="none" /><Field label="Username" value={username} onChangeText={setUsername} colors={colors} autoCapitalize="none" /><Field label="Password" value={password} onChangeText={setPassword} colors={colors} autoCapitalize="none" secureTextEntry /><Pressable accessibilityRole="button" accessibilityLabel="Verify and save CCTV camera securely" disabled={busy} onPress={() => void verify()} style={[styles.button, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{busy ? 'Verifying…' : 'Verify & Save Camera'}</Text></Pressable></View></View>;
}
function Field({ label, value, onChangeText, colors, secureTextEntry = false, autoCapitalize = 'sentences', keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; colors: ReturnType<typeof useColors>; secureTextEntry?: boolean; autoCapitalize?: 'none' | 'sentences'; keyboardType?: 'default' | 'number-pad' }) { return <View style={styles.field}><Text style={[styles.label, { color: colors.foreground }]}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize} keyboardType={keyboardType} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /></View>; }
const styles = StyleSheet.create({ root: { flex: 1 }, content: { padding: 18, gap: 12 }, secondaryButton: { minHeight: 48, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }, secondaryText: { fontSize: 11, fontFamily: 'Inter_700Bold' }, discoveryList: { gap: 8 }, discoveryCard: { borderWidth: 1, borderRadius: 13, padding: 12 }, discoveryTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' }, discoveryMeta: { fontSize: 10, marginTop: 3 }, title: { fontSize: 22, fontFamily: 'Inter_700Bold' }, text: { fontSize: 11, lineHeight: 17 }, field: { gap: 6 }, label: { fontSize: 11, fontFamily: 'Inter_600SemiBold' }, input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13 }, button: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, buttonText: { fontSize: 12, fontFamily: 'Inter_700Bold' } });
