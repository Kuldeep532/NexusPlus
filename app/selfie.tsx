import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { evaluateFace, SELFIE_MESSAGES } from '@/features/selfie/selfieGuidance';
import type { SelfieFaceMetrics, SelfieGuidance } from '@/features/selfie/SelfieTypes';
import { speakAnnouncement } from '@/features/time-announcer/announcementSpeaker';
import type { TimeAnnouncementSettings } from '@/features/time-announcer/timeAnnouncerTypes';

let shutterAsset: number | null = null;
try {
  shutterAsset = require('../assets/audio/selfie_shutter_nexus_01.mp3');
} catch {
  shutterAsset = null;
}

const STABLE_FRAMES_REQUIRED = 8;
const GUIDANCE_COOLDOWN_MS = 1700;

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
  const lastAnnouncementAt = useRef(0);
  const lastGuidance = useRef<SelfieGuidance | null>(null);
  const stableFrames = useRef(0);
  const capturing = useRef(false);
  const [guidance, setGuidance] = useState<SelfieGuidance>('LOOK_AT_CAMERA');
  const [status, setStatus] = useState('Align your face inside the guide.');

  const announce = useCallback(async (key: SelfieGuidance, force = false) => {
    const now = Date.now();
    if (!force && (lastGuidance.current === key || now - lastAnnouncementAt.current < GUIDANCE_COOLDOWN_MS)) return;
    lastGuidance.current = key;
    lastAnnouncementAt.current = now;
    const message = SELFIE_MESSAGES[key];
    await speakAnnouncement(message, SELFIE_VOICE_SETTINGS);
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  useEffect(() => {
    if (cameraPermission?.granted) void announce('LOOK_AT_CAMERA', true);
    return () => undefined;
  }, [cameraPermission?.granted, announce]);

  const playShutter = useCallback(async () => {
    if (!shutterAsset) return;
    try {
      const { createAudioPlayer } = await import('expo-audio');
      const player = createAudioPlayer(shutterAsset);
      player.volume = 1;
      player.play();
    } catch {
      // Shutter audio is optional; capture must still succeed.
    }
  }, []);

  const capture = useCallback(async () => {
    if (capturing.current || !cameraRef.current) return;
    capturing.current = true;
    stableFrames.current = 0;
    setGuidance('TAKING_SELFIE');
    setStatus('Taking selfie…');
    await announce('TAKING_SELFIE', true);
    await playShutter();

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.92, skipProcessing: false });
      if (!photo?.uri) throw new Error('Camera returned no photo.');

      if (!mediaPermission?.granted) {
        const next = await requestMediaPermission();
        if (!next.granted) {
          Alert.alert('Photos permission needed', 'Allow Nexus Plus to save your selfie to Photos or Gallery.');
          setGuidance('HOLD_STILL');
          setStatus('Selfie captured. Allow gallery access to save it.');
          await announce('HOLD_STILL', true);
          return;
        }
      }

      await MediaLibrary.saveToLibraryAsync(photo.uri);
      setGuidance('PHOTO_SAVED');
      setStatus('Selfie saved to your gallery.');
      await announce('PHOTO_SAVED', true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to capture selfie.';
      setStatus(message);
      setGuidance('LOOK_AT_CAMERA');
      await announce('LOOK_AT_CAMERA', true);
    } finally {
      capturing.current = false;
    }
  }, [announce, mediaPermission?.granted, playShutter, requestMediaPermission]);

  const processDetectedFace = useCallback((face: any | null) => {
    if (capturing.current) return;
    if (!face?.bounds) {
      stableFrames.current = 0;
      setGuidance('LOOK_AT_CAMERA');
      setStatus('No face detected. Look at the camera.');
      void announce('LOOK_AT_CAMERA');
      return;
    }

    const metrics: SelfieFaceMetrics = {
      bounds: face.bounds,
      roll: Number(face.rollAngle ?? 0),
      yaw: Number(face.yawAngle ?? 0),
      pitch: Number(face.pitchAngle ?? 0),
      smilingProbability: face.smilingProbability,
      leftEyeOpenProbability: face.leftEyeOpenProbability,
      rightEyeOpenProbability: face.rightEyeOpenProbability,
    };

    const decision = evaluateFace(metrics, 1080, 1440);
    setGuidance(decision.guidance);
    setStatus(SELFIE_MESSAGES[decision.guidance]);
    void announce(decision.guidance);

    if (decision.ready) {
      stableFrames.current += 1;
      if (stableFrames.current >= STABLE_FRAMES_REQUIRED) void capture();
    } else {
      stableFrames.current = 0;
    }
  }, [announce, capture]);

  void processDetectedFace;

  if (!cameraPermission) return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.foreground }}>Loading camera…</Text></View>;

  if (!cameraPermission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingHorizontal: 28 }]}>
        <MaterialCommunityIcons name="camera-front" size={64} color={colors.primary} />
        <Text accessibilityRole="header" style={[styles.permissionTitle, { color: colors.foreground }]}>Selfie camera</Text>
        <Text style={[styles.permissionBody, { color: colors.mutedForeground }]}>Nexus Plus needs camera access to detect your face and take an automatic selfie.</Text>
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
          <View accessible accessibilityRole="image" accessibilityLabel={`Face alignment guide. ${status}`} style={[styles.faceGuide, guidance === 'HOLD_STILL' ? styles.readyGuide : undefined]} />
          <View style={styles.instructionCard} accessible accessibilityRole="text" accessibilityLabel={status}>
            <MaterialCommunityIcons name={guidance === 'HOLD_STILL' ? 'check-circle-outline' : 'face-recognition'} size={21} color="#fff" />
            <Text style={styles.instructionText}>{status}</Text>
          </View>
        </View>
        <View style={styles.bottomBar}><Text style={styles.helperText}>Hold the phone naturally. The photo is taken automatically when your face is aligned and steady.</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, permissionTitle: { marginTop: 18, fontSize: 26, fontFamily: 'Inter_700Bold', textAlign: 'center' }, permissionBody: { marginTop: 10, fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 360 }, primaryButton: { minHeight: 52, borderRadius: 16, paddingHorizontal: 24, justifyContent: 'center', marginTop: 26 }, primaryButtonText: { fontFamily: 'Inter_700Bold', fontSize: 15 }, secondaryButton: { minHeight: 48, paddingHorizontal: 24, justifyContent: 'center', marginTop: 8 }, overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' }, topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 }, topButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center' }, topTitle: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' }, guideWrap: { alignItems: 'center', justifyContent: 'center', flex: 1 }, faceGuide: { width: 250, height: 330, borderRadius: 125, borderWidth: 3, borderColor: '#fff', backgroundColor: 'transparent' }, readyGuide: { borderColor: '#75F2A8' }, instructionCard: { marginTop: 18, minHeight: 50, maxWidth: 340, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.58)', paddingHorizontal: 18, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' }, instructionText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold', flexShrink: 1, textAlign: 'center' }, bottomBar: { alignItems: 'center', paddingHorizontal: 24 }, helperText: { color: '#fff', textAlign: 'center', fontSize: 12, lineHeight: 18, opacity: 0.92, maxWidth: 380 },});
