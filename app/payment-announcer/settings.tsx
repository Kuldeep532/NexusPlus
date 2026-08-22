import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { usePaymentAnnouncer } from '@/features/payment-announcer/usePaymentAnnouncer';

const LOCK_OPTIONS = [15, 30, 60, 120, 300] as const;

export default function PaymentAnnouncerSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const payment = usePaymentAnnouncer();
  return <View style={[styles.root,{backgroundColor:colors.background}]}>
    <Stack.Screen options={{title:'Settings',headerShown:true}} />
    <ScrollView contentContainerStyle={{padding:20,paddingBottom:insets.bottom+24}}>
      <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Payment Announcer settings</Text>
      <Text style={[styles.body,{color:colors.mutedForeground}]}>These preferences are local and bounded. Protected controls are available only while the feature is unlocked.</Text>
      <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}>
        <View style={styles.row}><View style={styles.copy}><Text style={[styles.rowTitle,{color:colors.foreground}]}>Announcements</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>Enable spoken payment announcements.</Text></View><Pressable accessibilityRole="switch" accessibilityState={{checked:payment.settings.enabled}} accessibilityLabel="Payment announcements enabled" onPress={()=>void payment.updateSettings({enabled:!payment.settings.enabled})} style={[styles.switch,{backgroundColor:payment.settings.enabled?colors.primary:colors.secondary}]}><View style={[styles.thumb,{backgroundColor:payment.settings.enabled?colors.primaryForeground:colors.mutedForeground,alignSelf:payment.settings.enabled?'flex-end':'flex-start'}]}/></Pressable></View>
      </View>
      <Text style={[styles.section,{color:colors.foreground}]}>Auto-lock timeout</Text>
      {LOCK_OPTIONS.map(seconds=><Pressable key={seconds} accessibilityRole="radio" accessibilityState={{selected:payment.settings.autoLockSeconds===seconds}} accessibilityLabel={`Auto-lock after ${seconds} seconds`} onPress={()=>void payment.updateSettings({autoLockSeconds:seconds})} style={[styles.option,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={[styles.optionText,{color:colors.foreground}]}>{seconds < 60 ? `${seconds} seconds` : `${seconds/60} minute${seconds===60?'':'s'}`}</Text><Feather name={payment.settings.autoLockSeconds===seconds?'check-circle':'circle'} size={19} color={payment.settings.autoLockSeconds===seconds?colors.primary:colors.mutedForeground}/></Pressable>)}
    </ScrollView>
  </View>;
}
const styles=StyleSheet.create({root:{flex:1},title:{fontSize:24,fontFamily:'Inter_700Bold',marginBottom:8},section:{fontSize:15,fontFamily:'Inter_700Bold',marginTop:20,marginBottom:9},body:{fontSize:12,lineHeight:18},card:{marginTop:18,borderRadius:18,borderWidth:1,padding:16},row:{flexDirection:'row',alignItems:'center'},copy:{flex:1,marginRight:12},rowTitle:{fontSize:13,fontFamily:'Inter_700Bold',marginBottom:4},switch:{width:48,height:28,borderRadius:14,padding:3,justifyContent:'center'},thumb:{width:22,height:22,borderRadius:11},option:{minHeight:50,borderRadius:14,borderWidth:1,paddingHorizontal:14,marginTop:8,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},optionText:{fontSize:12,fontFamily:'Inter_700Bold'}});
