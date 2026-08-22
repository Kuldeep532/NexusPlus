import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { usePaymentAnnouncer } from '@/features/payment-announcer/usePaymentAnnouncer';
import { disablePaymentScreenProtection, enablePaymentScreenProtection } from '@/features/payment-announcer/paymentAnnouncerSecurity';

export default function PaymentAnnouncerSecurityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const payment = usePaymentAnnouncer();
  const testBiometric = async () => {
    const ok = await payment.unlock();
    if (!ok) Alert.alert('Payment Announcer', payment.error ?? 'Biometric authentication failed.');
  };
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Security', headerShown: true }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}>
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="shield-lock" size={28} color={colors.primary} /></View>
          <View style={styles.heroCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Hardware-backed protection</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Payment Announcer reuses the existing Android Biometric Vault and does not store biometric templates itself.</Text></View>
        </View>
        <SecurityRow title="Strong biometric available" value={payment.biometricAvailable ? 'Available' : 'Not enrolled'} colors={colors} />
        <SecurityRow title="Current access state" value={payment.isUnlocked ? 'Unlocked' : 'Locked'} colors={colors} />
        <SecurityRow title="Credential fallback" value="Disabled" colors={colors} />
        <SecurityRow title="Screenshot / recent-app protection" value="Enabled while unlocked" colors={colors} />
        <SecurityRow title="Auto-lock" value={`${payment.settings.autoLockSeconds} seconds`} colors={colors} />
        <Pressable accessibilityRole="button" accessibilityLabel="Verify biometric protection" onPress={() => void testBiometric()} style={[styles.button, { backgroundColor: colors.primary }]}><Feather name="fingerprint" size={17} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Verify biometric</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Enable payment screen protection" onPress={() => void enablePaymentScreenProtection()} style={[styles.button, { backgroundColor: colors.secondary, borderColor: colors.border }]}><Feather name="eye-off" size={17} color={colors.foreground} /><Text style={[styles.buttonText, { color: colors.foreground }]}>Enable screen protection</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Disable payment screen protection" onPress={() => void disablePaymentScreenProtection()} style={[styles.button, { backgroundColor: colors.secondary, borderColor: colors.border }]}><Feather name="eye" size={17} color={colors.foreground} /><Text style={[styles.buttonText, { color: colors.foreground }]}>Disable screen protection</Text></Pressable>
      </ScrollView>
    </View>
  );
}
function SecurityRow({ title, value, colors }: { title: string; value: string; colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text></View><Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text></View>;
}
const styles = StyleSheet.create({ root:{flex:1}, hero:{flexDirection:'row',alignItems:'center',marginBottom:14}, heroIcon:{width:56,height:56,borderRadius:16,alignItems:'center',justifyContent:'center'}, heroCopy:{flex:1,marginLeft:12}, title:{fontSize:22,fontFamily:'Inter_700Bold',marginBottom:6}, body:{fontSize:12,lineHeight:18}, row:{minHeight:60,borderRadius:16,borderWidth:1,paddingHorizontal:14,paddingVertical:10,flexDirection:'row',alignItems:'center',marginTop:10}, rowCopy:{flex:1}, rowTitle:{fontSize:12,fontFamily:'Inter_700Bold'}, rowValue:{fontSize:11,textAlign:'right'}, button:{minHeight:46,borderRadius:13,borderWidth:1,marginTop:12,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8}, buttonText:{fontSize:11,fontFamily:'Inter_700Bold'} });
