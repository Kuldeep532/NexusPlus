import { Stack } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useColors } from '@/hooks/useColors';
import { useExpenseTracker } from '@/features/expense-tracker/useExpenseTracker';
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/features/expense-tracker/expenseTrackerTypes';

export default function ExpenseTrackerAddScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const expense = useExpenseTracker(null);
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | null>(null);

  const submit = async () => {
    const parsed = Number(amount.replace(/,/g, ''));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert('Expense Tracker', 'Enter a valid amount.');
      return;
    }
    const ok = await expense.addManualExpense({
      amountMinor: Math.round(parsed * 100),
      currency: 'INR',
      category,
      merchantName: merchant,
      note,
    });
    if (!ok) Alert.alert('Expense Tracker', expense.error ?? 'Unlock Expense Tracker before adding an expense.');
    else Alert.alert('Expense Tracker', 'Expense saved successfully.');
  };

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <Stack.Screen options={{ title: 'Add Expense', headerShown: true }} />
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Add expense</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>Manual entries are stored under your account boundary and remain protected by biometric access.</Text>
      <Text style={[styles.label, { color: colors.foreground }]}>Amount</Text>
      <TextInput accessibilityLabel="Expense amount in rupees" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} />
      <Text style={[styles.label, { color: colors.foreground }]}>Merchant or place</Text>
      <TextInput accessibilityLabel="Merchant or place" value={merchant} onChangeText={setMerchant} placeholder="e.g. grocery store" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} />
      <Text style={[styles.label, { color: colors.foreground }]}>Note</Text>
      <TextInput accessibilityLabel="Expense note" value={note} onChangeText={setNote} placeholder="Optional note" placeholderTextColor={colors.mutedForeground} style={[styles.input, styles.multiline, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} multiline />
      <Text style={[styles.label, { color: colors.foreground }]}>Category</Text>
      <View style={styles.categories}>
        {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((key) => <Pressable key={key} accessibilityRole="radio" accessibilityState={{ selected: category === key }} accessibilityLabel={`Category ${EXPENSE_CATEGORY_LABELS[key]}`} onPress={() => setCategory(key)} style={[styles.category, { backgroundColor: category === key ? colors.primary : colors.card, borderColor: colors.border }]}><Text style={[styles.categoryText, { color: category === key ? colors.primaryForeground : colors.foreground }]}>{EXPENSE_CATEGORY_LABELS[key]}</Text></Pressable>)}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Save expense" onPress={() => void submit()} style={[styles.primary, { backgroundColor: colors.primary }]}><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Save expense</Text></Pressable>
    </ScrollView>
  </View>;
}

const styles=StyleSheet.create({root:{flex:1},title:{fontSize:24,fontFamily:'Inter_700Bold',marginBottom:8},body:{fontSize:12,lineHeight:18},label:{fontSize:12,fontFamily:'Inter_700Bold',marginTop:18,marginBottom:7},input:{minHeight:48,borderRadius:13,borderWidth:1,paddingHorizontal:14,fontSize:13},multiline:{minHeight:88,paddingTop:12,textAlignVertical:'top'},categories:{gap:8},category:{minHeight:44,borderRadius:12,borderWidth:1,paddingHorizontal:12,justifyContent:'center'},categoryText:{fontSize:11,fontFamily:'Inter_700Bold'},primary:{minHeight:48,borderRadius:14,marginTop:18,alignItems:'center',justifyContent:'center'},primaryText:{fontSize:12,fontFamily:'Inter_700Bold'}});
