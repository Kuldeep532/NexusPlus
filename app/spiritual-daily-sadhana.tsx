import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';

const ITEMS=[['gita','Bhagavad Gita reading'],['japa','Japa / mantra'],['meditation','Meditation'],['prayer','Prayer'],['seva','Seva / service']] as const;
const KEY='@nexus-plus/daily-sadhana'; const today=()=>new Date().toISOString().slice(0,10);
export default function SadhanaScreen(){const c=useColors();const [done,setDone]=useState<Record<string,boolean>>({});
useEffect(()=>{void AsyncStorage.getItem(KEY).then(v=>{try{const x=JSON.parse(v||'{}');setDone(x.date===today()?x.done||{}:{})}catch{}})},[]);
const toggle=(id:string)=>{const n={...done,[id]:!done[id]};setDone(n);void AsyncStorage.setItem(KEY,JSON.stringify({date:today(),done:n}))};const count=Object.values(done).filter(Boolean).length;
return <View style={[s.root,{backgroundColor:c.background}]}><Stack.Screen options={{title:'Daily Sadhana'}}/><ScrollView contentContainerStyle={s.content}><Text accessibilityRole="header" style={[s.title,{color:c.foreground}]}>Daily Sadhana</Text><Text style={[s.sub,{color:c.mutedForeground}]}>Track the spiritual practices you choose to follow. Nothing here is presented as a religious requirement.</Text>
<View accessible accessibilityRole="summary" style={[s.summary,{backgroundColor:c.card,borderColor:c.border}]}><Text style={[s.big,{color:c.foreground}]}>{count}/{ITEMS.length}</Text><Text style={{color:c.mutedForeground}}>completed today</Text></View>
{ITEMS.map(([id,label])=><Pressable key={id} onPress={()=>toggle(id)} accessibilityRole="checkbox" accessibilityState={{checked:!!done[id]}} style={[s.item,{backgroundColor:c.card,borderColor:c.border}]}><View style={[s.box,{borderColor:c.primary,backgroundColor:done[id]?c.primary:'transparent'}]}>{done[id]&&<Text style={{color:c.primaryForeground}}>✓</Text>}</View><Text style={[s.label,{color:c.foreground}]}>{label}</Text></Pressable>)}
</ScrollView></View>}
const s=StyleSheet.create({root:{flex:1},content:{padding:18,paddingBottom:30},title:{fontSize:28,fontFamily:'Inter_700Bold',marginBottom:6},sub:{fontSize:12,lineHeight:18,marginBottom:18},summary:{borderWidth:1,borderRadius:18,padding:18,alignItems:'center',marginBottom:12},big:{fontSize:30,fontFamily:'Inter_700Bold'},item:{minHeight:62,borderWidth:1,borderRadius:16,padding:14,flexDirection:'row',alignItems:'center',marginBottom:10},box:{width:28,height:28,borderWidth:2,borderRadius:8,alignItems:'center',justifyContent:'center'},label:{fontSize:13,fontFamily:'Inter_600SemiBold',marginLeft:12}});
