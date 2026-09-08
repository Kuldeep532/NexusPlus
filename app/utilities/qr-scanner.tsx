import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAudioPlayer } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const SCAN_BEEP_SOURCE = require('../../assets/audio/qr/qr-scan-beep.mp3');

type ScanState = 'idle' | 'scanning' | 'result';

function classifyPayload(data: string): string {
  const value = data.trim().toLowerCase();
  if (value.startsWith('wifi:')) return 'Wi‑Fi';
  if (value.startsWith('upi://')) return 'UPI payment';
  if (value.includes('wa.me/') || value.startsWith('whatsapp://')) return 'WhatsApp';
  if (value.startsWith('http://') || value.startsWith('https://')) return 'URL';
  return 'Text';
}

export default function QRScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const player = useAudioPlayer(SCAN_BEEP_SOURCE);
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>('idle');
  const [payload, setPayload] = useState('');
  const [guidance, setGuidance] = useState('Hold to scan. Move left or right to center the QR code.');
  const [scanBusy, setScanBusy] = useState(false);

  const startScanning = async () => {
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) { setGuidance('Camera permission is required.'); return; }
    }
    setPayload('');
    setScanBusy(false);
    setGuidance('Hold to scan. Move left or right to center the QR code.');
    setState('scanning');
  };

  const handleScanned = (data: string) => {
    if (!data || scanBusy) return;
    setScanBusy(true);
    setPayload(data);
    try { player.seekTo(0); player.play(); } catch { /* sound is non-critical */ }
    setGuidance('QR code scan successful.');
    setState('result');
  };

  const uploadQr = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1 });
    if (result.canceled || !result.assets[0]?.uri) return;
    Alert.alert('Upload QR Code', 'Image selection is available, but this Expo build does not include a native image QR decoder. Use the camera scanner for image decoding.');
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 50 }} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><MaterialCommunityIcons name="qrcode-scan" size={30} color={colors.primary} /><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>QR Code Scanner</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Scan or upload a QR code and identify its content safely.</Text></View></View>
      {state === 'scanning' ? (
        <View style={[styles.scannerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text accessibilityRole="text" accessibilityLiveRegion="polite" style={[styles.guidance, { color: colors.foreground }]}>{guidance}</Text>
          <View style={styles.scannerWrap} accessibilityLabel="QR scanner. Hold steady. Move right, move left, or move closer until the QR code is centered."><CameraView style={styles.scanner} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => handleScanned(data)} /><View pointerEvents="none" style={styles.scanFrame} /></View>
          <Text accessibilityRole="text" style={[styles.helper, { color: colors.mutedForeground }]}>Hold steady. Move right or left to center the code inside the frame.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Upload QR code image" onPress={() => void uploadQr()} style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="upload" size={17} color={colors.foreground} /><Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>Upload QR Code</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Stop scanning" onPress={() => { setState('idle'); setScanBusy(false); }} style={[styles.secondaryButton, { borderColor: colors.border }]}><Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>Stop scanning</Text></Pressable>
        </View>
      ) : state === 'result' ? (
        <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.resultIcon}><MaterialCommunityIcons name="check-circle" size={32} color={colors.primary} /></View>
          <Text accessibilityRole="text" accessibilityLiveRegion="polite" style={[styles.success, { color: colors.foreground }]}>{guidance}</Text>
          <Text style={[styles.resultType, { color: colors.foreground }]}>{classifyPayload(payload)}</Text>
          <Text selectable style={[styles.payload, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}>{payload}</Text>
          <Pressable accessibilityRole="button" onPress={() => void startScanning()} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><MaterialCommunityIcons name="qrcode-scan" size={18} color={colors.primaryForeground} /><Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }}>Scan another QR</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => { setState('idle'); setScanBusy(false); }} style={[styles.secondaryButton, { borderColor: colors.border }]}><Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>Back</Text></Pressable>
        </View>
      ) : (
        <View style={[styles.startCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="camera-outline" size={58} color={colors.primary} /><Text style={[styles.cardTitle, { color: colors.foreground }]}>Ready to scan</Text><Text style={[styles.cardText, { color: colors.mutedForeground }]}>Use the camera or upload a QR image. Text, URLs, WhatsApp, Wi‑Fi and UPI payloads are supported.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Start QR scanner" onPress={() => void startScanning()} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><MaterialCommunityIcons name="camera" size={18} color={colors.primaryForeground} /><Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }}>Start scanner</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Upload QR code image" onPress={() => void uploadQr()} style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="upload" size={17} color={colors.foreground} /><Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>Upload QR Code</Text></Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }, copy: { flex: 1 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold' }, subtitle: { marginTop: 3, fontSize: 12, lineHeight: 18 }, guidance: { fontSize: 14, fontFamily: 'Inter_700Bold', textAlign: 'center', marginBottom: 10 }, helper: { fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 10 }, startCard: { marginHorizontal: 20, minHeight: 360, borderWidth: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }, cardTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' }, cardText: { textAlign: 'center', fontSize: 12, lineHeight: 19, maxWidth: 320 }, primaryButton: { minHeight: 48, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 8 }, secondaryButton: { minHeight: 46, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 18, marginTop: 10 }, scannerCard: { marginHorizontal: 20, borderWidth: 1, borderRadius: 20, padding: 14 }, scannerWrap: { width: '100%', aspectRatio: 1, overflow: 'hidden', borderRadius: 16, position: 'relative' }, scanner: { flex: 1 }, scanFrame: { position: 'absolute', width: '66%', height: '66%', left: '17%', top: '17%', borderWidth: 3, borderColor: '#FFFFFF', borderRadius: 20 }, resultCard: { marginHorizontal: 20, borderWidth: 1, borderRadius: 20, padding: 22, alignItems: 'center', gap: 10 }, resultIcon: { marginBottom: 2 }, success: { fontSize: 14, fontFamily: 'Inter_700Bold', textAlign: 'center' }, resultType: { fontSize: 18, fontFamily: 'Inter_700Bold' }, payload: { width: '100%', minHeight: 100, borderWidth: 1, borderRadius: 14, padding: 12, fontSize: 12, lineHeight: 18, textAlign: 'left', textAlignVertical: 'top' },
});
