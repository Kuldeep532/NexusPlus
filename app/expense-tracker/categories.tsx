import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/features/expense-tracker/expenseTrackerTypes';

export default function ExpenseTrackerCategoriesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return <View style={[styles.root,{backgroundColor:colors.background}]}>
    <Stack.Screen options={{title:'Categories',headerShown:true}} />
    <ScrollView contentContainerStyle={{padding:20,paddingBottom:insets.bottom+24}}>
      <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Expense categories</Text>
      <Text style={[styles.body,{color:colors.mutedForeground}]}>Automatic classification can suggest these categories; users can also choose one manually.</Text>
      {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((category)=><View key={category} style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={[styles.cardTitle,{color:colors.foreground}]}>{EXPENSE_CATEGORY_LABELS[category]}</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>{category === 'other' ? 'Fallback for transactions that cannot be confidently classified.' : 'Available for automatic and manual expense assignment.'}</Text></View>)}
    </ScrollView>
  </View>;
}
const styles=StyleSheet.create({root:{flex:1},title:{fontSize:24,fontFamily:'Inter_700Bold',marginBottom:8},body:{fontSize:12,lineHeight:18},card:{borderRadius:16,borderWidth:1,padding:14,marginTop:9},cardTitle:{fontSize:13,fontFamily:'Inter_700Bold',marginBottom:4}});
