import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { getDocumentRecord } from '@/features/document-studio/documentStore';
import { ensureDocumentText } from '@/features/document-studio/documentText';
import { getLocalInferenceEngine } from '@/features/nexus-assistant/localInference';

function fallbackSummary(text:string):string{
 const sentences=text.replace(/\s+/g,' ').trim().split(/(?<=[.!?।])\s+/).filter(Boolean);
 if(sentences.length<=5)return sentences.join(' ');
 const lead=sentences.slice(0,3).join(' '), tail=sentences.slice(-2).join(' ');
 return lead+' '+tail;
}
export default function DocumentSummarizerScreen(){
 const colors=useColors(),router=useRouter(),params=useLocalSearchParams<{documentId?:string}>(); const [doc,setDoc]=useState<any>(null),[summary,setSummary]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{(async()=>{if(!params.documentId)return;const d=await getDocumentRecord(String(params.documentId));if(!d)return;setDoc(d);setBusy(true);try{const text=await ensureDocumentText(d),engine=await getLocalInferenceEngine();let result=fallbackSummary(text);if(await engine.isAvailable()){await engine.loadModel('document-summarizer','');let out='';try{await engine.stream([{role:'system',content:'Summarize the provided document accurately. Do not invent facts. Return a concise summary in plain text.'},{role:'user',content:text.slice(0,50000)}],{modelId:'document-summarizer',maxTokens:320,temperature:0.1,contextSize:2048},c=>{if(c.type==='token')out+=c.text});if(out.trim())result=out.trim()}finally{await engine.unloadModel()}}setSummary(result)}catch(e){setStatus(e instanceof Error?e.message:'Unable to summarize document.')}finally{setBusy(false)}})()},[params.documentId]);
 return <View style={[styles.root,{backgroundColor:colors.background}]}><Stack.Screen options={{title:'Document Summarizer'}}/><ScrollView contentContainerStyle={styles.content}><Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>{doc?.title||'Document Summarizer'}</Text><Text style={[styles.subtitle,{color:colors.mutedForeground}]}>Summary generated from the document text. The app never claims success when an engine is unavailable.</Text>{busy?<ActivityIndicator color={colors.primary}/>:<Text selectable style={[styles.summary,{color:colors.foreground}]}>{summary||status}</Text>} {doc&&<View style={styles.actions}><Pressable onPress={()=>router.push({pathname:'/document-reader',params:{documentId:doc.id}})} style={styles.action}><Feather name="book-open" size={17} color={colors.primary}/><Text style={{color:colors.foreground}}>Read</Text></Pressable></View>}</ScrollView></View>}
const styles=StyleSheet.create({root:{flex:1},content:{padding:20},title:{fontSize:26,fontFamily:'Inter_700Bold'},subtitle:{fontSize:12,lineHeight:18,marginTop:5,marginBottom:16},summary:{fontSize:14,lineHeight:22},actions:{marginTop:18},action:{minHeight:46,borderWidth:1,borderColor:'#888',borderRadius:12,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:7}});
