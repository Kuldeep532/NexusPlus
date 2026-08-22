import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useExpenseTracker } from '@/features/expense-tracker/useExpenseTracker';
import { EXPENSE_CATEGORY_LABELS } from '@/features/expense-tracker/expenseTrackerTypes';

export default function ExpenseTrackerInsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const expense = useExpenseTracker(null);
  const totals = new Map<string, number>();
  for (const item of expense.expenses) totals.set(item.category, (totals.get(item.category) ?? 0) + item.amountMinor);
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  return <View style={[styles.root,{backgroundColor:colors.background}]}>
    <Stack.Screen options={{title:'Insights',headerShown:true}} />
    <ScrollView contentContainerStyle={{padding:20,paddingBottom:insets.bottom+24}}>
      <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Expense insights</Text>
      <Text style={[styles.body,{color:colors.mutedForeground}]}>Totals are calculated locally from the unlocked expense set. Merchant patterns can be improved in later stages.</Text>
      {sorted.length === 0 ? <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={[styles.cardTitle,{color:colors.foreground}]}>No expenses yet</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>Add or detect expenses to see category totals.</Text></View> : sorted.map(([category, amount]) => <View key={category} style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={[styles.cardTitle,{color:colors.foreground}]}>{EXPENSE_CATEGORY_LABELS[category as keyof typeof EXPENSE_CATEGORY_LABELS]}</Text><Text style={[styles.amount,{color:colors.foreground}]}>{expense.expenses.find((item)=>item.category===category)?.currency ?? 'INR'} {(amount/100).toFixed(2)}</Text></View>)}
    </ScrollView>
  </View>;
}
const styles=StyleSheet.create({root:{flex:1},title:{fontSize:24,fontFamily:'Inter_700Bold',marginBottom:8},body:{fontSize:12,lineHeight:18},card:{borderRadius:16,borderWidth:1,padding:15,marginTop:12},cardTitle:{fontSize:13,fontFamily:'Inter_700Bold',marginBottom:5},amount:{fontSize:21,fontFamily:'Inter_700Bold'}});
