import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useState } from 'react';

export default function ComputerRemoteSettings(){
 const colors=useColors(); const router=useRouter(); const [screenOnMobile,setScreenOnMobile]=useState(false);
 return <View style={[styles.root,{backgroundColor:colors.background}]}>
  <Stack.Screen options={{title:'Computer Remote Settings'}}/>
  <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Computer Remote Settings</Text>
  <Text style={[styles.sub,{color:colors.mutedForeground}]}>Screen sharing is off by default. The actual screen-stream receiver will be added in the next Screen Mirroring feature.</Text>
  <Pressable accessibilityRole="switch" accessibilityState={{checked:screenOnMobile}} onPress={()=>setScreenOnMobile(v=>!v)} style={[styles.toggle,{backgroundColor:screenOnMobile?colors.primary:colors.secondary}]}><Text style={{color:screenOnMobile?colors.primaryForeground:colors.foreground,fontFamily:'Inter_700Bold'}}>{screenOnMobile?'View Computer Screen on Mobile: ON':'View Computer Screen on Mobile: OFF'}</Text></Pressable>
  <Text style={[styles.sub,{color:colors.mutedForeground}]}>View Mobile Screen on PC is intentionally reserved for the separate Screen Mirroring feature.</Text>
  <Pressable accessibilityRole="button" onPress={()=>router.replace('/remote-control/computer')}><Text style={{color:colors.foreground,textAlign:'center'}}>Back</Text></Pressable>
 </View>
}
const styles=StyleSheet.create({root:{flex:1,padding:18,gap:14},title:{fontSize:28,fontFamily:'Inter_700Bold'},sub:{fontSize:12,lineHeight:18},toggle:{minHeight:54,borderRadius:14,alignItems:'center',justifyContent:'center',padding:12}});
