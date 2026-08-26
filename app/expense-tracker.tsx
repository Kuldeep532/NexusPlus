import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useExpenseTracker } from '@/features/expense-tracker/useExpenseTracker';
import { EXPENSE_CATEGORY_LABELS } from '@/features/expense-tracker/expenseTrackerTypes';

export default function ExpenseTrackerScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const expense = useExpenseTracker(null);

  if (!expense.isReady) {
    return <View style={[styles.root, { backgroundColor: colors.background }]} accessible accessibilityLabel="Loading Expense Tracker security" />;
  }

  const totalMinor = expense.expenses.reduce((sum, item) => sum + item.amountMinor, 0);
  const currency = expense.expenses[0]?.currency ?? 'INR';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 36 }]}>
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: colors.primary }]}>SECURE FINANCES</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Expense Tracker</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Track expenses automatically or add them manually, with biometric protection for your financial data.</Text>
        </View>

        <View style={[styles.securityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.securityIcon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="shield-lock" size={27} color={colors.primary} /></View>
          <View style={styles.copy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{expense.isUnlocked ? 'Expense Tracker unlocked' : 'Biometric protected'}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Strong biometric authentication is required. Device PIN/password fallback is disabled.</Text></View>
        </View>

        {!expense.isUnlocked ? (
          <View style={[styles.lockCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Unlock to view your expenses</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>Expense amounts, merchant details, notes, and synced financial data stay behind the biometric gate.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Unlock Expense Tracker with biometric" onPress={() => void expense.unlock().then((ok) => { if (!ok && expense.error) Alert.alert('Expense Tracker', expense.error); })} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Feather name="fingerprint" size={17} color={colors.primaryForeground} /><Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Unlock with biometric</Text></Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.totalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Tracked expenses</Text>
              <Text style={[styles.totalValue, { color: colors.foreground }]}>{currency} {(totalMinor / 100).toFixed(2)}</Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>{expense.expenses.length} recorded expense{expense.expenses.length === 1 ? '' : 's'}</Text>
            </View>

            <ActionCard icon="plus-circle" title="Add expense" description="Manually enter amount, category, merchant, and note." onPress={() => router.push('/expense-tracker/add')} colors={colors} />
            <ActionCard icon="zap" title="Automatic detection" description="Use trusted Payment Announcer events and a future SMS adapter to add expenses automatically." onPress={() => router.push('/expense-tracker/automatic')} colors={colors} />
            <ActionCard icon="grid" title="Categories" description={`${Object.keys(EXPENSE_CATEGORY_LABELS).length} financial categories with an Other / Saved fallback.`} onPress={() => router.push('/expense-tracker/categories')} colors={colors} />
            <ActionCard icon="bar-chart-2" title="Insights" description="See totals by category, merchant patterns, and saved transactions." onPress={() => router.push('/expense-tracker/insights')} colors={colors} />
            <ActionCard icon="cloud" title="Secure sync" description="Connect the same authenticated account to restore expenses from Supabase." onPress={() => router.push('/expense-tracker/sync')} colors={colors} />

            <Pressable accessibilityRole="button" accessibilityLabel="Lock Expense Tracker" onPress={() => void expense.lock()} style={[styles.lockButton, { borderColor: colors.border }]}><Feather name="lock" size={16} color={colors.foreground} /><Text style={[styles.lockButtonText, { color: colors.foreground }]}>Lock Expense Tracker</Text></Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ActionCard({ icon, title, description, onPress, colors }: { icon: React.ComponentProps<typeof Feather>['name']; title: string; description: string; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${description}`} onPress={onPress} style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.actionIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={20} color={colors.primary} /></View><View style={styles.copy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{description}</Text></View><Feather name="chevron-right" size={20} color={colors.mutedForeground} /></Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 12 },
  header: { marginBottom: 3 },
  kicker: { fontSize: 10, letterSpacing: 1.8, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  title: { fontSize: 29, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  subtitle: { fontSize: 12, lineHeight: 18 },
  securityCard: { borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center' },
  securityIcon: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 11, marginRight: 8 },
  cardTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  body: { fontSize: 11, lineHeight: 17 },
  lockCard: { borderRadius: 18, borderWidth: 1, padding: 16 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  primaryButton: { marginTop: 15, minHeight: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  totalCard: { borderRadius: 18, borderWidth: 1, padding: 17 },
  totalLabel: { fontSize: 11 },
  totalValue: { fontSize: 28, fontFamily: 'Inter_700Bold', marginTop: 4, marginBottom: 4 },
  actionCard: { minHeight: 78, borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center' },
  actionIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  lockButton: { minHeight: 46, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  lockButtonText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
});
