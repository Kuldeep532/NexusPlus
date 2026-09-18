import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useEffect, useState } from 'react';
import { getRemoteConnections, saveRemoteConnection, type RemoteConnection } from '@/features/remote-control/remoteControlStore';

export default function ComputerRemoteSettings(){
 const colors=useColors(); const router=useRouter(); const [screenOnMobile,setScreenOnMobile]=useState(false); const [device,setDevice]=useState<RemoteConnection | null>(null);
 useEffect(()=>{ void getRemoteConnections().then(items=>{const d=items.find(item=>item.type==='computer'&&item.paired)??null;setDevice(d);setScreenOnMobile(Boolean(d?.capabilities.screen));}); },[]);
 const toggle=async()=>{const next=!screenOnMobile;setScreenOnMobile(next);if(device){const updated={...device,capabilities:{...device.capabilities,screen:next}};setDevice(updated);await saveRemoteConnection(updated);}};
 return <View style={[styles.root,{backgroundColor:colors.background}]}>
  <Stack.Screen options={{title:'Computer Remote Settings'}}/>
  <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Computer Remote Settings</Text>
  <Text style={[styles.sub,{color:colors.mutedForeground}]}>Screen viewing is prepared but the live screen-stream receiver is not part of the current remote transport.</Text>
  <Pressable accessibilityRole="switch" accessibilityState={{checked:screenOnMobile}} onPress={()=>void toggle()} style={[styles.toggle,{backgroundColor:screenOnMobile?colors.primary:colors.secondary}]}><Text style={{color:screenOnMobile?colors.primaryForeground:colors.foreground,fontFamily:'Inter_700Bold'}}>{screenOnMobile?'View Computer Screen on Mobile: ON':'View Computer Screen on Mobile: OFF'}</Text></Pressable>
  <Text style={[styles.sub,{color:colors.mutedForeground}]}>Coming Soon: Nexus PC receiver screen streaming and View Mobile Screen on PC.</Text>
  <Pressable accessibilityRole="button" onPress={()=>router.replace('/remote-control/computer')}><Text style={{color:colors.foreground,textAlign:'center'}}>Back</Text></Pressable>
 </View>
}
const styles=StyleSheet.create({root:{flex:1,padding:18,gap:14},title:{fontSize:28,fontFamily:'Inter_700Bold'},sub:{fontSize:12,lineHeight:18},toggle:{minHeight:54,borderRadius:14,alignItems:'center',justifyContent:'center',padding:12}});
