import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { loadAuthenticatedUser } from '@/features/auth/authSession';
import type { NexusUserProfile } from '@/features/auth/authTypes';

type Feature = { key: string; title: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; route: string };

const features: Feature[] = [
  { key: 'reader', title: 'Book Reader', icon: 'book-open-page-variant', route: '/reader' },
  { key: 'media', title: 'Media Player', icon: 'play-box-multiple', route: '/media-player' },
  { key: 'vault', title: 'Biometric Vault', icon: 'shield-lock', route: '/biometric-vault' },
  { key: 'selfie', title: 'Selfie', icon: 'camera-front', route: '/selfie' },
  { key: 'utilities', title: 'Utilities', icon: 'tools', route: '/utilities' },
  { key: 'pdf-tools', title: 'PDF Tools', icon: 'file-pdf-box', route: '/pdf-tools' },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<NexusUserProfile | null>(null);

  useEffect(() => {
    let active = true;
    void loadAuthenticatedUser().then((profile) => {
      if (active) setUser(profile);
    });
    return () => { active = false; };
  }, []);

  const displayName = user?.displayName?.trim() || 'Nexus Plus';
  const avatarText = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'N';

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.kicker, { color: colors.primary }]}>NEXUS PLUS</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Home</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Signed in as ${displayName}. Open profile`} onPress={() => router.push('/profile' as never)} style={({ pressed }) => [styles.accountButton, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{avatarText}</Text></View>
          <View style={styles.accountTextWrap}><Text style={[styles.signedInLabel, { color: colors.mutedForeground }]}>Signed in as</Text><Text numberOfLines={1} style={[styles.accountName, { color: colors.foreground }]}>{displayName}</Text></View>
          <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <View style={styles.list}>
        {features.map((feature) => (
          <Pressable key={feature.key} accessibilityRole="button" accessibilityLabel={`Open ${feature.title}`} onPress={() => router.push(feature.route as never)} style={({ pressed }) => [styles.row, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name={feature.icon} size={23} color={colors.primary} /></View>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{feature.title}</Text>
            <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { paddingHorizontal: 20, marginBottom: 22, gap: 12 }, headerCopy: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, kicker: { fontSize: 10, letterSpacing: 2, fontFamily: 'Inter_700Bold' }, title: { fontSize: 32, fontFamily: 'Inter_700Bold' }, accountButton: { minHeight: 58, borderRadius: 17, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }, avatar: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, accountTextWrap: { flex: 1 }, signedInLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 2 }, accountName: { fontSize: 13, fontFamily: 'Inter_700Bold' }, list: { paddingHorizontal: 20, gap: 10 }, row: { minHeight: 70, borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' }, icon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, rowTitle: { flex: 1, marginHorizontal: 13, fontSize: 14, fontFamily: 'Inter_700Bold' }, pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
});
