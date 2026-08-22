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
      <Text style={[styles.body,{color:colors.mutedForeground}]}>Your expenses are designed to follow the authenticated account, not the device alone. Stage 1 keeps the Supabase boundary fail-closed until real project configuration is present.</Text>
      <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><View style={[styles.icon,{backgroundColor:colors.secondary}]}><Feather name="cloud" size={20} color={colors.primary}/></View><View style={styles.copy}><Text style={[styles.cardTitle,{color:colors.foreground}]}>Supabase account boundary</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>Expenses map to the authenticated user ID so the same Google-authenticated account can restore them on another device.</Text></View></View>
      <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><View style={[styles.icon,{backgroundColor:colors.secondary}]}><Feather name="shield" size={20} color={colors.primary}/></View><View style={styles.copy}><Text style={[styles.cardTitle,{color:colors.foreground}]}>No fabricated credentials</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>The feature will not invent or embed Supabase URLs, keys, or service credentials.</Text></View></View>
    </ScrollView>
  </View>;
}
const styles=StyleSheet.create({root:{flex:1},title:{fontSize:24,fontFamily:'Inter_700Bold',marginBottom:8},body:{fontSize:12,lineHeight:18},card:{borderRadius:18,borderWidth:1,padding:15,marginTop:12,flexDirection:'row'},icon:{width:44,height:44,borderRadius:13,alignItems:'center',justifyContent:'center'},copy:{flex:1,marginLeft:11},cardTitle:{fontSize:13,fontFamily:'Inter_700Bold',marginBottom:5}});
