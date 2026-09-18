import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export default function AddNewConnectionScreen(){
  const colors=useColors(); const router=useRouter();
  return <View style={[styles.root,{backgroundColor:colors.background}]}>
    <Stack.Screen options={{title:'Add New Connection'}}/>
    <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Add New Connection</Text>
    <Pressable accessibilityRole="button" onPress={()=>router.push('/remote-control/connect-computer')} style={[styles.button,{backgroundColor:colors.card,borderColor:colors.border}]}>
      <Text style={[styles.bt,{color:colors.foreground}]}>Connect to Computer</Text>
      <Text style={[styles.st,{color:colors.mutedForeground}]}>Wi-Fi Desktop Remote or Bluetooth desktop receiver</Text>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={()=>router.push('/remote-control/connect-tv')} style={[styles.button,{backgroundColor:colors.card,borderColor:colors.border}]}>
      <Text style={[styles.bt,{color:colors.foreground}]}>Connect to TV</Text>
      <Text style={[styles.st,{color:colors.mutedForeground}]}>Android TV / Google TV over the same Wi-Fi</Text>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={()=>router.replace('/remote-control')} style={styles.back}>
      <Text style={{color:colors.foreground}}>Back</Text>
    </Pressable>
  </View>
}
const styles=StyleSheet.create({root:{flex:1,padding:18,gap:14},title:{fontSize:28,fontFamily:'Inter_700Bold'},button:{borderWidth:1,borderRadius:16,padding:16,gap:6},bt:{fontSize:16,fontFamily:'Inter_700Bold'},st:{fontSize:12,lineHeight:17},back:{minHeight:48,alignItems:'center',justifyContent:'center'}});
