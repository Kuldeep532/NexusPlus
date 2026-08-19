import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { clearAuthenticatedUser, loadAuthenticatedUser } from '@/features/auth/authSession';
import type { NexusUserProfile } from '@/features/auth/authTypes';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<NexusUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setUser(await loadAuthenticatedUser());
      setLoading(false);
    })();
  }, []);

  async function signOut() {
    await clearAuthenticatedUser();
    router.replace('/welcome' as never);
  }

  if (loading) {
    return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  const initials = (user?.displayName || 'N').trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'N';

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }}>
      <Stack.Screen options={{ title: 'Profile' }} />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()}><Feather name="arrow-left" size={22} color={colors.foreground} /></Pressable>
        <Text accessibilityRole="header" style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.hero}>
        <View accessible accessibilityLabel={`Profile photo for ${user?.displayName || 'signed in user'}`} style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>{user?.displayName || 'Signed-in user'}</Text>
        <Text style={[styles.signedIn, { color: colors.mutedForeground }]}>Signed in with Google</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}><MaterialCommunityIcons name="account-circle-outline" size={21} color={colors.primary} /><View style={styles.copy}><Text style={[styles.label, { color: colors.mutedForeground }]}>Name</Text><Text style={[styles.value, { color: colors.foreground }]}>{user?.displayName || 'Not available'}</Text></View></View>
        <View style={styles.row}><MaterialCommunityIcons name="email-outline" size={21} color={colors.primary} /><View style={styles.copy}><Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text><Text style={[styles.value, { color: colors.foreground }]}>{user?.email || 'Not available'}</Text></View></View>
        <View style={styles.row}><MaterialCommunityIcons name="shield-check-outline" size={21} color={colors.primary} /><View style={styles.copy}><Text style={[styles.label, { color: colors.mutedForeground }]}>Sign-in method</Text><Text style={[styles.value, { color: colors.foreground }]}>Google</Text></View></View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open account security" style={styles.action}><MaterialCommunityIcons name="shield-lock-outline" size={22} color={colors.primary} /><View style={styles.copy}><Text style={[styles.value, { color: colors.foreground }]}>Account & Security</Text><Text style={[styles.description, { color: colors.mutedForeground }]}>Review sign-in and device security settings.</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Sign out" onPress={signOut} style={styles.action}><MaterialCommunityIcons name="logout" size={22} color={colors.destructive} /><View style={styles.copy}><Text style={[styles.value, { color: colors.destructive }]}>Sign out</Text><Text style={[styles.description, { color: colors.mutedForeground }]}>Remove this signed-in session from the device.</Text></View></Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center' }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }, headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' }, hero: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 24 }, avatar: { width: 88, height: 88, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, avatarText: { fontSize: 30, fontFamily: 'Inter_700Bold' }, name: { fontSize: 24, fontFamily: 'Inter_700Bold', textAlign: 'center' }, signedIn: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 5 }, card: { marginHorizontal: 20, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, marginBottom: 22 }, row: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(127,127,127,0.14)' }, row:lastChild: { borderBottomWidth: 0 }, copy: { flex: 1 }, label: { fontSize: 10, fontFamily: 'Inter_500Medium', marginBottom: 4 }, value: { fontSize: 14, fontFamily: 'Inter_700Bold' }, sectionTitle: { marginHorizontal: 20, marginBottom: 10, fontSize: 14, fontFamily: 'Inter_700Bold' }, action: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12 }, description: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular', marginTop: 3 }, });
