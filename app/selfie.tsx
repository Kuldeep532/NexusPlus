import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { speakAnnouncement } from '@/features/time-announcer/announcementSpeaker';
import type { TimeAnnouncementSettings } from '@/features/time-announcer/timeAnnouncerTypes';

let shutterAsset: number | null = null;
try {
  shutterAsset = require('../assets/audio/selfie_shutter_nexus_01.mp3');
} catch {
  shutterAsset = null;
}

const SELFIE_VOICE_SETTINGS: TimeAnnouncementSettings = {
  enabled: true,
  intervalMinutes: 30,
  language: 'en-IN',
  rate: 0.92,
  pitch: 1.0,
};

export default function SelfieScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const capturing = useRef(false);
  const [status, setStatus] = useState('Camera is ready. Position your face manually, then take the selfie.');

  const announce = useCallback(async (message: string) => {
    try {
      await speakAnnouncement(message, SELFIE_VOICE_SETTINGS);
    } catch {
      // Voice guidance is optional; visual/accessibility status remains authoritative.
    }
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  useEffect(() => {
    if (cameraPermission?.granted) void announce('Camera ready. Position your face manually and take the selfie.');
  }, [cameraPermission?.granted, announce]);

  const playShutter = useCallback(async () => {
    if (!shutterAsset) return;
    try {
      const { createAudioPlayer } = await import('expo-audio');
      const player = createAudioPlayer(shutterAsset);
      player.volume = 1;
      player.play();
    } catch {
      // Optional shutter sound must never block capture.
    }
  }, []);

  const capture = useCallback(async () => {
    if (capturing.current || !cameraRef.current) return;
    capturing.current = true;
    setStatus('Taking selfie…');
    await announce('Taking selfie.');
    await playShutter();

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.92, skipProcessing: false });
      if (!photo?.uri) throw new Error('Camera returned no photo.');

      if (!mediaPermission?.granted) {
        const next = await requestMediaPermission();
        if (!next.granted) {
          setStatus('Selfie captured, but gallery access was not granted.');
          Alert.alert('Photos permission needed', 'Allow Nexus Plus to save your selfie to Photos or Gallery.');
          await announce('Selfie captured, but gallery access is needed to save it.');
          return;
        }
      }

      await MediaLibrary.saveToLibraryAsync(photo.uri);
      setStatus('Selfie saved to your gallery.');
      await announce('Selfie saved.');
    } catch {
      setStatus('Unable to capture selfie. Please try again.');
      await announce('Unable to capture selfie. Please try again.');
    } finally {
      capturing.current = false;
    }
  }, [announce, mediaPermission?.granted, playShutter, requestMediaPermission]);

  if (!cameraPermission) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.foreground }}>Loading camera…</Text></View>;
  }

  if (!cameraPermission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingHorizontal: 28 }]}> 
        <MaterialCommunityIcons name="camera-front" size={64} color={colors.primary} />
        <Text accessibilityRole="header" style={[styles.permissionTitle, { color: colors.foreground }]}>Selfie camera</Text>
        <Text style={[styles.permissionBody, { color: colors.mutedForeground }]}>Nexus Plus needs camera access to take a selfie.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Allow camera access" onPress={() => void requestCameraPermission()} style={[styles.primaryButton, { backgroundColor: colors.primary }]}> 
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Allow camera access</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.secondaryButton}> 
          <Text style={{ color: colors.foreground }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: '#000' }]}> 
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" mode="picture" animateShutter autofocus="on" />
      <View pointerEvents="box-none" style={[styles.overlay, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}> 
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close selfie camera" onPress={() => router.back()} style={styles.topButton}><Feather name="x" size={24} color="#fff" /></Pressable>
          <Text accessibilityRole="header" style={styles.topTitle}>Selfie</Text>
          <View style={styles.topButton} />
        </View>
        <View style={styles.guideWrap}>
          <View accessible accessibilityRole="image" accessibilityLabel={`Manual face-positioning guide. ${status}`} style={styles.faceGuide} />
          <View style={styles.instructionCard} accessible accessibilityRole="text" accessibilityLabel={status}>
            <MaterialCommunityIcons name="face-recognition" size={21} color="#fff" />
            <Text style={styles.instructionText}>{status}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take selfie"
            accessibilityHint="Capture the current front-camera view and save it to your gallery."
            onPress={() => void capture()}
            disabled={capturing.current}
            style={[styles.captureButton, capturing.current && styles.disabled]}
          >
            <View style={styles.captureInner} />
          </Pressable>
        </View>
        <View style={styles.bottomBar}><Text style={styles.helperText}>Automatic face detection is not enabled in this build. Align yourself manually and use the capture button.</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  permissionTitle: { marginTop: 18, fontSize: 26, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  permissionBody: { marginTop: 10, fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 360 },
  primaryButton: { minHeight: 52, borderRadius: 16, paddingHorizontal: 24, justifyContent: 'center', marginTop: 26 },
  primaryButtonText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  secondaryButton: { minHeight: 48, paddingHorizontal: 24, justifyContent: 'center', marginTop: 8 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  topButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  guideWrap: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  faceGuide: { width: 250, height: 330, borderRadius: 125, borderWidth: 3, borderColor: '#fff', backgroundColor: 'transparent' },
  instructionCard: { marginTop: 18, minHeight: 50, maxWidth: 340, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.58)', paddingHorizontal: 18, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  instructionText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold', flexShrink: 1, textAlign: 'center' },
  captureButton: { width: 82, height: 82, borderRadius: 41, marginTop: 24, borderWidth: 5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
  bottomBar: { alignItems: 'center', paddingHorizontal: 24 },
  helperText: { color: '#fff', textAlign: 'center', fontSize: 12, lineHeight: 18, opacity: 0.92, maxWidth: 380 },
  disabled: { opacity: 0.55 },
});
