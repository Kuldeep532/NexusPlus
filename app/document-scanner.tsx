import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { documentHaptic } from '@/features/document-studio/documentFeedback';

const SCAN_SOUND = require('../assets/audio/document processing.mp3');

type ScanStatus = 'ready' | 'scanning' | 'captured';

export default function DocumentScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const player = useAudioPlayer(SCAN_SOUND);
  const cameraRef = useRef<CameraView | null>(null);
  const processingRef = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<ScanStatus>('ready');
  const [busy, setBusy] = useState(false);
  const [pages, setPages] = useState<string[]>([]);

  const scanFeedback = async (kind: 'tap' | 'success' | 'error') => {
    try { player.seekTo(0); player.play(); } catch { /* audio feedback is non-critical */ }
    await documentHaptic(kind);
  };

  const startScanner = async () => {
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) {
        Alert.alert('Camera permission required', 'Allow camera access in Android settings to scan documents.');
        await scanFeedback('error');
        return;
      }
    }
    setStatus('scanning');
    await scanFeedback('tap');
  };

  const capturePage = async () => {
    if (processingRef.current || status !== 'scanning') return;
    processingRef.current = true;
    setBusy(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 1, skipProcessing: false });
      if (!photo?.uri) {
        await scanFeedback('error');
        return;
      }
      setPages((current) => [...current, photo.uri]);
      setStatus('captured');
      await scanFeedback('success');
    } catch {
      await scanFeedback('error');
      Alert.alert('Capture failed', 'The document page could not be captured.');
    } finally {
      processingRef.current = false;
      setBusy(false);
    }
  };

  const chooseImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, quality: 1 });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setPages((current) => [...current, result.assets[0].uri]);
    setStatus('captured');
    await scanFeedback('success');
  };

  const saveScanCopy = async () => {
    if (!pages.length) return;
    setBusy(true);
    try {
      const dir = `${FileSystem.documentDirectory}Document Studio/Scans/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const target = `${dir}scan-${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: pages[0], to: target });
      await scanFeedback('success');
      Alert.alert('Scan saved', `The first scanned page was saved to the Document Studio scan library. ${pages.length > 1 ? 'Additional pages remain in the current scan session.' : ''}`);
    } catch {
      await scanFeedback('error');
      Alert.alert('Save failed', 'The scan could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const addAnotherPage = () => {
    setStatus('scanning');
    void scanFeedback('tap');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Document Scanner' }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="scanner" size={32} color={colors.primary} />
          <View style={styles.copy}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Document Scanner</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Capture paper pages as individual scan pages with existing audio and shared haptic feedback.</Text>
          </View>
        </View>

        {status === 'scanning' ? (
          <View style={[styles.scannerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.preview}>
              <CameraView ref={(value) => { cameraRef.current = value; }} style={StyleSheet.absoluteFill} facing="back" />
              <View pointerEvents="none" style={styles.frame} />
              <Text style={styles.frameText}>Align document inside the frame</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Capture document page" onPress={() => void capturePage()} disabled={busy} style={[styles.primary, { backgroundColor: colors.primary }, busy && styles.disabled]}>
              {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <MaterialCommunityIcons name="camera-outline" size={19} color={colors.primaryForeground} />}
              <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>{busy ? 'Capturing…' : 'Capture page'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Choose existing document image" onPress={() => void chooseImage()} style={[styles.secondary, { borderColor: colors.border }]}>
              <Feather name="image" size={18} color={colors.foreground} />
              <Text style={[styles.secondaryText, { color: colors.foreground }]}>Use existing image</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Finish document scan" onPress={() => setStatus(pages.length ? 'captured' : 'ready')} style={[styles.secondary, { borderColor: colors.border }]}>
              <Feather name="check" size={18} color={colors.foreground} />
              <Text style={[styles.secondaryText, { color: colors.foreground }]}>Finish scanning</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="file-scan-outline" size={58} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{pages.length ? 'Scan captured' : 'Ready to scan'}</Text>
            <Text style={[styles.cardText, { color: colors.mutedForeground }]}>{pages.length ? `${pages.length} page${pages.length === 1 ? '' : 's'} captured. Continue adding pages or save the scan.` : 'Start the camera scanner or add a document image. The existing document-processing sound and haptic feedback are reused for scan actions.'}</Text>
            <Pressable accessibilityRole="button" onPress={() => void startScanner()} style={[styles.primary, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="camera" size={18} color={colors.primaryForeground} />
              <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>{pages.length ? 'Scan another page' : 'Start scanner'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => void chooseImage()} style={[styles.secondary, { borderColor: colors.border }]}>
              <Feather name="image" size={18} color={colors.foreground} />
              <Text style={[styles.secondaryText, { color: colors.foreground }]}>Use existing image</Text>
            </Pressable>
          </View>
        )}

        {!!pages.length && (
          <View style={[styles.pages, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.pagesTitle, { color: colors.foreground }]}>{pages.length} scanned page{pages.length === 1 ? '' : 's'}</Text>
            <View style={styles.row}>
              <Pressable accessibilityRole="button" onPress={addAnotherPage} disabled={busy} style={[styles.secondarySmall, { borderColor: colors.border }, busy && styles.disabled]}>
                <Feather name="plus" size={17} color={colors.foreground} />
                <Text style={[styles.secondaryText, { color: colors.foreground }]}>Add page</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => void saveScanCopy()} disabled={busy} style={[styles.primarySmall, { backgroundColor: colors.primary }, busy && styles.disabled]}>
                <MaterialCommunityIcons name="content-save-outline" size={18} color={colors.primaryForeground} />
                <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Save scan</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 18 },
  copy: { flex: 1, marginLeft: 12 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold' },
  subtitle: { marginTop: 4, fontSize: 12, lineHeight: 18 },
  card: { marginHorizontal: 20, minHeight: 360, borderWidth: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  cardTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  cardText: { textAlign: 'center', fontSize: 12, lineHeight: 19, maxWidth: 330 },
  scannerCard: { marginHorizontal: 20, borderWidth: 1, borderRadius: 20, padding: 14 },
  preview: { width: '100%', aspectRatio: 0.76, overflow: 'hidden', borderRadius: 16, position: 'relative', backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  frame: { width: '82%', height: '78%', borderWidth: 2, borderColor: '#fff', borderRadius: 10 },
  frameText: { position: 'absolute', bottom: 20, color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  primary: { minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, paddingHorizontal: 14 },
  secondary: { minHeight: 48, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, paddingHorizontal: 14 },
  row: { flexDirection: 'row', gap: 10 },
  primarySmall: { flex: 1, minHeight: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingHorizontal: 10 },
  secondarySmall: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingHorizontal: 10 },
  primaryText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  secondaryText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  pages: { marginHorizontal: 20, marginTop: 14, borderWidth: 1, borderRadius: 18, padding: 14 },
  pagesTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  disabled: { opacity: 0.5 },
});