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
