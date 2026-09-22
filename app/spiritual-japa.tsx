import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

const KEY='@nexus-plus/spiritual-japa';
export default function JapaScreen(){
 const c=useColors(); const [count,setCount]=useState(0); const [target]=useState(108);
 useEffect(()=>{void AsyncStorage.getItem(KEY).then(v=>{try{const x=JSON.parse(v||'{}');if(Number.isFinite(x.count))setCount(x.count)}catch{}})},[]);
 const save=(next:number)=>{setCount(next);void AsyncStorage.setItem(KEY,JSON.stringify({count:next,target}))};
 const cycles=Math.floor(count/108), mala=count%108, progress=Math.min(1,count/target);
 return <View style={[s.root,{backgroundColor:c.background}]}><Stack.Screen options={{title:'Japa Counter'}}/><View style={s.content}>
 <Text accessibilityRole="header" style={[s.title,{color:c.foreground}]}>Japa Counter</Text><Text style={[s.sub,{color:c.mutedForeground}]}>Tap once per mantra repetition. Progress is saved locally.</Text>
 <View accessible accessibilityRole="summary" style={[s.circle,{borderColor:c.primary}]}><Text style={[s.big,{color:c.foreground}]}>{count}</Text><Text style={[s.small,{color:c.mutedForeground}]}>repetitions</Text></View>
 <Text style={[s.meta,{color:c.foreground}]}>Mala cycles: {cycles} • Current mala: {mala}/108 • Target: {target}</Text>
 <View style={[s.track,{backgroundColor:c.secondary}]}><View style={[s.fill,{backgroundColor:c.primary,width:(progress*100)+'%'}]}/></View>
 <Pressable accessibilityRole="button" onPress={()=>save(count+1)} style={[s.primary,{backgroundColor:c.primary}]}><Feather name="plus" size={22} color={c.primaryForeground}/><Text style={[s.primaryText,{color:c.primaryForeground}]}>Count Mantra</Text></Pressable>
 <Pressable accessibilityRole="button" onPress={()=>save(count+108)} style={[s.secondaryBtn,{borderColor:c.border}]}><Text style={[s.secondaryText,{color:c.foreground}]}>+108 Mala</Text></Pressable>
 <Pressable accessibilityRole="button" onPress={()=>save(0)} style={s.reset}><Text style={{color:c.mutedForeground}}>Reset Count</Text></Pressable>
 </View></View>
}
const s=StyleSheet.create({root:{flex:1},content:{padding:18,flex:1,justifyContent:'center'},title:{fontSize:28,fontFamily:'Inter_700Bold',marginBottom:6},sub:{fontSize:12,lineHeight:18,marginBottom:25},circle:{width:190,height:190,borderRadius:95,borderWidth:5,alignSelf:'center',alignItems:'center',justifyContent:'center',marginBottom:20},big:{fontSize:46,fontFamily:'Inter_700Bold'},small:{fontSize:12},meta:{textAlign:'center',fontSize:12,marginBottom:12},track:{height:9,borderRadius:5,overflow:'hidden',marginBottom:18},fill:{height:'100%'},primary:{height:52,borderRadius:16,flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center'},primaryText:{fontSize:14,fontFamily:'Inter_700Bold'},secondaryBtn:{height:50,borderWidth:1,borderRadius:15,alignItems:'center',justifyContent:'center',marginTop:10},secondaryText:{fontSize:13,fontFamily:'Inter_700Bold'},reset:{alignItems:'center',padding:16}});
