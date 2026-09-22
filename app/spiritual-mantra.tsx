import * as Speech from 'expo-speech';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

const DEFAULT='ॐ नमः शिवाय';
export default function MantraScreen(){const c=useColors();const [mantra,setMantra]=useState(DEFAULT);const [reps,setReps]=useState(11);const [running,setRunning]=useState(false);const [spoken,setSpoken]=useState(0);
useEffect(()=>()=>{Speech.stop()},[]);
useEffect(()=>{if(!running||spoken>=reps){if(spoken>=reps)setRunning(false);return} Speech.speak(mantra,{language:'hi-IN',rate:0.72,onDone:()=>setSpoken(n=>n+1),onStopped:()=>setRunning(false),onError:()=>setRunning(false)})},[running,spoken,reps,mantra]);
return <View style={[s.root,{backgroundColor:c.background}]}><Stack.Screen options={{title:'Mantra Player'}}/><View style={s.content}><Text accessibilityRole="header" style={[s.title,{color:c.foreground}]}>Mantra Player</Text><Text style={[s.sub,{color:c.mutedForeground}]}>Repeats your mantra using the Android device speech engine, so no bundled audio library is required.</Text>
<TextInput accessibilityLabel="Mantra text" value={mantra} onChangeText={setMantra} style={[s.input,{borderColor:c.border,color:c.foreground,backgroundColor:c.card}]}/>
<View style={s.row}>{[11,27,108].map(n=><Pressable key={n} onPress={()=>{Speech.stop();setReps(n);setSpoken(0);setRunning(false)}} style={[s.chip,{borderColor:c.border,backgroundColor:reps===n?c.secondary:c.card}]}><Text style={{color:c.foreground,fontFamily:'Inter_700Bold'}}>{n} reps</Text></Pressable>)}</View>
<Text accessibilityLiveRegion="polite" style={[s.progress,{color:c.foreground}]}>{spoken} / {reps}</Text>
<Pressable accessibilityRole="button" onPress={()=>{Speech.stop();setSpoken(0);setRunning(!running)}} style={[s.primary,{backgroundColor:c.primary}]}><Text style={{color:c.primaryForeground,fontFamily:'Inter_700Bold'}}>{running?'Stop':'Play Mantra'}</Text></Pressable>
<Pressable accessibilityRole="button" onPress={()=>{Speech.stop();setRunning(false)}} style={[s.secondary,{borderColor:c.border}]}><Text style={{color:c.foreground}}>Stop Speech</Text></Pressable>
</View></View>}
const s=StyleSheet.create({root:{flex:1},content:{padding:18,justifyContent:'center',flex:1},title:{fontSize:28,fontFamily:'Inter_700Bold',marginBottom:6},sub:{fontSize:12,lineHeight:18,marginBottom:20},input:{minHeight:54,borderWidth:1,borderRadius:15,paddingHorizontal:14,fontSize:18,textAlign:'center'},row:{flexDirection:'row',gap:8,justifyContent:'center',marginTop:14,marginBottom:18},chip:{paddingHorizontal:13,paddingVertical:10,borderWidth:1,borderRadius:13},progress:{textAlign:'center',fontSize:28,fontFamily:'Inter_700Bold',marginBottom:18},primary:{height:52,borderRadius:16,alignItems:'center',justifyContent:'center'},secondary:{height:50,borderWidth:1,borderRadius:15,alignItems:'center',justifyContent:'center',marginTop:10}});
