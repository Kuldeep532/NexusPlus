import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function PaymentAnnouncerPaymentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ title: 'Payments', headerShown: true }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Payment activity</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Verified payment events will appear here. This screen never accepts arbitrary transaction data.</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>No verified payments yet</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>The authenticated payment-event provider is the only source for announcement data.</Text>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({ root:{flex:1}, title:{fontSize:24,fontFamily:'Inter_700Bold',marginBottom:8}, body:{fontSize:12,lineHeight:18}, card:{marginTop:16,borderRadius:18,borderWidth:1,padding:16}, cardTitle:{fontSize:14,fontFamily:'Inter_700Bold',marginBottom:6} });
