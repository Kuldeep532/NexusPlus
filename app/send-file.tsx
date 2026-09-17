import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useMemo, useState } from 'react';
import { Alert, PermissionsAndroid, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { NexusFileTransfer, type FileTransferState } from '@/modules/nexus-file-transfer';

const EMPTY: FileTransferState = { mode: 'idle', status: 'idle', devices: [], pending: [], connected: false, progress: 0, total: 0, received: [] };

async function requestNearbyPermissions() {
  if (Platform.OS !== 'android') return false;
  const permissions = [
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ].filter(Boolean);
  if (Platform.Version >= 33 && PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES) permissions.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
  const result = await PermissionsAndroid.requestMultiple(permissions);
  return permissions.every((permission) => result[permission] === PermissionsAndroid.RESULTS.GRANTED);
}

export default function SendFileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<FileTransferState>(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setInterval(async () => {
      try { const next = await NexusFileTransfer.getState(); if (active) setState(next); } catch { /* native module unavailable until a native rebuild */ }
    }, 500);
    return () => { active = false; clearInterval(timer); void NexusFileTransfer.stop().catch(() => undefined); };
  }, []);

  const progressText = useMemo(() => state.total > 0 ? `${Math.round((state.progress / state.total) * 100)}%` : '', [state.progress, state.total]);

  const start = async (role: 'send' | 'receive') => {
    setBusy(true);
    try {
      const granted = await requestNearbyPermissions();
      if (!granted) throw new Error('Nearby device permissions are required to send or receive files.');
      await NexusFileTransfer.start(role);
    } catch (error) {
      Alert.alert('Send File', error instanceof Error ? error.message : 'Unable to start file sharing.');
    } finally { setBusy(false); }
  };

  const chooseFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false, multiple: false });
      if (result.canceled || !result.assets[0]) return;
      const file = result.assets[0];
      await NexusFileTransfer.queueFile(file.uri, file.name, file.mimeType ?? 'application/octet-stream');
      await start('send');
    } catch (error) {
      Alert.alert('File blocked', error instanceof Error ? error.message : 'This file could not be selected.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Send File</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Simple phone-to-phone sharing over nearby Wi-Fi or Bluetooth.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} accessibilityLabel="Send File controls">
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>What do you want to do?</Text>
          <Text style={[styles.cardText, { color: colors.mutedForeground }]}>Only two actions are available: send a file or receive a file.</Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Send a file" disabled={busy} onPress={chooseFile} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}>
              <Feather name="send" size={20} color={colors.primaryForeground} />
              <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Send File</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Receive a file" disabled={busy} onPress={() => start('receive')} style={[styles.secondaryButton, { backgroundColor: colors.background, borderColor: colors.border, opacity: busy ? 0.6 : 1 }]}>
              <Feather name="download" size={20} color={colors.foreground} />
              <Text style={[styles.buttonText, { color: colors.foreground }]}>Receive File</Text>
            </Pressable>
          </View>
        </View>

        {state.devices.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Nearby devices</Text>
            {state.devices.map((device) => (
              <Pressable key={device.id} accessibilityRole="button" accessibilityLabel={`Send to ${device.name}`} onPress={() => NexusFileTransfer.connect(device.id)} style={[styles.device, { borderColor: colors.border }]}>
                <Feather name="smartphone" size={20} color={colors.primary} />
                <Text style={[styles.deviceName, { color: colors.foreground }]}>{device.name}</Text>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        )}

        {state.pending.map((item) => (
          <View key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Connection request</Text>
            <Text style={[styles.cardText, { color: colors.mutedForeground }]}>{item.name}</Text>
            <Text accessibilityRole="text" style={[styles.code, { color: colors.foreground }]}>{item.code}</Text>
            <Text style={[styles.cardText, { color: colors.mutedForeground }]}>Confirm this code matches the other phone before accepting.</Text>
            <View style={styles.row}>
              <Pressable accessibilityRole="button" onPress={() => NexusFileTransfer.accept(item.id)} style={[styles.smallButton, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }}>Accept</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => NexusFileTransfer.reject(item.id)} style={[styles.smallButton, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]}><Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold' }}>Reject</Text></Pressable>
            </View>
          </View>
        ))}

        {state.status !== 'idle' && (
          <View style={[styles.status, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statusTitle, { color: colors.foreground }]}>{state.status.replaceAll('_', ' ')}</Text>
            {progressText ? <Text style={[styles.cardText, { color: colors.mutedForeground }]}>{progressText}</Text> : null}
            {state.error ? <Text style={[styles.error, { color: colors.destructive ?? colors.foreground }]}>{state.error}</Text> : null}
          </View>
        )}

        <View style={[styles.safety, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="shield" size={18} color={colors.primary} />
          <Text style={[styles.safetyText, { color: colors.mutedForeground }]}>Nexus Plus blocks executable and suspicious file types, checks the file size and SHA-256 integrity, and discards a received file if validation fails. This is a strict file-type/integrity filter, not a replacement for a full antivirus scanner.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 18, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-start' },
  headerCopy: { flex: 1, paddingRight: 14 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  iconButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 18, gap: 14, paddingBottom: 30 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 },
  cardTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  cardText: { fontSize: 12, lineHeight: 18 },
  actions: { gap: 10, marginTop: 6 },
  primaryButton: { minHeight: 54, borderRadius: 14, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { minHeight: 54, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  device: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  deviceName: { flex: 1, fontSize: 14, fontFamily: 'Inter_700Bold' },
  code: { fontSize: 25, letterSpacing: 3, fontFamily: 'Inter_700Bold', textAlign: 'center', paddingVertical: 8 },
  row: { flexDirection: 'row', gap: 10 },
  smallButton: { minHeight: 44, flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  status: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 5 },
  statusTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', textTransform: 'capitalize' },
  error: { fontSize: 12, lineHeight: 18 },
  safety: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  safetyText: { flex: 1, fontSize: 11.5, lineHeight: 17 },
});
