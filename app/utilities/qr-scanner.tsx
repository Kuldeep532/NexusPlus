import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

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
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>('idle');
  const [payload, setPayload] = useState('');

  const startScanning = async () => {
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) return;
    }
    setPayload('');
    setState('scanning');
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 50 }}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="qrcode-scan" size={30} color={colors.primary} />
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>QR Code Scanner</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Scan QR codes and identify their content safely.</Text>
        </View>
      </View>

      {state === 'scanning' ? (
        <View style={[styles.scannerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.scannerWrap}>
            <CameraView
              accessibilityLabel="QR code scanner camera"
              style={styles.scanner}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => {
                setPayload(data);
                setState('result');
              }}
            />
            <View pointerEvents="none" style={styles.scanFrame} />
          </View>
          <Pressable accessibilityRole="button" onPress={() => setState('idle')} style={[styles.secondaryButton, { borderColor: colors.border }]}>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>Stop scanning</Text>
          </Pressable>
        </View>
      ) : state === 'result' ? (
        <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.resultIcon}>
            <MaterialCommunityIcons name="check-circle" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.resultType, { color: colors.foreground }]}>{classifyPayload(payload)}</Text>
          <Text selectable style={[styles.payload, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}>{payload}</Text>
          <Pressable accessibilityRole="button" onPress={startScanning} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="qrcode-scan" size={18} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }}>Scan another QR</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.startCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="camera-outline" size={58} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Ready to scan</Text>
          <Text style={[styles.cardText, { color: colors.mutedForeground }]}>Point the rear camera at a QR code. The scanner supports standard QR payloads, including Text, URLs, WhatsApp, Wi‑Fi and UPI.</Text>
          <Pressable accessibilityRole="button" onPress={startScanning} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="camera" size={18} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }}>Start scanner</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  copy: { flex: 1 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold' },
  subtitle: { marginTop: 3, fontSize: 12, lineHeight: 18 },
  startCard: { marginHorizontal: 20, minHeight: 330, borderWidth: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  cardTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  cardText: { textAlign: 'center', fontSize: 12, lineHeight: 19, maxWidth: 320 },
  primaryButton: { minHeight: 48, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 8 },
  secondaryButton: { minHeight: 46, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 14 },
  scannerCard: { marginHorizontal: 20, borderWidth: 1, borderRadius: 20, padding: 14 },
  scannerWrap: { width: '100%', aspectRatio: 1, overflow: 'hidden', borderRadius: 16, position: 'relative' },
  scanner: { flex: 1 },
  scanFrame: { position: 'absolute', width: '66%', height: '66%', left: '17%', top: '17%', borderWidth: 3, borderColor: '#FFFFFF', borderRadius: 20 },
  resultCard: { marginHorizontal: 20, borderWidth: 1, borderRadius: 20, padding: 22, alignItems: 'center', gap: 10 },
  resultIcon: { marginBottom: 2 },
  resultType: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  payload: { width: '100%', minHeight: 100, borderWidth: 1, borderRadius: 14, padding: 12, fontSize: 12, lineHeight: 18, textAlign: 'left', textAlignVertical: 'top' },
});
