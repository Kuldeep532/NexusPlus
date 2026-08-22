import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getDailySpiritualMessage } from '@/features/spiritual/spiritualMessageLibrary';

const featuredTools = [
  { title: 'Biometric Vault', description: 'Protect sensitive data.', route: '/biometric-vault', icon: 'shield' as const },
  { title: 'Payment Announcer', description: 'Secure payment announcements.', route: '/payment-announcer', icon: 'volume-2' as const },
  { title: 'Expense Tracker', description: 'Track and review expenses securely.', route: '/expense-tracker', icon: 'credit-card' as const },
  { title: 'Geeta Nexus', description: 'Explore Bhagavad Gita chapters, verses and audio.', route: '/geeta-nexus', icon: 'book' as const },
  { title: 'Book Reader', description: 'Read books and documents.', route: '/reader', icon: 'book-open' as const },
  { title: 'Media Player', description: 'Play your audio and media.', route: '/media-player', icon: 'play-circle' as const },
  { title: 'Video Editor', description: 'Edit and export videos.', route: '/video-editor', icon: 'video' as const },
];

const categories = [
  { title: 'Utility Tools', description: 'Clock, time and announcer utilities.', route: '/categories/utility-tools', icon: 'clock' as const },
  { title: 'PDF Tools', description: 'Convert, protect and manage PDFs.', route: '/categories/pdf-tools', icon: 'file-text' as const },
  { title: 'Media Tools', description: 'Audio, radio and video tools.', route: '/categories/media-tools', icon: 'film' as const },
];

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dailyMessage = getDailySpiritualMessage();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 92 }]}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.brand, { color: colors.foreground }]}>Nexus Plus</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Home</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Your tools, organised and easy to reach.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/profile')} style={[styles.profileButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="user" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]} accessible accessibilityRole="summary">
          <Feather name="sunrise" size={21} color={colors.primary} />
          <View style={styles.messageCopy}>
            <Text style={[styles.messageLabel, { color: colors.primary }]}>SPIRITUAL SUNDAYS</Text>
            <Text style={[styles.message, { color: colors.foreground }]}>{dailyMessage.text}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top-level features</Text>
        <View style={styles.list}>
          {featuredTools.map((tool) => (
            <Pressable key={tool.route} accessibilityRole="button" accessibilityLabel={`${tool.title}. ${tool.description}`} onPress={() => router.push(tool.route as never)} style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.toolIcon, { backgroundColor: colors.secondary }]}><Feather name={tool.icon} size={20} color={colors.primary} /></View>
              <View style={styles.toolCopy}><Text style={[styles.toolTitle, { color: colors.foreground }]}>{tool.title}</Text><Text style={[styles.toolDescription, { color: colors.mutedForeground }]}>{tool.description}</Text></View>
              <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 18 }]}>Tool categories</Text>
        <View style={styles.list}>
          {categories.map((category) => (
            <Pressable key={category.route} accessibilityRole="button" accessibilityLabel={`${category.title}. ${category.description}`} onPress={() => router.push(category.route as never)} style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.toolIcon, { backgroundColor: colors.secondary }]}><Feather name={category.icon} size={20} color={colors.primary} /></View>
              <View style={styles.toolCopy}><Text style={[styles.toolTitle, { color: colors.foreground }]}>{category.title}</Text><Text style={[styles.toolDescription, { color: colors.mutedForeground }]}>{category.description}</Text></View>
              <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Home" style={styles.tab} onPress={() => router.replace('/home' as never)}><Feather name="home" size={20} color={colors.primary} /><Text style={[styles.tabLabel, { color: colors.primary }]}>Home</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" style={styles.tab} onPress={() => router.push('/settings')}><Feather name="settings" size={20} color={colors.foreground} /><Text style={[styles.tabLabel, { color: colors.foreground }]}>Settings</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  headerCopy: { flex: 1, paddingRight: 16 },
  brand: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  profileButton: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  messageCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  messageCopy: { flex: 1, marginLeft: 10 },
  messageLabel: { fontSize: 9, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  message: { fontSize: 12.5, lineHeight: 18, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  list: { gap: 10 },
  toolCard: { minHeight: 76, borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center' },
  categoryCard: { minHeight: 70, borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center' },
  toolIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  toolCopy: { flex: 1, marginLeft: 12, marginRight: 8 },
  toolTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  toolDescription: { fontSize: 11, lineHeight: 16 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 64, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 },
  tab: { alignItems: 'center', justifyContent: 'center', minWidth: 90, gap: 3 },
  tabLabel: { fontSize: 10, fontFamily: 'Inter_700Bold' },
});
