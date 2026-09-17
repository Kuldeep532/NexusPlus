import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { VISION_ASSIST_CAPABILITIES } from '@/features/nexus-vision-assist/visionAssistCapabilities';
import { planVisionAssistIntent } from '@/features/nexus-vision-assist/visionAssistAgent';

export default function NexusVisionAssistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const runIntent = (text: string) => {
    const intent = planVisionAssistIntent(text);
    if (!intent) return;
    if (intent.capability.id === 'assist-captcha') return;
    if (intent.capability.id === 'describe-screen') {
      // Stage 1 exposes the action contract; the native AccessibilityService
      // transport is wired in the next stage so this screen never pretends to
      // have captured a screen when it has not.
    }
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}
    >
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
          <Feather name="eye" size={24} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus Vision Assist</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Accessibility-first agent for screen, image and video understanding.</Text>
        </View>
      </View>

      <View accessibilityLiveRegion="polite" style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.heading, { color: colors.foreground }]}>Stage 1 — Agent foundation</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Nexus Assistant remains the shared agent layer. Vision Assist adds vision and accessibility intents without bundling the full ElizaOS runtime.</Text>
      </View>

      <View style={styles.grid}>
        {[
          ['describe-screen', 'Describe Screen', 'Read exposed accessibility text and controls.'],
          ['describe-image', 'Describe Image', 'Describe a selected image with the configured vision engine.'],
          ['describe-video', 'Describe Video', 'Describe selected video content from sampled frames.'],
          ['navigate-accessibility-tree', 'Accessibility Navigation', 'Move through exposed controls with the agent.'],
        ].map(([id, title, description]) => (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityLabel={title}
            onPress={() => runIntent(title)}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.heading, { color: colors.foreground }]}>{title}</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>{description}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.heading, { color: colors.foreground }]}>Accessibility activation</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Enable the Nexus accessibility service in Android Accessibility settings before background assistance is enabled. Android's official accessibility shortcut will be preferred; hardware-key combinations are only supported where Android delivers those events to the service.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/settings')} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Open Nexus Settings</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.heading, { color: colors.foreground }]}>Safety boundary</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>CAPTCHA challenges can be identified and explained, including accessible alternatives. Automatic CAPTCHA solving or bypassing is not enabled.</Text>
      </View>

      <Text style={[styles.note, { color: colors.mutedForeground }]}>{VISION_ASSIST_CAPABILITIES.length} agent capabilities registered for the multi-stage rollout.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  body: { fontSize: 14, lineHeight: 21 },
  note: { fontSize: 12, marginTop: 12, lineHeight: 18 },
  grid: { gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  primaryButton: { marginTop: 14, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { fontWeight: '700' },
});
