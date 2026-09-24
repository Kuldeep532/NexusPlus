import { Stack, useRouter } from 'expo-router';
import { Alert, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useEffect, useMemo, useState } from 'react';
import { getRemoteConnections, type RemoteConnection } from '@/features/remote-control/remoteControlStore';
import { getComingSoonLabel } from '@/features/remote-control/remoteReceiverStatus';
import { remoteHaptic } from '@/features/remote-control/remoteFeedback';

const keys=['CTRL','ALT','SHIFT','TAB','ENTER','ESC','BACKSPACE','SPACE','ARROW_UP','ARROW_DOWN','ARROW_LEFT','ARROW_RIGHT'];

const keys=['CTRL','ALT','SHIFT','TAB','ENTER','ESC','BACKSPACE','SPACE','ARROW_UP','ARROW_DOWN','ARROW_LEFT','ARROW_RIGHT'];

export default function ComputerRemoteScreen(){
 const colors=useColors(); const router=useRouter();
 const [connection,setConnection]=useState<RemoteConnection>(); const [status,setStatus]=useState('Ready');
 useEffect(()=>{ void getRemoteConnections().then((items)=>setConnection(items.find((item)=>item.type==='computer'&&item.paired))); },[]);
 const unavailable=()=>{setStatus(getComingSoonLabel('Nexus PC receiver')); Alert.alert('Computer Remote','The Nexus PC receiver is not available yet. Pairing and desktop control are disabled until the receiver is installed.');};
 const tap=()=>{void remoteHaptic('press'); unavailable(); void remoteHaptic('error');};
 const panResponder=useMemo(()=>PanResponder.create({onMoveShouldSetPanResponder:()=>true,onPanResponderRelease:()=>tap()}),[]);
 return <View style={[styles.root,{backgroundColor:colors.background}]}>
  <Stack.Screen options={{title:'Computer Remote'}}/>
  <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Computer Remote</Text>
  <Text accessibilityLiveRegion="polite" style={{color:colors.mutedForeground}}>{status}</Text>
  <View style={styles.row}>
   <Pressable accessibilityRole="button" onPress={tap} style={[styles.action,{borderColor:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.foreground}}>Left Click</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={tap} style={[styles.action,{borderColor:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.foreground}}>Right Click</Text></Pressable>
  </View>
  <View {...panResponder.panHandlers} accessible accessibilityLabel="Computer touchpad. Nexus PC receiver is required." style={[styles.pad,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={{color:colors.foreground}}>Touchpad</Text><Text style={{color:colors.mutedForeground}}>Nexus PC receiver required.</Text></View>
  <View style={styles.grid}>{keys.map(k=><Pressable key={k} accessibilityRole="button" accessibilityLabel={k.replaceAll('_',' ')} onPress={tap} style={[styles.key,{borderColor:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.foreground}}>{k.replaceAll('_',' ')}</Text></Pressable>)}</View>
  <Text style={{color:colors.mutedForeground}}>{getComingSoonLabel('PC screen streaming and phone-to-PC screen sharing')}</Text>
  <Pressable accessibilityRole="button" onPress={()=>router.push('/remote-control/computer-settings')} style={[styles.action,{borderColor:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.foreground}}>Remote Settings</Text></Pressable>
  <Pressable accessibilityRole="button" onPress={()=>router.replace('/remote-control')}><Text style={{color:colors.foreground,textAlign:'center'}}>Back</Text></Pressable>
 </View>
}
const styles=StyleSheet.create({root:{flex:1,padding:18,gap:12},title:{fontSize:28,fontFamily:'Inter_700Bold'},row:{flexDirection:'row',gap:10},action:{minHeight:50,borderWidth:1,borderRadius:12,flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:10},pad:{minHeight:160,borderWidth:1,borderRadius:16,alignItems:'center',justifyContent:'center',gap:8,padding:18},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},key:{minWidth:'30%',flexGrow:1,minHeight:46,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center',paddingHorizontal:8}});
