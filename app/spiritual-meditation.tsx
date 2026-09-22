import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

const KEY='@nexus-plus/spiritual-meditation-sessions';
const PRESETS=[5,10,15,20];
export default function MeditationScreen(){
 const c=useColors(); const [minutes,setMinutes]=useState(10); const [remaining,setRemaining]=useState(600); const [running,setRunning]=useState(false); const [sessions,setSessions]=useState(0);
 useEffect(()=>{void AsyncStorage.getItem(KEY).then(v=>setSessions(Number(v||0)))},[]);
 useEffect(()=>{if(!running)return; if(remaining<=0){setRunning(false);setSessions(x=>{const n=x+1;void AsyncStorage.setItem(KEY,String(n));return n});return} const id=setInterval(()=>setRemaining(x=>Math.max(0,x-1)),1000); return()=>clearInterval(id)},[running,remaining]);
 const select=(m:number)=>{setMinutes(m);setRemaining(m*60);setRunning(false)};
 const start=()=>{if(remaining<=0)setRemaining(minutes*60);setRunning(true)};
 const mm=Math.floor(remaining/60).toString().padStart(2,'0'), ss=(remaining%60).toString().padStart(2,'0');
 return <View style={[s.root,{backgroundColor:c.background}]}><Stack.Screen options={{title:'Meditation Timer'}}/><View style={s.content}>
 <Text accessibilityRole="header" style={[s.title,{color:c.foreground}]}>Meditation Timer</Text><Text style={[s.sub,{color:c.mutedForeground}]}>A focused timer for silent sitting, japa, prayer or breath awareness.</Text>
 <View style={[s.timer,{borderColor:c.primary}]}><Text accessibilityLiveRegion="polite" style={[s.time,{color:c.foreground}]}>{mm}:{ss}</Text><Text style={{color:c.mutedForeground}}>minutes : seconds</Text></View>
 <View style={s.row}>{PRESETS.map(m=><Pressable key={m} onPress={()=>select(m)} style={[s.chip,{borderColor:c.border,backgroundColor:minutes===m?c.secondary:c.card}]}><Text style={{color:c.foreground,fontFamily:'Inter_700Bold'}}>{m} min</Text></Pressable>)}</View>
 <Pressable onPress={()=>running?setRunning(false):start()} accessibilityRole="button" style={[s.primary,{backgroundColor:c.primary}]}><Text style={[s.primaryText,{color:c.primaryForeground}]}>{running?'Pause':'Start Meditation'}</Text></Pressable>
 <Pressable onPress={()=>{setRunning(false);setRemaining(minutes*60)}} accessibilityRole="button" style={[s.secondary,{borderColor:c.border}]}><Text style={{color:c.foreground}}>Reset</Text></Pressable>
 <Text style={[s.history,{color:c.mutedForeground}]}>Completed sessions on this device: {sessions}</Text>
 </View></View>
}
const s=StyleSheet.create({root:{flex:1},content:{padding:18,justifyContent:'center',flex:1},title:{fontSize:28,fontFamily:'Inter_700Bold',marginBottom:6},sub:{fontSize:12,lineHeight:18,marginBottom:25},timer:{width:210,height:210,borderRadius:105,borderWidth:5,alignSelf:'center',alignItems:'center',justifyContent:'center',marginBottom:20},time:{fontSize:48,fontFamily:'Inter_700Bold'},row:{flexDirection:'row',gap:8,justifyContent:'center',marginBottom:15},chip:{paddingHorizontal:13,paddingVertical:10,borderRadius:13,borderWidth:1},primary:{height:52,borderRadius:16,alignItems:'center',justifyContent:'center'},primaryText:{fontSize:14,fontFamily:'Inter_700Bold'},secondary:{height:50,borderWidth:1,borderRadius:15,alignItems:'center',justifyContent:'center',marginTop:10},history:{textAlign:'center',fontSize:11,marginTop:18}});
