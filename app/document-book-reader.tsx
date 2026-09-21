import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { getDocumentRecord } from '@/features/document-studio/documentStore';
import { ensureDocumentText } from '@/features/document-studio/documentText';
import { synthesizeReaderText } from '@/features/document-reader/readerSpeech';
import { playGeneratedAudio } from '@/features/audio-editor/ttsEngine';

export default function DocumentBookReaderScreen(){
 const colors=useColors(),params=useLocalSearchParams<{documentId?:string}>();
 const [doc,setDoc]=useState<any>(null),[text,setText]=useState(''),[playing,setPlaying]=useState(false),[stop,setStop]=useState<(()=>void)|null>(null),[status,setStatus]=useState('');
 useEffect(()=>{(async()=>{if(!params.documentId)return;const d=await getDocumentRecord(String(params.documentId));if(!d)return;setDoc(d);try{setText((await ensureDocumentText(d)).slice(0,60000))}catch(e){setStatus(e instanceof Error?e.message:'Unable to load document text.')}})()},[params.documentId]);
 const toggle=async()=>{if(playing){stop?.();setStop(null);setPlaying(false);return;}if(!text){setStatus('No text is available to read.');return;}try{const gen=await synthesizeReaderText(text.slice(0,12000),undefined,{speed:1,pitch:1,autoTune:true});const fn=await playGeneratedAudio(gen.outputUri);setStop(()=>fn);setPlaying(true)}catch(e){setStatus(e instanceof Error?e.message:'Voice reading failed.')}}
 return <View style={[styles.root,{backgroundColor:colors.background}]}><Stack.Screen options={{title:'Book Reader'}}/><ScrollView contentContainerStyle={styles.content}><Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>{doc?.title||'Book Reader'}</Text><Text style={[styles.subtitle,{color:colors.mutedForeground}]}>Accessible read-aloud mode using the existing Nexus voice engine.</Text><Pressable onPress={()=>void toggle()} style={[styles.play,{backgroundColor:colors.primary}]}><Feather name={playing?'pause':'play'} size={20} color={colors.primaryForeground}/><Text style={{color:colors.primaryForeground,fontFamily:'Inter_700Bold'}}>{playing?'Stop Reading':'Read Aloud'}</Text></Pressable><Text selectable style={[styles.text,{color:colors.foreground}]}>{text||status}</Text></ScrollView></View>}
const styles=StyleSheet.create({root:{flex:1},content:{padding:20},title:{fontSize:27,fontFamily:'Inter_700Bold'},subtitle:{fontSize:12,lineHeight:18,marginTop:5},play:{minHeight:52,borderRadius:15,marginTop:16,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},text:{fontSize:14,lineHeight:23,marginTop:18}});
