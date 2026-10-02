import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { useColors } from '@/hooks/useColors';
import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';
import { SUPABASE_URL } from '@/features/auth/authConfig';
import { getUserFriendlyMessage } from '@/features/ui/userFriendlyError';
import { useAuth } from '@/features/auth/useAuth';

const APP_STORE_ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.nexuswavetech.nexusplus';
const CONTACT_EMAIL = 'info@nexusweb.co.in';

async function sendFeedbackToSupabase(input: { title: string; name: string; message: string }) {
  const token = await getSupabaseAccessToken();
  const key = (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)?.trim() ?? '';
  if (!token || !SUPABASE_URL || !key) throw new Error('SUPABASE_AUTH_NOT_CONFIGURED');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-feedback`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: input.title.trim(),
      name: input.name.trim(),
      message: input.message.trim(),
    }),
  });

  if (!response.ok) throw new Error('FEEDBACK_SUBMIT_FAILED');
}

async function sendFeedbackEmail(input: { title: string; name: string; message: string; email?: string | null }) {
  const subject = `Nexus Plus Feedback: ${input.title.trim()}`;
  const body = [
    `Name: ${input.name.trim()}`,
    `Email: ${input.email?.trim() || 'Not provided'}`,
    '',
    input.message.trim(),
  ].join('\\n');
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  await Linking.openURL(mailto);
}

export default function SendFeedbackScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const user = auth.session?.user;

  const [title, setTitle] = useState('');
  const [name, setName] = useState(user?.displayName || '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const openFeedbackDestination = async () => {
    setBusy(true);
    try {
      // Android store installs can use the public listing directly.
      // Outside the store, the user gets the same feedback form with a mail handoff.
      if (Platform.OS === 'android') {
        const canOpenStore = await Linking.canOpenURL(APP_STORE_ANDROID_URL);
        if (canOpenStore) {
          await Linking.openURL(APP_STORE_ANDROID_URL);
          return;
        }
      }
      throw new Error('STORE_NOT_AVAILABLE');
    } catch {
      await sendFeedbackEmail({ title, name, message, email: user?.email });
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    const cleanTitle = title.trim();
    const cleanName = name.trim();
    const cleanMessage = message.trim();

    if (!cleanTitle) return Alert.alert('Add a title', 'Please tell us what your feedback is about.');
    if (!cleanName) return Alert.alert('Add your name', 'Please enter your name.');
    if (!cleanMessage) return Alert.alert('Write your message', 'Please enter your feedback before sending.');
    if (cleanMessage.length > 5000) return Alert.alert('Message is too long', 'Please keep your feedback under 5,000 characters.');

    setBusy(true);
    try {
      await sendFeedbackToSupabase({ title: cleanTitle, name: cleanName, message: cleanMessage });
      Alert.alert('Feedback sent', 'Thank you. Your feedback has been received.');
      setTitle('');
      setMessage('');
    } catch (error) {
      Alert.alert('Could not send feedback', getUserFriendlyMessage(error, 'Please try again later.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconButton}>
            <Feather name="arrow-left" size={21} color={colors.foreground} />
          </Pressable>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Send Feedback</Text>
          <View style={styles.iconButton} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Share an idea, report a problem, or tell us how Nexus Plus can be better.
          </Text>

          <Field label="Title" value={title} onChangeText={setTitle} placeholder="What is your feedback about?" colors={colors} />
          <Field label="Your name" value={name} onChangeText={setName} placeholder="Your name" colors={colors} autoCapitalize="words" />
          <Field label="Message" value={message} onChangeText={setMessage} placeholder="Write your feedback here…" colors={colors} multiline />

          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void submit()} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}>
            <Feather name="send" size={18} color={colors.onPrimary} />
            <Text style={[styles.primaryText, { color: colors.onPrimary }]}>{busy ? 'Sending…' : 'Send Feedback'}</Text>
          </Pressable>

          <View style={[styles.divider, { borderTopColor: colors.border }]} />

          <Text style={[styles.optionTitle, { color: colors.foreground }]}>Store feedback</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            When the Play Store listing is available, you can open it directly. Otherwise, your feedback can be prepared in your email app.
          </Text>

          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void openFeedbackDestination()} style={[styles.secondaryButton, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: busy ? 0.6 : 1 }]}>
            <Feather name="star" size={18} color={colors.foreground} />
            <Text style={[styles.secondaryText, { color: colors.foreground }]}>Open Store / Email</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  colors: ReturnType<typeof useColors>;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: props.colors.foreground }]}>{props.label}</Text>
      <TextInput
        accessible
        accessibilityLabel={props.label}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={props.colors.mutedForeground}
        multiline={props.multiline}
        autoCapitalize={props.autoCapitalize}
        textAlignVertical={props.multiline ? 'top' : 'center'}
        style={[styles.input, { color: props.colors.foreground, backgroundColor: props.colors.background, borderColor: props.colors.border }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 18 },
  topBar: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 19, fontFamily: 'Inter_700Bold' },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 10 },
  subtitle: { fontSize: 13, lineHeight: 20, marginBottom: 18 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, fontSize: 14 },
  primaryButton: { minHeight: 50, borderRadius: 14, marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, marginVertical: 20 },
  optionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  body: { fontSize: 12, lineHeight: 18 },
  secondaryButton: { minHeight: 48, borderWidth: 1, borderRadius: 14, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});
