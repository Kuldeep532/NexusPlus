import { Stack, useRouter } from 'expo-router';
import { Alert, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useEffect, useMemo, useState } from 'react';
import { getRemoteConnections, type RemoteConnection } from '@/features/remote-control/remoteControlStore';
import { getComingSoonLabel } from '@/features/remote-control/remoteReceiverStatus';
import { remoteHaptic } from '@/features/remote-control/remoteFeedback';

export default function ComputerRemoteScreen(){
 const colors=useColors(); const router=useRouter();
 return <View style={[styles.root,{backgroundColor:colors.background}]}>
  <Stack.Screen options={{title:'Computer Remote'}}/>
  <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Computer Remote</Text>
  <Text accessibilityLiveRegion="polite" style={{color:colors.mutedForeground}}>Coming Soon</Text>
  <Text style={{color:colors.mutedForeground}}>The Nexus PC receiver is currently discontinued. The existing TV/Wi-Fi/Bluetooth Remote Control remains separate.</Text>
  <Pressable accessibilityRole="button" onPress={()=>router.replace('/remote-control')} style={[styles.action,{borderColor:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.foreground,textAlign:'center'}}>Back to Remote Control</Text></Pressable>
 </View>
}
const styles=StyleSheet.create({root:{flex:1,padding:18,gap:12},title:{fontSize:28,fontFamily:'Inter_700Bold'},row:{flexDirection:'row',gap:10},action:{minHeight:50,borderWidth:1,borderRadius:12,flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:10},pad:{minHeight:160,borderWidth:1,borderRadius:16,alignItems:'center',justifyContent:'center',gap:8,padding:18},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},key:{minWidth:'30%',flexGrow:1,minHeight:46,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center',paddingHorizontal:8}});
