import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { RadhaKrishnaWelcomeArt } from './RadhaKrishnaWelcomeArt';

const DISPLAY_MS = 3000;

export function NexusWelcomePattern() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 120 120" preserveAspectRatio="none" pointerEvents="none">
      <Rect width="120" height="120" fill="none" />
      <Path d="M0 30C18 16 36 16 54 30S90 44 120 30" fill="none" stroke="#F59E0B" strokeWidth="0.8" opacity="0.18" />
      <Path d="M0 62C18 48 36 48 54 62S90 76 120 62" fill="none" stroke="#7C3AED" strokeWidth="0.8" opacity="0.16" />
      <Path d="M0 94C18 80 36 80 54 94S90 108 120 94" fill="none" stroke="#EC4899" strokeWidth="0.8" opacity="0.14" />
      <Circle cx="18" cy="18" r="2" fill="#FDE68A" opacity="0.25" />
      <Circle cx="76" cy="78" r="2" fill="#FDE68A" opacity="0.2" />
      <Circle cx="104" cy="28" r="1.5" fill="#FFFFFF" opacity="0.24" />
    </Svg>
  );
}

export function NexusWelcomeSplash({ onFinished }: { onFinished: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onFinished, DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <View style={styles.root} accessibilityRole="summary" accessibilityLabel="Jai Shri Krishna. Nexus Plus welcome screen." accessible>
      <View style={styles.pattern}><NexusWelcomePattern /></View>
      <View style={styles.content}>
        <RadhaKrishnaWelcomeArt width={330} height={270} />
        <Text accessibilityRole="header" style={styles.greeting}>जय श्रीकृष्ण</Text>
        <Text style={styles.subtitle}>Nexus Plus</Text>
        <Text accessibilityLiveRegion="polite" style={styles.hint}>Welcome</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#120B24', overflow: 'hidden' },
  pattern: { ...StyleSheet.absoluteFillObject },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  greeting: { marginTop: 18, color: '#FDE68A', fontSize: 38, lineHeight: 48, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { marginTop: 8, color: '#FFFFFF', fontSize: 18, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.4 },
  hint: { marginTop: 18, color: '#E5E7EB', fontSize: 12, fontFamily: 'Inter_400Regular' },
});
