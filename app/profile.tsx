import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/features/auth/useAuth';

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const user = auth.session?.user;
  const initials = (user?.displayName || user?.email || 'N').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  const signOut = async () => {
    await auth.signOut();
    router.replace('/login-plus-register');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to Home" onPress={() => router.replace('/(tabs)')} style={styles.iconButton}><Feather name="arrow-left" size={21} color={colors.foreground} /></Pressable>
          <Text accessibilityRole="header" style={[styles.headerTitle, { color: colors.foreground }]}>Google Account</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Open Settings" onPress={() => router.push('/settings')} style={styles.iconButton}><Feather name="settings" size={20} color={colors.foreground} /></Pressable>
        </View>

        <View style={styles.accountHero}>
          {user?.photoUrl ? <Image source={{ uri: user.photoUrl }} contentFit="cover" style={styles.avatar} accessibilityLabel="Account profile photo" /> : <View style={[styles.avatar, { backgroundColor: colors.secondary }]} accessible accessibilityLabel={`Account avatar ${initials}`}><Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text></View>}
          <Text style={[styles.name, { color: colors.foreground }]}>{user?.displayName || 'Nexus Plus user'}</Text>
          <Text style={[styles.email, { color: colors.mutedForeground }]}>{user?.email || 'Signed-in account'}</Text>
          <Text style={[styles.provider, { color: colors.primary }]}>{user?.provider === 'google' ? 'Signed in with Google' : 'Signed in with email'}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your account</Text>
          <ProfileRow title="Account ID" value={user?.uid || 'Available after authentication'} colors={colors} />
          <ProfileRow title="Cloud data" value="User-owned and protected by backend policies." colors={colors} />
          <ProfileRow title="Financial data" value="Protected by the existing biometric security boundary." colors={colors} />
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Open Settings" onPress={() => router.push('/settings')} style={[styles.action, { backgroundColor: colors.secondary, borderColor: colors.border }]}><Feather name="settings" size={18} color={colors.foreground} /><Text style={[styles.actionText, { color: colors.foreground }]}>Settings</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Sign out" accessibilityState={{ disabled: auth.busy }} disabled={auth.busy} onPress={() => void signOut()} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="log-out" size={18} color={colors.foreground} /><Text style={[styles.actionText, { color: colors.foreground }]}>{auth.busy ? 'Signing out…' : 'Sign out'}</Text></Pressable>
      </ScrollView>
    </View>
  );
}

function ProfileRow({ title, value, colors }: { title: string; value: string; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.row}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { paddingHorizontal: 18 }, topBar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' }, accountHero: { alignItems: 'center', paddingVertical: 22 }, avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' }, initials: { fontSize: 30, fontFamily: 'Inter_700Bold' }, name: { marginTop: 14, fontSize: 21, fontFamily: 'Inter_700Bold' }, email: { marginTop: 4, fontSize: 12 }, provider: { marginTop: 8, fontSize: 11, fontFamily: 'Inter_700Bold' }, card: { borderWidth: 1, borderRadius: 18, padding: 16 }, sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 6 }, row: { paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#999' }, rowTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 3 }, body: { fontSize: 11, lineHeight: 16 }, action: { minHeight: 48, borderWidth: 1, borderRadius: 14, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, actionText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
});
