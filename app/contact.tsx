import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const SUPPORT_EMAIL = 'info@nexusweb.co.in';
const WEBSITE = 'https://nexusweb.co.in';
const WHATSAPP = 'https://wa.me/?text=' + encodeURIComponent('Hello Nexus Wave Technologies, I need help with Nexus Plus.');

export default function ContactScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openEmail = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Nexus Plus Support')}`;
    try { await Linking.openURL(url); } catch { Alert.alert('Email unavailable', 'Please email info@nexusweb.co.in from your mail app.'); }
  };

  const openWebsite = async () => {
    try { await Linking.openURL(WEBSITE); } catch { Alert.alert('Website unavailable', 'Please visit nexusweb.co.in in your browser.'); }
  };

  const openWhatsApp = async () => {
    try { await Linking.openURL(WHATSAPP); } catch { Alert.alert('WhatsApp unavailable', 'Please contact us by email instead.'); }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconButton}>
            <Feather name="arrow-left" size={21} color={colors.foreground} />
          </Pressable>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Contact Us</Text>
          <View style={styles.iconButton} />
        </View>

        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.heading, { color: colors.foreground }]}>We’re here to help</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            For account help, accessibility questions, feature support, feedback or general questions, choose the contact option that works best for you.
          </Text>
        </View>

        <ContactCard
          icon="mail"
          title="Email"
          description={SUPPORT_EMAIL}
          button="Email us"
          onPress={() => void openEmail()}
          colors={colors}
        />
        <ContactCard
          icon="globe"
          title="Website"
          description="nexusweb.co.in"
          button="Open website"
          onPress={() => void openWebsite()}
          colors={colors}
        />
        <ContactCard
          icon="message-circle"
          title="WhatsApp"
          description="Start a support conversation"
          button="Open WhatsApp"
          onPress={() => void openWhatsApp()}
          colors={colors}
        />
        <ContactCard
          icon="message-square"
          title="Send Feedback"
          description="Share a suggestion or report a problem"
          button="Send Feedback"
          onPress={() => router.push('/send-feedback')}
          colors={colors}
        />
      </ScrollView>
    </View>
  );
}

function ContactCard(props: {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  description: string;
  button: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.card, { backgroundColor: props.colors.card, borderColor: props.colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: props.colors.secondary }]}>
        <Feather name={props.icon} size={19} color={props.colors.foreground} />
      </View>
      <Text style={[styles.cardTitle, { color: props.colors.foreground }]}>{props.title}</Text>
      <Text style={[styles.body, { color: props.colors.mutedForeground }]}>{props.description}</Text>
      <Pressable accessibilityRole="button" onPress={props.onPress} style={[styles.button, { backgroundColor: props.colors.secondary, borderColor: props.colors.border }]}>
        <Text style={[styles.buttonText, { color: props.colors.foreground }]}>{props.button}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 12 },
  topBar: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 19, fontFamily: 'Inter_700Bold' },
  hero: { borderWidth: 1, borderRadius: 18, padding: 18 },
  heading: { fontSize: 21, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16 },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  body: { fontSize: 12, lineHeight: 18 },
  button: { minHeight: 46, borderWidth: 1, borderRadius: 12, marginTop: 13, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});
