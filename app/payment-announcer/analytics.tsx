import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function PaymentAnnouncerAnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const metrics = [
    ['Announcements today', '0'],
    ['Verified events', '0'],
    ['Voice failures', '0'],
    ['Blocked events', '0'],
  ];
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ title: 'Analytics', headerShown: true }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Announcement analytics</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Only authenticated provider events are counted. No payment identity or amount is collected from this UI.</Text>
        <View style={styles.grid}>
          {metrics.map(([label, value]) => <View key={label} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.value, { color: colors.foreground }]}>{value}</Text><Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text></View>)}
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({ root:{flex:1}, title:{fontSize:24,fontFamily:'Inter_700Bold',marginBottom:8}, body:{fontSize:12,lineHeight:18}, grid:{gap:12,marginTop:18}, card:{borderRadius:18,borderWidth:1,padding:16}, value:{fontSize:26,fontFamily:'Inter_700Bold'}, label:{fontSize:11,marginTop:5} });
