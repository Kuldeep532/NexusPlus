import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { saveManagedCamera } from '@/features/cctv/cctvManagement';
import type { CctvCapabilities, CctvDeviceKind, CctvProtocol } from '@/features/cctv/cctvTypes';
import { completeCctvCredentials, completeCctvIdentification, initialCctvSetupDraft, selectCctvSetupMethod, type CctvSetupDraft, type CctvSetupMethod } from '@/features/cctv/cctvSetupFlow';

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

const METHODS: Array<{ id: CctvSetupMethod; title: string; description: string; icon: string }> = [
  { id: 'qr', title: 'Scan QR Code', description: 'Use the camera QR code to identify the device.', icon: 'maximize' },
  { id: 'serial', title: 'Enter Serial Number', description: 'Identify the device with its serial number.', icon: 'hash' },
  { id: 'manual', title: 'Manual Setup', description: 'Enter the device identity manually.', icon: 'edit-3' },
];

export default function CctvAddScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<CctvSetupDraft>(initialCctvSetupDraft());
  const [deviceKind, setDeviceKind] = useState<CctvDeviceKind>('ip_camera');
  const [permission, requestPermission] = useCameraPermissions();
  const [qrPayload, setQrPayload] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [scanning, setScanning] = useState(true);
  const [saving, setSaving] = useState(false);

  const stepNumber = useMemo(() => ({ method: 1, identify: 2, credentials: 3, complete: 4 } as const)[draft.step], [draft.step]);

  const continueIdentification = () => {
    try {
      setDraft((current) => completeCctvIdentification(current, {
        qrPayload: current.method === 'qr' ? qrPayload : undefined,
        serialNumber: current.method === 'serial' || current.method === 'manual' ? serialNumber : undefined,
      }));
    } catch (error) {
      Alert.alert('Identification required', error instanceof Error ? error.message : 'Complete identification first.');
    }
  };

  const continueCredentials = async () => {
    if (!draft.method) return;
    try {
      setDraft((current) => completeCctvCredentials(current, { name, username }));
      setSaving(true);
      const camera = await saveManagedCamera({
        name,
        username,
        password,
        manufacturer: undefined,
        model: undefined,
        serialNumber: draft.serialNumber,
        protocol: 'unknown' as CctvProtocol,
        deviceKind,
        capabilities: DEFAULT_CAPABILITIES,
      });
      Alert.alert('Camera added', `${camera.name} was saved securely on this phone.`);
      router.replace('/cctv-cameras');
    } catch (error) {
      Alert.alert('Could not add camera', error instanceof Error ? error.message : 'The camera could not be saved securely.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: `Add CCTV Camera — Step ${stepNumber} of 4` }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28 }]} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.foreground }]}>Add CCTV Camera</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Complete one step at a time. Username, password and name appear only after the camera is identified.</Text>
        <View style={styles.progressRow}>
          {[1, 2, 3, 4].map((item) => <View key={item} style={[styles.progressBar, { backgroundColor: item <= stepNumber ? colors.primary : colors.border }]} />)}
        </View>

        {draft.step === 'method' && <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Choose Identification Method</Text>
          <View style={styles.stack}>{METHODS.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.title} onPress={() => setDraft((current) => selectCctvSetupMethod(current, item.id))} style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.optionIcon, { backgroundColor: colors.secondary }]}><Feather name={item.icon as never} size={20} color={colors.primary} /></View><View style={styles.copy}><Text style={[styles.optionTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.note, { color: colors.mutedForeground }]}>{item.description}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>)}</View>
        </>}

        {draft.step === 'identify' && draft.method && <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Identify Camera</Text>
          <Text style={[styles.note, { color: colors.mutedForeground }]}>{draft.method === 'qr' ? 'Scan the QR code. Camera credentials are not requested at this stage.' : 'Enter the camera identity first. Credentials come on the next step.'}</Text>
          {draft.method === 'qr' && (!permission?.granted ? <Pressable accessibilityRole="button" accessibilityLabel="Allow camera access for QR scanning" onPress={() => void requestPermission()} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Feather name="camera" size={18} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Allow Camera for QR Scan</Text></Pressable> : scanning ? <View style={styles.scannerWrap}><CameraView accessibilityLabel="QR code scanner" style={styles.scanner} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => { setQrPayload(data); setScanning(false); }} /><Pressable accessibilityRole="button" accessibilityLabel="Stop QR scanner" onPress={() => setScanning(false)} style={[styles.stopScan, { backgroundColor: colors.card }]}><Text style={[styles.stopText, { color: colors.foreground }]}>Stop Scanner</Text></Pressable></View> : <><Text style={[styles.success, { color: colors.foreground }]}>QR code captured.</Text><Pressable accessibilityRole="button" accessibilityLabel="Scan QR code again" onPress={() => setScanning(true)} style={[styles.secondaryButton, { borderColor: colors.border }]}><Text style={[styles.secondaryText, { color: colors.foreground }]}>Scan Again</Text></Pressable></>)}
          {(draft.method === 'serial' || draft.method === 'manual') && <Field label="Serial Number" value={serialNumber} onChangeText={setSerialNumber} placeholder="Enter serial number" colors={colors} />}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Device Type</Text>
          <View style={styles.grid}>{DEVICE_KINDS.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: deviceKind === item.id }} onPress={() => setDeviceKind(item.id)} style={[styles.kindCard, { borderColor: deviceKind === item.id ? colors.primary : colors.border, backgroundColor: deviceKind === item.id ? colors.secondary : colors.card }]}><Feather name={item.icon as never} size={18} color={colors.primary} /><Text style={[styles.kindText, { color: colors.foreground }]}>{item.label}</Text></Pressable>)}</View>
          <Pressable accessibilityRole="button" accessibilityLabel="Continue to camera credentials" onPress={continueIdentification} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Continue</Text><Feather name="arrow-right" size={18} color={colors.primaryForeground} /></Pressable>
        </>}

        {draft.step === 'credentials' && <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Camera Details</Text>
          <Text style={[styles.note, { color: colors.mutedForeground }]}>The network host is discovered automatically on the local Wi-Fi/LAN. It is not entered by the user.</Text>
          <Field label="Name" value={name} onChangeText={setName} placeholder="Camera name" colors={colors} />
          <Field label="Username" value={username} onChangeText={setUsername} placeholder="Camera username" colors={colors} autoCapitalize="none" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="Camera password" colors={colors} secureTextEntry autoCapitalize="none" />
          <Pressable accessibilityRole="button" accessibilityLabel="Add camera" disabled={saving} onPress={() => void continueCredentials()} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}><Feather name="save" size={18} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{saving ? 'Adding Camera…' : 'Add Camera'}</Text></Pressable>
        </>}

        {draft.step === 'complete' && <View style={[styles.completeCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="check-circle" size={42} color={colors.primary} /><Text style={[styles.optionTitle, { color: colors.foreground }]}>Camera added successfully</Text><Text style={[styles.note, { color: colors.mutedForeground }]}>CCTV management will show the complete camera list when you return.</Text></View>}
      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, colors, secureTextEntry = false, autoCapitalize = 'sentences' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; colors: ReturnType<typeof useColors>; secureTextEntry?: boolean; autoCapitalize?: 'none' | 'sentences' }) {
  return <View style={styles.field}><Text style={[styles.label, { color: colors.foreground }]}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { paddingHorizontal: 18, gap: 13 }, title: { fontSize: 24, fontFamily: 'Inter_700Bold' }, subtitle: { fontSize: 11, lineHeight: 17 }, progressRow: { flexDirection: 'row', gap: 6 }, progressBar: { height: 5, flex: 1, borderRadius: 4 }, sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginTop: 4 }, stack: { gap: 9 }, optionCard: { minHeight: 76, borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 }, optionIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, optionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' }, note: { fontSize: 10.5, lineHeight: 16 }, scannerWrap: { height: 230, borderRadius: 18, overflow: 'hidden' }, scanner: { flex: 1 }, stopScan: { position: 'absolute', bottom: 10, alignSelf: 'center', paddingHorizontal: 15, paddingVertical: 9, borderRadius: 20 }, stopText: { fontSize: 11, fontFamily: 'Inter_700Bold' }, success: { fontSize: 13, fontFamily: 'Inter_700Bold' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, kindCard: { width: '48%', minHeight: 68, borderWidth: 1, borderRadius: 14, padding: 11, justifyContent: 'center', gap: 6 }, kindText: { fontSize: 11, fontFamily: 'Inter_700Bold' }, field: { gap: 6 }, label: { fontSize: 11, fontFamily: 'Inter_700Bold' }, input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 13 }, primaryButton: { minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 16 }, buttonText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, secondaryButton: { minHeight: 46, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, secondaryText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' }, completeCard: { borderWidth: 1, borderRadius: 18, padding: 24, alignItems: 'center', gap: 9 }, });
