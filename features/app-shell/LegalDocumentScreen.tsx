import React from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Section = { title: string; body: string };
type Props = { title: string; subtitle: string; sections: Record<'en' | 'hi', Section[]> };

export function LegalDocumentScreen({ title, subtitle, sections }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [language, setLanguage] = React.useState<'en' | 'hi'>('en');
  const [languageOpen, setLanguageOpen] = React.useState(false);
  const activeSections = sections[language];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28 }}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <Pressable accessibilityRole="button" accessibilityLabel={language === 'en' ? 'Back' : 'वापस'} onPress={() => router.back()} style={styles.iconSlot}>
              <Feather name="arrow-left" size={21} color={colors.foreground} />
            </Pressable>
            <Text accessibilityRole="header" style={[styles.header, { color: colors.foreground }]}>{title}</Text>
            <View style={styles.iconSlot}><Feather name="shield" size={20} color={colors.primary} accessibilityElementsHidden /></View>
          </View>
          <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
            <Text style={[styles.updated, { color: colors.primary }]}>
              {language === 'en' ? 'Last updated: 25 September 2026' : 'अंतिम अपडेट: 25 सितंबर 2026'}
            </Text>
          </View>
          <View style={[styles.languageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.languageLabel, { color: colors.foreground }]}>{language === 'en' ? 'Language' : 'भाषा'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={language === 'en' ? 'Select language' : 'भाषा चुनें'} accessibilityState={{ expanded: languageOpen }} onPress={() => setLanguageOpen(v => !v)} style={[styles.languageButton, { borderColor: colors.border }]}>
              <Text style={[styles.languageButtonText, { color: colors.foreground }]}>{language === 'en' ? 'English' : 'हिंदी'}</Text>
              <Feather name={languageOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.foreground} />
            </Pressable>
            {languageOpen && (
              <View style={[styles.languageMenu, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Pressable accessibilityRole="button" accessibilityState={{ selected: language === 'en' }} onPress={() => { setLanguage('en'); setLanguageOpen(false); }} style={styles.languageOption}>
                  <Text style={[styles.languageOptionText, { color: colors.foreground }]}>English</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityState={{ selected: language === 'hi' }} onPress={() => { setLanguage('hi'); setLanguageOpen(false); }} style={styles.languageOption}>
                  <Text style={[styles.languageOptionText, { color: colors.foreground }]}>हिंदी</Text>
                </Pressable>
              </View>
            )}
          </View>
          {activeSections.map(section => (
            <View key={section.title} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{section.title}</Text>
              <Text selectable style={[styles.body, { color: colors.mutedForeground }]}>{section.body}</Text>
            </View>
          ))}
          <Text style={[styles.footer, { color: colors.mutedForeground }]}>
            {language === 'en' ? 'Nexus Plus • Nexus Wave Technologies • Founder: Kuldeep' : 'Nexus Plus • Nexus Wave Technologies • संस्थापक: Kuldeep'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 18 },
  topBar: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconSlot: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  header: { flex: 1, textAlign: 'center', fontSize: 20, fontFamily: 'Inter_700Bold' },
  hero: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 },
  subtitle: { fontSize: 13, lineHeight: 20 },
  updated: { marginTop: 10, fontSize: 11, fontFamily: 'Inter_700Bold' },
  languageCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 2 },
  languageLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  languageButton: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  languageButtonText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  languageMenu: { borderWidth: 1, borderRadius: 12, marginTop: 8, overflow: 'hidden' },
  languageOption: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 14 },
  languageOptionText: { fontSize: 14 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 12 },
  sectionTitle: { fontSize: 15, lineHeight: 21, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  body: { fontSize: 12, lineHeight: 19 },
  footer: { fontSize: 11, textAlign: 'center', marginTop: 22, marginBottom: 8 },
});
