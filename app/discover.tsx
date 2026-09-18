import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const DAILY_QUOTES = [
  'Small improvements become powerful habits when repeated every day.',
  'Technology is most useful when it makes difficult things simpler and more accessible.',
  'A clear mind and a clear system both benefit from good organization.',
  'Build patiently. Test honestly. Keep improving.',
];

const DISCOVER_SECTIONS = [
  {
    title: 'Daily Thought',
    icon: 'sun',
    description: 'A short thought for reflection and focus.',
    type: 'quote',
  },
  {
    title: 'Did You Know?',
    icon: 'help-circle',
    description: 'Interesting technology, science and space facts.',
    type: 'fact',
  },
  {
    title: 'Nexus Tips',
    icon: 'zap',
    description: 'Small productivity and accessibility tips for using Nexus Plus.',
    type: 'tip',
  },
];

const FACTS = [
  'A QR code can store structured text, links, contact information and many other payloads.',
  'Space telescopes can observe objects whose light began its journey millions or billions of years ago.',
  'Accessible interfaces benefit from clear labels, predictable navigation and strong semantic focus order.',
];

const TIPS = [
  'Use the Nexus Assistant Attach button when you want a tool to remain visible without opening another menu.',
  'Keep important files in clearly named folders so file-based tools are easier to use with screen readers.',
  'When AI produces structured data, verify sensitive identifiers before generating or saving an artifact.',
];

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    setQuoteIndex(new Date().getDate() % DAILY_QUOTES.length);
    setFactIndex(new Date().getDay() % FACTS.length);
    setTipIndex(new Date().getDate() % TIPS.length);
  }, []);

  const refresh = () => {
    setQuoteIndex((value) => (value + 1) % DAILY_QUOTES.length);
    setFactIndex((value) => (value + 1) % FACTS.length);
    setTipIndex((value) => (value + 1) % TIPS.length);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 30 }}>
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="sparkles" size={28} color={colors.primary} /></View>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus Discover</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>A separate space for daily ideas, facts and accessible Nexus insights—not another tools screen.</Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="sun" size={20} color={colors.primary} /></View>
            <View style={styles.copy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Daily Thought</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>A simple idea for reflection, focus or motivation.</Text></View>
          </View>
          <Text style={[styles.contentText, { color: colors.foreground }]}>{DAILY_QUOTES[quoteIndex]}</Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="help-circle" size={20} color={colors.primary} /></View>
            <View style={styles.copy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Did You Know?</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Interesting science, technology and space facts.</Text></View>
          </View>
          <Text style={[styles.contentText, { color: colors.foreground }]}>{FACTS[factIndex]}</Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="zap" size={20} color={colors.primary} /></View>
            <View style={styles.copy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Nexus Tips</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Practical tips for productivity and accessibility.</Text></View>
          </View>
          <Text style={[styles.contentText, { color: colors.foreground }]}>{TIPS[tipIndex]}</Text>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Refresh Discover content" onPress={refresh} style={[styles.refreshButton, { backgroundColor: colors.primary }]}>
          <Feather name="refresh-cw" size={18} color={colors.primaryForeground} />
          <Text style={[styles.refreshText, { color: colors.primaryForeground }]}>Refresh Discover</Text>
        </Pressable>

        <View style={[styles.noteCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="info" size={18} color={colors.primary} />
          <Text style={[styles.body, { color: colors.foreground }]}>All application tools remain available from Home and their dedicated screens. Discover is intentionally content-focused.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { alignItems: 'center', paddingVertical: 14 },
  heroIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginTop: 12 },
  subtitle: { fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 350, marginTop: 5 },
  featureCard: { minHeight: 150, borderWidth: 1, borderRadius: 18, padding: 15, marginTop: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 11 },
  cardTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  body: { fontSize: 11, lineHeight: 16 },
  contentText: { fontSize: 14, lineHeight: 21, marginTop: 16 },
  refreshButton: { minHeight: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  refreshText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  noteCard: { minHeight: 66, borderWidth: 1, borderRadius: 16, padding: 13, marginTop: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
});
