import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

const PATTERNS={box:[4,4,4,4],relax:[4,2,6,2],calm:[4,0,6,0]} as const;
export default function BreathingScreen(){const c=useColors();const [pattern,setPattern]=useState<keyof typeof PATTERNS>('box');const [running,setRunning]=useState(false);const [phase,setPhase]=useState(0);const [left,setLeft]=useState(PATTERNS.box[0]);const [cycles,setCycles]=useState(0);
 useEffect(()=>{void AsyncStorage.getItem('@nexus-plus/pranayama-cycles').then(v=>setCycles(Number(v||0)))},[]);
 useEffect(()=>{if(!running)return; const id=setInterval(()=>{setLeft(x=>{if(x>1)return x-1;const p=(phase+1)%4;if(p===0)setCycles(n=>{const v=n+1;void AsyncStorage.setItem('@nexus-plus/pranayama-cycles',String(v));return v});setPhase(p);return PATTERNS[pattern][p]||1})},1000);return()=>clearInterval(id)},[running,phase,pattern]);
 useEffect(()=>{setPhase(0);setLeft(PATTERNS[pattern][0]);setRunning(false)},[pattern]);
 const labels=['Inhale','Hold','Exhale','Rest']; return <View style={[s.root,{backgroundColor:c.background}]}><Stack.Screen options={{title:'Pranayama Timer'}}/><View style={s.content}><Text accessibilityRole="header" style={[s.title,{color:c.foreground}]}>Pranayama Timer</Text><Text style={[s.sub,{color:c.mutedForeground}]}>Follow timed breathing phases at your own pace. This timer is not medical advice.</Text>
 <View style={s.row}>{(Object.keys(PATTERNS) as Array<keyof typeof PATTERNS>).map(x=><Pressable key={x} onPress={()=>setPattern(x)} style={[s.chip,{borderColor:c.border,backgroundColor:x===pattern?c.secondary:c.card}]}><Text style={{color:c.foreground,fontFamily:'Inter_700Bold'}}>{x}</Text></Pressable>)}</View>
 <View accessibilityLiveRegion="polite" style={[s.phase,{borderColor:c.primary}]}><Text style={[s.phaseLabel,{color:c.mutedForeground}]}>{labels[phase]}</Text><Text style={[s.big,{color:c.foreground}]}>{left}</Text><Text style={{color:c.mutedForeground}}>seconds</Text></View>
 <Pressable onPress={()=>setRunning(!running)} accessibilityRole="button" style={[s.primary,{backgroundColor:c.primary}]}><Text style={{color:c.primaryForeground,fontFamily:'Inter_700Bold'}}>{running?'Pause':'Start'}</Text></Pressable><Text style={[s.history,{color:c.mutedForeground}]}>Completed cycles: {cycles}</Text>
 </View></View>}
const s=StyleSheet.create({root:{flex:1},content:{padding:18,justifyContent:'center',flex:1},title:{fontSize:28,fontFamily:'Inter_700Bold',marginBottom:6},sub:{fontSize:12,lineHeight:18,marginBottom:20},row:{flexDirection:'row',gap:8,justifyContent:'center',marginBottom:16},chip:{paddingHorizontal:13,paddingVertical:10,borderWidth:1,borderRadius:13},phase:{width:190,height:190,borderRadius:95,borderWidth:5,alignSelf:'center',alignItems:'center',justifyContent:'center',marginBottom:20},phaseLabel:{fontSize:14},big:{fontSize:54,fontFamily:'Inter_700Bold'},primary:{height:52,borderRadius:16,alignItems:'center',justifyContent:'center'},history:{textAlign:'center',marginTop:18,fontSize:11}});
