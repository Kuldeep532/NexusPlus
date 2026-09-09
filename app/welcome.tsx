import { Feather } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { acceptCctvPolicy, completeWelcome, hasAcceptedCctvPolicy } from '@/features/app-shell/onboardingPreferences';
import { NexusBrandMark } from '@/features/branding/NexusBrandMark';

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [accepted, setAccepted] = useState(false);
  const [cctvPolicyAccepted, setCctvPolicyAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    void hasAcceptedCctvPolicy().then(setCctvPolicyAccepted);
  }, []);

  const continueToLogin = async () => {
    if (!accepted || cctvPolicyAccepted !== true) return;
    await completeWelcome();
    router.replace('/login-plus-register');
  };

  const acceptCctvUsePolicy = async () => {
    setAccepted(true);
    await acceptCctvPolicy();
    setCctvPolicyAccepted(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}> 
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <NexusBrandMark size={120} />
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Welcome to Nexus Plus</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Accessible everyday tools with security and responsible-use safeguards.</Text>

        {cctvPolicyAccepted !== true && (
          <View accessibilityRole="alert" style={[styles.noticeCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <View style={styles.noticeHeader}>
              <Feather name="shield" size={22} color={colors.primary} />
              <Text style={[styles.noticeTitle, { color: colors.foreground }]}>CCTV Responsible-Use Notice</Text>
            </View>
            <Text style={[styles.noticeText, { color: colors.foreground }]}>Please use Nexus Plus CCTV tools only with cameras, DVRs, NVRs and connected devices that you own or are expressly authorized to use.</Text>
            <Text style={[styles.noticeText, { color: colors.foreground }]}>Do not monitor, record, access, control, erase or alter a third-party camera without lawful authorization. Nexus Plus does not provide surveillance rights.</Text>
            <Text style={[styles.noticeText, { color: colors.foreground }]}>Unauthorized use may result in account or feature restrictions and security review. Where reliable evidence of misuse is available, we may begin appropriate action as soon as reasonably practicable, including within 24 hours where operationally feasible.</Text>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: accepted }}
              accessibilityLabel="I understand and agree to use CCTV tools only with cameras I own or am authorized to use"
              onPress={() => void acceptCctvUsePolicy()}
              style={styles.noticeAccept}
            >
              <View style={[styles.checkbox, { borderColor: accepted ? colors.primary : colors.border, backgroundColor: accepted ? colors.primary : colors.background }]}>
                {accepted && <Feather name="check" size={14} color={colors.primaryForeground} />}
              </View>
              <Text style={[styles.acceptText, { color: colors.foreground }]}>I understand and agree to use CCTV tools only with cameras I own or am authorized to use.</Text>
            </Pressable>
          </View>
        )}

        {cctvPolicyAccepted === true && (
          <View accessibilityRole="text" style={[styles.acceptedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="check-circle" size={20} color={colors.primary} />
            <Text style={[styles.acceptedText, { color: colors.foreground }]}>CCTV responsible-use notice accepted. You can review it again later in Settings and the Privacy Policy.</Text>
          </View>
        )}

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          accessibilityLabel="Accept Privacy Policy and Terms and Conditions"
          onPress={() => setAccepted((value) => !value)}
          style={styles.acceptRow}
        >
          <View style={[styles.checkbox, { borderColor: accepted ? colors.primary : colors.border, backgroundColor: accepted ? colors.primary : colors.card }]}>
            {accepted && <Feather name="check" size={14} color={colors.primaryForeground} />}
          </View>
          <Text style={[styles.acceptText, { color: colors.foreground }]}>I accept the Privacy Policy and Terms and Conditions.</Text>
        </Pressable>

        <View style={styles.links}>
          <Link href="/privacy-policy" asChild>
            <Pressable accessibilityRole="link"><Text style={[styles.linkText, { color: colors.primary }]}>Privacy Policy</Text></Pressable>
          </Link>
          <Text style={[styles.separator, { color: colors.mutedForeground }]}>•</Text>
          <Link href="/terms-and-conditions" asChild>
            <Pressable accessibilityRole="link"><Text style={[styles.linkText, { color: colors.primary }]}>Terms and Conditions</Text></Pressable>
          </Link>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Get started"
            accessibilityState={{ disabled: !accepted || cctvPolicyAccepted !== true }}
            disabled={!accepted || cctvPolicyAccepted !== true}
            onPress={() => void continueToLogin()}
            style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: accepted && cctvPolicyAccepted === true ? 1 : 0.45 }]}
          >
            <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Get Started</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Login with Google"
            accessibilityHint="Continue to Google login"
            disabled={!accepted || cctvPolicyAccepted !== true}
            onPress={() => void continueToLogin()}
            style={[styles.googleButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: accepted && cctvPolicyAccepted === true ? 1 : 0.45 }]}
          >
            <Feather name="globe" size={17} color={colors.foreground} />
            <Text style={[styles.googleText, { color: colors.foreground }]}>Login with Google</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 22 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 22, gap: 12 },
  title: { fontSize: 28, lineHeight: 34, textAlign: 'center', fontFamily: 'Inter_700Bold', marginTop: 8 },
  subtitle: { maxWidth: 340, fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: 10 },
  noticeCard: { width: '100%', maxWidth: 380, borderWidth: 1.5, borderRadius: 18, padding: 16, gap: 10 },
  noticeHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  noticeTitle: { flex: 1, fontSize: 16, fontFamily: 'Inter_700Bold' },
  noticeText: { fontSize: 12, lineHeight: 18 },
  noticeAccept: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingTop: 4 },
  acceptedCard: { width: '100%', maxWidth: 380, borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  acceptedText: { flex: 1, fontSize: 11, lineHeight: 17 },
  acceptRow: { width: '100%', maxWidth: 360, flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  checkbox: { width: 22, height: 22, borderWidth: 1.5, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  acceptText: { flex: 1, fontSize: 13, lineHeight: 20 },
  links: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  linkText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  separator: { fontSize: 12 },
  actions: { width: '100%', maxWidth: 360, gap: 10, marginTop: 12 },
  primaryButton: { minHeight: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  googleButton: { minHeight: 52, borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' },
  googleText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});
