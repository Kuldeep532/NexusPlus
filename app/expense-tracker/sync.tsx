import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function ExpenseTrackerSyncScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return <View style={[styles.root,{backgroundColor:colors.background}]}>
    <Stack.Screen options={{title:'Secure Sync',headerShown:true}} />
    <ScrollView contentContainerStyle={{padding:20,paddingBottom:insets.bottom+24}}>
      <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Secure sync</Text>
      <Text style={[styles.body,{color:colors.mutedForeground}]}>Your expenses can stay connected to your account so supported devices can restore your saved records. Sync is available when the required account configuration is enabled.</Text>
      <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><View style={[styles.icon,{backgroundColor:colors.secondary}]}><Feather name="cloud" size={20} color={colors.primary}/></View><View style={styles.copy}><Text style={[styles.cardTitle,{color:colors.foreground}]}>Account sync</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>Expenses are associated with your signed-in account, allowing supported devices to restore the same records.</Text></View></View>
      <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><View style={[styles.icon,{backgroundColor:colors.secondary}]}><Feather name="shield" size={20} color={colors.primary}/></View><View style={styles.copy}><Text style={[styles.cardTitle,{color:colors.foreground}]}>Account configuration</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>Sync uses the configured service connection; no service credentials are displayed or entered as part of the expense workflow.</Text></View></View>
    </ScrollView>
  </View>;
}
const styles=StyleSheet.create({root:{flex:1},title:{fontSize:24,fontFamily:'Inter_700Bold',marginBottom:8},body:{fontSize:12,lineHeight:18},card:{borderRadius:18,borderWidth:1,padding:15,marginTop:12,flexDirection:'row'},icon:{width:44,height:44,borderRadius:13,alignItems:'center',justifyContent:'center'},copy:{flex:1,marginLeft:11},cardTitle:{fontSize:13,fontFamily:'Inter_700Bold',marginBottom:5}});
