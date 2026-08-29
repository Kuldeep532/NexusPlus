import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { saveManagedCamera } from '@/features/cctv/cctvManagement';
import type { CctvDeviceKind, CctvCapabilities, CctvProtocol } from '@/features/cctv/cctvTypes';

const DEVICE_KINDS: Array<{ id: CctvDeviceKind; label: string; icon: string }> = [
  { id: 'ip_camera', label: 'IP Camera', icon: 'video' },
  { id: 'network_camera', label: 'Network Camera', icon: 'wifi' },
  { id: 'dvr', label: 'DVR', icon: 'server' },
  { id: 'nvr', label: 'NVR', icon: 'hard-drive' },
];

const DEFAULT_CAPABILITIES: CctvCapabilities = {
  liveView: true,
  audio: false,
  recordings: false,
  playback: false,
  eraseData: false,
  passwordChange: false,
  discovery: false,
  multiCamera: false,
};

export default function CctvAddScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'qr' | 'serial' | 'manual'>('qr');
  const [deviceKind, setDeviceKind] = useState<CctvDeviceKind>('ip_camera');
  const [qrPayload, setQrPayload] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [scanning, setScanning] = useState(true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !username.trim() || !password) {
      Alert.alert('Required information', 'Enter Name, Username and Password before saving the camera.');
      return;
    }
    if (mode === 'serial' && !serialNumber.trim()) {
      Alert.alert('Serial number required', 'Enter the camera serial number.');
      return;
    }
    setSaving(true);
    try {
      const camera = await saveManagedCamera({
        name,
        username,
        password,
        manufacturer,
        model,
        serialNumber: serialNumber || undefined,
        protocol,
        deviceKind,
        capabilities: DEFAULT_CAPABILITIES,
      });
      Alert.alert('Camera added', `${camera.name} was saved locally on this phone.`);
      router.replace('/cctv-cameras');
    } catch {
      Alert.alert('Could not add camera', 'The camera could not be saved. Credentials remain on this phone.');
    } finally {
      setSaving(false);
    }
  };

  const [protocol, setProtocol] = useState<CctvProtocol>('onvif');
  const scanner = mode === 'qr' ? (!permission?.granted ? (
    <Pressable accessibilityRole="button" accessibilityLabel="Allow camera access for QR scanning" onPress={() => void requestPermission()} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
      <Feather name="camera" size={18} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Allow Camera for QR Scan</Text>
    </Pressable>
  ) : scanning ? (
    <View style={styles.scannerWrap}>
      <CameraView accessibilityLabel="QR code scanner" style={styles.scanner} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => { setQrPayload(data); setScanning(false); }} />
      <Pressable accessibilityRole="button" accessibilityLabel="Stop QR scanner" onPress={() => setScanning(false)} style={[styles.stopScan, { backgroundColor: colors.card }]}><Text style={[styles.stopText, { color: colors.foreground }]}>Stop Scanner</Text></Pressable>
    </View>
  ) : (
    <View style={styles.scanResult}>
      <Text style={[styles.note, { color: colors.foreground }]}>QR code captured.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Scan QR code again" onPress={() => setScanning(true)} style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="refresh-cw" size={17} color={colors.primary} /><Text style={[styles.secondaryText, { color: colors.foreground }]}>Scan Again</Text></Pressable>
    </View>
  )) : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Add CCTV Camera' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28 }]} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.foreground }]}>Add CCTV Camera</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Choose a device type and identify it using QR, serial number, or manual setup. Network host information is discovered automatically on the local Wi-Fi.</Text>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Device Type</Text>
        <View style={styles.grid}>{DEVICE_KINDS.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: deviceKind === item.id }} onPress={() => setDeviceKind(item.id)} style={[styles.kindCard, { borderColor: deviceKind === item.id ? colors.primary : colors.border, backgroundColor: deviceKind === item.id ? colors.secondary : colors.card }]}><Feather name={item.icon as never} size={19} color={colors.primary} /><Text style={[styles.kindText, { color: colors.foreground }]}>{item.label}</Text></Pressable>)}</View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Detection Method</Text>
        <View style={styles.modeRow}>{(['qr', 'serial', 'manual'] as const).map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: mode === item }} onPress={() => setMode(item)} style={[styles.mode, { borderColor: mode === item ? colors.primary : colors.border, backgroundColor: mode === item ? colors.secondary : colors.card }]}><Text style={[styles.modeText, { color: colors.foreground }]}>{item === 'qr' ? 'QR Code' : item === 'serial' ? 'Serial Number' : 'Manual'}</Text></Pressable>)}</View>
        {scanner}
        {mode === 'serial' && <Field label="Serial Number" value={serialNumber} onChangeText={setSerialNumber} placeholder="Enter serial number" colors={colors} />}
        <Field label="Enter Name" value={name} onChangeText={setName} placeholder="Camera name" colors={colors} />
        <Field label="Username" value={username} onChangeText={setUsername} placeholder="Camera username" colors={colors} autoCapitalize="none" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="Camera password" colors={colors} secureTextEntry autoCapitalize="none" />
        <Text style={[styles.note, { color: colors.mutedForeground }]}>Camera host and port are never entered by the user. The transport layer is responsible for discovering the camera on the current local Wi-Fi network.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Save CCTV camera" disabled={saving} onPress={() => void submit()} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}><Feather name="save" size={18} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{saving ? 'Adding Camera…' : 'Add Camera'}</Text></Pressable>
      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, colors, secureTextEntry = false, autoCapitalize = 'sentences' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; colors: ReturnType<typeof useColors>; secureTextEntry?: boolean; autoCapitalize?: 'none' | 'sentences' }) {
  return <View style={styles.field}><Text style={[styles.label, { color: colors.foreground }]}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /></View>;
}

const styles = StyleSheet.create({ root: { flex: 1 }, content: { paddingHorizontal: 18, gap: 12 }, title: { fontSize: 24, fontFamily: 'Inter_700Bold' }, subtitle: { fontSize: 11, lineHeight: 17 }, sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginTop: 4 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, kindCard: { width: '48%', minHeight: 72, borderWidth: 1, borderRadius: 14, padding: 12, justifyContent: 'center', gap: 6 }, kindText: { fontSize: 11, fontFamily: 'Inter_700Bold' }, modeRow: { flexDirection: 'row', gap: 7 }, mode: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 }, modeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' }, scannerWrap: { height: 230, borderRadius: 18, overflow: 'hidden' }, scanner: { flex: 1 }, stopScan: { position: 'absolute', bottom: 10, alignSelf: 'center', paddingHorizontal: 15, paddingVertical: 9, borderRadius: 20 }, stopText: { fontSize: 11, fontFamily: 'Inter_700Bold' }, scanResult: { gap: 8 }, field: { gap: 6 }, label: { fontSize: 11, fontFamily: 'Inter_700Bold' }, input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 13 }, note: { fontSize: 10.5, lineHeight: 16 }, primaryButton: { minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, buttonText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, secondaryButton: { minHeight: 44, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, secondaryText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' }, });