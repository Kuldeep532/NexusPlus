import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useColors } from '@/hooks/useColors';

const KEY='@nexus-plus/spiritual-sadhana-streak-v1';
type State={completedDates:string[]};
const today=()=>new Date().toISOString().slice(0,10);
function dateDaysAgo(n:number){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-n);return d.toISOString().slice(0,10)}
export default function SadhanaStreakScreen(){
 const c=useColors();const [state,setState]=useState<State>({completedDates:[]});
 useEffect(()=>{void AsyncStorage.getItem(KEY).then(v=>{try{if(v)setState(JSON.parse(v))}catch{}})},[]);
 const completed=state.completedDates.includes(today());
 const streak=useMemo(()=>{let n=0;for(let i=0;;i++){if(!state.completedDates.includes(dateDaysAgo(i)))break;n++}return n},[state.completedDates]);
 const toggle=()=>{const dates=completed?state.completedDates.filter(d=>d!==today()):Array.from(new Set([...state.completedDates,today()]));const next={completedDates:dates.slice(-365)};setState(next);void AsyncStorage.setItem(KEY,JSON.stringify(next))};
 return <View style={[s.root,{backgroundColor:c.background}]}>
  <Stack.Screen options={{title:'Sadhana Streak'}}/>
  <View style={s.content}>
   <Text accessibilityRole="header" style={[s.title,{color:c.foreground}]}>Sadhana Streak</Text>
   <Text style={[s.sub,{color:c.mutedForeground}]}>Mark today complete when you have finished the spiritual practice you chose for yourself.</Text>
   <View style={[s.card,{backgroundColor:c.card,borderColor:c.border}]}>
    <Text style={[s.big,{color:c.foreground}]}>{streak}</Text><Text style={{color:c.mutedForeground}}>day streak</Text>
   </View>
   <Pressable accessibilityRole="checkbox" accessibilityState={{checked:completed}} onPress={toggle} style={[s.action,{backgroundColor:completed?c.secondary:c.primary,borderColor:c.primary}]}>
    <Text style={{color:completed?c.foreground:c.primaryForeground,fontFamily:'Inter_700Bold'}}>{completed?'Completed today':'Mark today complete'}</Text>
   </Pressable>
  </View>
 </View>
}
const s=StyleSheet.create({root:{flex:1},content:{flex:1,padding:18,justifyContent:'center'},title:{fontSize:28,fontFamily:'Inter_700Bold',marginBottom:6},sub:{fontSize:12,lineHeight:18,marginBottom:22},card:{borderWidth:1,borderRadius:20,padding:25,alignItems:'center',marginBottom:15},big:{fontSize:52,fontFamily:'Inter_700Bold'},action:{height:52,borderWidth:1,borderRadius:16,alignItems:'center',justifyContent:'center'}});
