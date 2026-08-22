import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { usePaymentAnnouncer } from '@/features/payment-announcer/usePaymentAnnouncer';
import { resolvePaymentTtsProvider } from '@/features/payment-announcer/paymentAnnouncerTts';

export default function PaymentAnnouncerVoiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const payment = usePaymentAnnouncer();
  const testVoice = async () => {
    const provider = await resolvePaymentTtsProvider(payment.settings.preferredTtsProvider);
    Alert.alert('Voice availability', provider ? `${provider} is available.` : 'No supported Payment Announcer voice is available yet.');
  };
  return <View style={[styles.root,{backgroundColor:colors.background}]}>
    <Stack.Screen options={{ title:'Voice', headerShown:true }} />
    <ScrollView contentContainerStyle={{padding:20,paddingBottom:insets.bottom+24}}>
      <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Voice controls</Text>
      <Text style={[styles.body,{color:colors.mutedForeground}]}>The selected voice is used only after the payment event has passed verification.</Text>
      <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}>
        <Text style={[styles.label,{color:colors.mutedForeground}]}>Preferred provider</Text>
        <Text style={[styles.value,{color:colors.foreground}]}>{payment.settings.preferredTtsProvider === 'android-default' ? 'Android default TTS' : 'Installed voice sheet'}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Switch preferred voice provider" onPress={() => void payment.updateSettings({preferredTtsProvider:payment.settings.preferredTtsProvider === 'android-default' ? 'pytts-voice-sheet' : 'android-default'})} style={[styles.button,{backgroundColor:colors.secondary,borderColor:colors.border}]}>
          <Feather name="refresh-cw" size={16} color={colors.foreground}/><Text style={[styles.buttonText,{color:colors.foreground}]}>Switch provider</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Test Payment Announcer voice" onPress={() => void testVoice()} style={[styles.button,{backgroundColor:colors.secondary,borderColor:colors.border}]}>
          <Feather name="volume-2" size={16} color={colors.foreground}/><Text style={[styles.buttonText,{color:colors.foreground}]}>Check availability</Text>
        </Pressable>
      </View>
    </ScrollView>
  </View>;
}
const styles=StyleSheet.create({root:{flex:1},title:{fontSize:24,fontFamily:'Inter_700Bold',marginBottom:8},body:{fontSize:12,lineHeight:18},card:{marginTop:18,borderRadius:18,borderWidth:1,padding:16},label:{fontSize:11},value:{fontSize:17,fontFamily:'Inter_700Bold',marginTop:5},button:{marginTop:14,minHeight:44,borderRadius:12,borderWidth:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},buttonText:{fontSize:11,fontFamily:'Inter_700Bold'}});
