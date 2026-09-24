import { useAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { REMOTE_MANTRA_AUDIO, type RemoteMantraAudio } from '@/features/spiritual/mantraAudioCatalog';
import { getCachedMantraAudio } from '@/features/spiritual/mantraAudioCache';
import { resolveMantraAudioUrl } from '@/features/spiritual/mantraAudioUrl';

const DEFAULT='ॐ नमः शिवाय';
export default function MantraScreen(){
 const c=useColors();
 const [mantra,setMantra]=useState(DEFAULT);
 const [reps,setReps]=useState(11);
 const [running,setRunning]=useState(false);
 const [spoken,setSpoken]=useState(0);
 const [loading,setLoading]=useState<string|null>(null);
 const [selected,setSelected]=useState<RemoteMantraAudio|null>(null);
 const [message,setMessage]=useState('');
 const player=useAudioPlayer(null);
 useEffect(()=>()=>{Speech.stop();try{player.pause()}catch{}},[player]);
 const stop=async()=>{
   Speech.stop();
   setRunning(false);
   try{player.pause()}catch{}
 };
 const playAudio=async(item:RemoteMantraAudio)=>{
   await stop(); setLoading(item.id); setMessage('');
   try{
     const resolved={...item,url:resolveMantraAudioUrl(item.id+'.ogg',item.url)};
     const uri=await getCachedMantraAudio(resolved);
     player.replace(uri);
     player.seekTo(0);
     player.play();
     setSelected(item);
     setMessage('Audio is downloaded to this device and reused from local cache next time.');
   }catch(error){setMessage(error instanceof Error?error.message:'Unable to play mantra audio.')}
   finally{setLoading(null)}
 };
 return <View style={[s.root,{backgroundColor:c.background}]}>
  <Stack.Screen options={{title:'Mantra Player'}}/>
  <View style={s.content}>
   <Text accessibilityRole="header" style={[s.title,{color:c.foreground}]}>Mantra Player</Text>
   <Text style={[s.sub,{color:c.mutedForeground}]}>Use device speech or download a licensed mantra recording. Audio is cached locally after the first download.</Text>
   <TextInput accessibilityLabel="Mantra text" value={mantra} onChangeText={setMantra} style={[s.input,{borderColor:c.border,color:c.foreground,backgroundColor:c.card}]}/>
   <View style={s.row}>{[11,27,108].map(n=><Pressable key={n} onPress={()=>{Speech.stop();setReps(n);setSpoken(0);setRunning(false)}} style={[s.chip,{borderColor:c.border,backgroundColor:reps===n?c.secondary:c.card}]}><Text style={{color:c.foreground,fontFamily:'Inter_700Bold'}}>{n} reps</Text></Pressable>)}</View>
   <Text accessibilityLiveRegion="polite" style={[s.progress,{color:c.foreground}]}>{spoken} / {reps}</Text>
   <Pressable accessibilityRole="button" onPress={()=>{Speech.stop();setSpoken(0);setRunning(!running)}} style={[s.primary,{backgroundColor:c.primary}]}><Text style={{color:c.primaryForeground,fontFamily:'Inter_700Bold'}}>{running?'Stop':'Speak Mantra'}</Text></Pressable>
   <Text style={[s.section,{color:c.foreground}]}>Licensed audio</Text>
   {REMOTE_MANTRA_AUDIO.map(item=><Pressable key={item.id} accessibilityRole="button" onPress={()=>void playAudio(item)} style={[s.audioCard,{backgroundColor:c.card,borderColor:c.border}]}><View style={s.audioCopy}><Text style={[s.audioTitle,{color:c.foreground}]}>{item.title}</Text><Text style={[s.audioMeta,{color:c.mutedForeground}]}>{item.license} • {item.attribution}</Text></View><Text style={{color:c.primary,fontFamily:'Inter_700Bold'}}>{loading===item.id?'Downloading…':selected?.id===item.id?'Play again':'Download & Play'}</Text></Pressable>)}
   {message ? <Text accessibilityRole="status" style={[s.message,{color:c.mutedForeground}]}>{message}</Text>:null}
   <Pressable accessibilityRole="button" onPress={()=>void stop()} style={[s.secondary,{borderColor:c.border}]}><Text style={{color:c.foreground}}>Stop Audio / Speech</Text></Pressable>
  </View>
 </View>
}
const s=StyleSheet.create({root:{flex:1},content:{padding:18,flex:1},title:{fontSize:28,fontFamily:'Inter_700Bold',marginBottom:6},sub:{fontSize:12,lineHeight:18,marginBottom:16},input:{minHeight:54,borderWidth:1,borderRadius:15,paddingHorizontal:14,fontSize:18,textAlign:'center'},row:{flexDirection:'row',gap:8,justifyContent:'center',marginTop:12,marginBottom:12},chip:{paddingHorizontal:13,paddingVertical:10,borderWidth:1,borderRadius:13},progress:{textAlign:'center',fontSize:26,fontFamily:'Inter_700Bold',marginBottom:12},primary:{height:50,borderRadius:15,alignItems:'center',justifyContent:'center'},section:{fontSize:16,fontFamily:'Inter_700Bold',marginTop:22,marginBottom:10},audioCard:{borderWidth:1,borderRadius:16,padding:13,marginBottom:9,flexDirection:'row',alignItems:'center'},audioCopy:{flex:1,marginRight:10},audioTitle:{fontSize:13,fontFamily:'Inter_700Bold',marginBottom:3},audioMeta:{fontSize:10,lineHeight:15},message:{fontSize:11,lineHeight:16,marginTop:8},secondary:{height:48,borderWidth:1,borderRadius:15,alignItems:'center',justifyContent:'center',marginTop:10}});
