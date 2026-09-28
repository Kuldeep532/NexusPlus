import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function ManageSubscriptionScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={styles.hero}>
          <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
            <Feather name="credit-card" size={24} color={colors.primary} />
          </View>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Premium billing is temporarily unavailable</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Subscription purchases, renewals, and AI credit top-ups are disabled until a payment gateway is available.
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Existing free AI tools and free app features remain available.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 18 },
  back: { width: 44, height: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  icon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 23, lineHeight: 30, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  body: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 12 },
});
