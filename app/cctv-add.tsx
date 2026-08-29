import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useCctvCameras } from '@/features/cctv/useCctvCameras';

export default function CctvAddScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addCamera } = useCctvCameras();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'qr' | 'serial' | 'manual'>('qr');
  const [qrPayload, setQrPayload] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erasePassword, setErasePassword] = useState('');
  const [scanning, setScanning] = useState(true);

  const submit = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Credentials required', 'Enter the camera username and password before adding it.');
      return;
    }
    try {
      const camera = await addCamera({ mode, qrPayload: qrPayload.trim() || undefined, serialNumber: serialNumber.trim() || undefined, manufacturer: manufacturer.trim() || undefined, model: model.trim() || undefined, username: username.trim(), password }, erasePassword ? erasePassword : '');
      Alert.alert('Camera saved', `${camera.name} was saved locally on this phone.`);
      router.replace('/cctv-cameras');
    } catch {
      Alert.alert('Could not add camera', 'The camera details could not be saved locally. No network database was used.');
    }
  };

  const scan = !permission?.granted ? (
    <Pressable accessibilityRole="button" accessibilityLabel="Allow camera access for QR scanning" onPress={() => void requestPermission()} style={[styles.scanButton, { backgroundColor: colors.primary }]}>
      <Feather name="camera" size={20} color={colors.primaryForeground} />
      <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Allow camera access</Text>
    </Pressable>
  ) : scanning ? (
    <View style={styles.scannerWrap}>
      <CameraView accessibilityLabel="QR code scanner" style={styles.scanner} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => { setQrPayload(data); setScanning(false); }} />
      <Pressable accessibilityRole="button" accessibilityLabel="Stop QR scanner" onPress={() => setScanning(false)} style={[styles.stopScan, { backgroundColor: colors.card }]}><Text style={[styles.stopText, { color: colors.foreground }]}>Stop scanner</Text></Pressable>
    </View>
  ) : (
    <Pressable accessibilityRole="button" accessibilityLabel="Scan QR code again" onPress={() => setScanning(true)} style={[styles.secondaryButton, { borderColor: colors.border }]}>
      <Feather name="maximize" size={18} color={colors.primary} /><Text style={[styles.secondaryText, { color: colors.foreground }]}>Scan QR code again</Text>
    </Pressable>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Add CCTV Camera' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28 }]} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.foreground }]}>Add Camera</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>QR, serial-number, or manual setup. Technical network details stay hidden.</Text>
        <View style={styles.modeRow}>
          {(['qr', 'serial', 'manual'] as const).map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: mode === item }} onPress={() => setMode(item)} style={[styles.mode, { borderColor: mode === item ? colors.primary : colors.border, backgroundColor: mode === item ? colors.secondary : colors.card }]}><Text style={[styles.modeText, { color: colors.foreground }]}>{item === 'qr' ? 'QR Scan' : item === 'serial' ? 'Serial Number' : 'Manual Detection'}</Text></Pressable>)}
        </View>
        {mode === 'qr' && scan}
        <Field label="Serial Number" value={serialNumber} onChangeText={setSerialNumber} placeholder="Enter serial number" colors={colors} />
        <Field label="Manufacturer" value={manufacturer} onChangeText={setManufacturer} placeholder="Optional" colors={colors} />
        <Field label="Model" value={model} onChangeText={setModel} placeholder="Optional" colors={colors} />
        <Field label="Camera Username" value={username} onChangeText={setUsername} placeholder="Required" colors={colors} autoCapitalize="none" />
        <Field label="Camera Password" value={password} onChangeText={setPassword} placeholder="Required" colors={colors} secureTextEntry autoCapitalize="none" />
        <Field label="Erase Protection Password" value={erasePassword} onChangeText={setErasePassword} placeholder="Recommended" colors={colors} secureTextEntry autoCapitalize="none" />
        <Text style={[styles.note, { color: colors.mutedForeground }]}>Credentials are stored locally using secure storage. This stage does not upload camera data to any online database.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Save CCTV camera locally" onPress={() => void submit()} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Feather name="save" size={18} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Save Camera Locally</Text></Pressable>
      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, colors, secureTextEntry = false, autoCapitalize = 'sentences' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; colors: ReturnType<typeof useColors>; secureTextEntry?: boolean; autoCapitalize?: 'none' | 'sentences' }) {
  return <View style={styles.field}><Text style={[styles.label, { color: colors.foreground }]}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { paddingHorizontal: 18, gap: 12 }, title: { fontSize: 24, fontFamily: 'Inter_700Bold' }, subtitle: { fontSize: 11, lineHeight: 17 }, modeRow: { gap: 8 }, mode: { minHeight: 46, borderWidth: 1, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 13 }, modeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' }, scannerWrap: { height: 250, borderRadius: 18, overflow: 'hidden' }, scanner: { flex: 1 }, stopScan: { position: 'absolute', bottom: 10, alignSelf: 'center', paddingHorizontal: 15, paddingVertical: 9, borderRadius: 20 }, stopText: { fontSize: 11, fontFamily: 'Inter_700Bold' }, scanButton: { minHeight: 48, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, secondaryButton: { minHeight: 46, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, secondaryText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' }, field: { gap: 6 }, label: { fontSize: 11, fontFamily: 'Inter_700Bold' }, input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 13 }, note: { fontSize: 10.5, lineHeight: 16 }, primaryButton: { minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, buttonText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
});
