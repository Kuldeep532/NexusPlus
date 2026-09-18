import { Stack, useRouter } from 'expo-router';
import { Alert, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useEffect, useMemo, useState } from 'react';
import { activePcRemoteController, connectComputer, leftClick, pressComputerKey, rightClick, scrollComputer } from '@/features/remote-control/remoteControlComputer';
import { getRemoteConnections, type RemoteConnection } from '@/features/remote-control/remoteControlStore';
import { getComingSoonLabel } from '@/features/remote-control/remoteReceiverStatus';
import { remoteHaptic } from '@/features/remote-control/remoteFeedback';

const keys=['CTRL','ALT','SHIFT','TAB','ENTER','ESC','BACKSPACE','SPACE','ARROW_UP','ARROW_DOWN','ARROW_LEFT','ARROW_RIGHT'];

export default function ComputerRemoteScreen(){
 const colors=useColors(); const router=useRouter(); const [connection,setConnection]=useState<RemoteConnection>(); const [status,setStatus]=useState('Ready');
 useEffect(()=>{ void getRemoteConnections().then((items)=>setConnection(items.find((item)=>item.type==='computer'&&item.paired))); activePcRemoteController.onConnectionChange((connected)=>setStatus(connected?'Connected':'Disconnected')); return ()=>activePcRemoteController.disconnect(); },[]);
 const ensure=()=>{ if(!connection){Alert.alert('Computer Remote','Pair a computer first.');return false;} try{connectComputer(connection);return true;}catch(e){Alert.alert('Computer Remote',String(e instanceof Error?e.message:e));return false;} };
 const tap=(fn:()=>void)=>{void remoteHaptic('press');try{fn();void remoteHaptic('success');setStatus('Command sent')}catch{void remoteHaptic('error');Alert.alert('Computer Remote','The desktop receiver is not connected. '+getComingSoonLabel('Nexus PC receiver'));}};
 const panResponder=useMemo(()=>PanResponder.create({onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>20||Math.abs(g.dy)>20,onPanResponderRelease:(_,g)=>{if(!ensure())return;scrollComputer(g.dx,g.dy);}}),[connection]);
 return <View style={[styles.root,{backgroundColor:colors.background}]}>
  <Stack.Screen options={{title:'Computer Remote'}}/>
  <Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Computer Remote</Text>
  <Text accessibilityLiveRegion="polite" style={{color:colors.mutedForeground}}>{status}</Text>
  <View style={styles.row}>
   <Pressable accessibilityRole="button" onPress={()=>tap(()=>{if(ensure())leftClick();})} style={[styles.action,{borderColor:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.foreground}}>Left Click</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>tap(()=>{if(ensure())rightClick();})} style={[styles.action,{borderColor:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.foreground}}>Right Click</Text></Pressable>
  </View>
  <View {...panResponder.panHandlers} accessible accessibilityLabel="Computer touchpad. Swipe to move or scroll the mouse." style={[styles.pad,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={{color:colors.foreground}}>Touchpad</Text><Text style={{color:colors.mutedForeground}}>Swipe to control the mouse. Tap left or right click above.</Text></View>
  <View style={styles.grid}>{keys.map(k=><Pressable key={k} accessibilityRole="button" accessibilityLabel={k.replaceAll('_',' ')} onPress={()=>tap(()=>{if(ensure())pressComputerKey(k);})} style={[styles.key,{borderColor:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.foreground}}>{k.replaceAll('_',' ')}</Text></Pressable>)}</View>
  <Text style={{color:colors.mutedForeground}}>{getComingSoonLabel('PC screen streaming and phone-to-PC screen sharing')}</Text>
  <Pressable accessibilityRole="button" onPress={()=>router.push('/remote-control/computer-settings')} style={[styles.action,{borderColor:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.foreground}}>Remote Settings</Text></Pressable>
  <Pressable accessibilityRole="button" onPress={()=>router.replace('/remote-control')}><Text style={{color:colors.foreground,textAlign:'center'}}>Back</Text></Pressable>
 </View>
}
const styles=StyleSheet.create({root:{flex:1,padding:18,gap:12},title:{fontSize:28,fontFamily:'Inter_700Bold'},row:{flexDirection:'row',gap:10},action:{minHeight:50,borderWidth:1,borderRadius:12,flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:10},pad:{minHeight:160,borderWidth:1,borderRadius:16,alignItems:'center',justifyContent:'center',gap:8,padding:18},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},key:{minWidth:'30%',flexGrow:1,minHeight:46,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center',paddingHorizontal:8}});
