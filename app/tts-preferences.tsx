import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { listTtsVoices, type TtsVoiceOption } from '@/features/audio-editor/ttsEngine';
import { listElevenLabsVoices, type ElevenLabsVoice } from '@/features/audio-editor/elevenLabsTts';
import { readTtsVoicePreferences, saveTtsVoicePreferences, type TtsVoiceProvider } from '@/features/audio-editor/ttsPreferences';

const PROVIDERS = [
 {id:'system',title:'System TTS',description:'Use the voice engine already available on your Android device.'},
 {id:'piper',title:'Nexus Piper',description:'Use a downloaded Nexus voice locally on the device.'},
 {id:'clone',title:'Nexus Clone Voice',description:'Use an installed compatible clone voice locally.'},
 {id:'elevenlabs',title:'ElevenLabs',description:'Premium voice generation billed through Nexus credits.',premium:true},
] as const;

function localChoices(provider:'system'|'piper'|'clone',voices:TtsVoiceOption[]) {
 return voices.filter((voice:any)=>voice.provider===provider && (voice.provider==='system'||voice.installed));
}

export default function TtsPreferencesScreen() {
 const colors=useColors(); const insets=useSafeAreaInsets(); const router=useRouter();
 const [provider,setProvider]=useState<TtsVoiceProvider>('system');
 const [voiceId,setVoiceId]=useState(''); const [voiceName,setVoiceName]=useState('System voice'); const [language,setLanguage]=useState('');
 const [localVoices,setLocalVoices]=useState<TtsVoiceOption[]>([]); const [elevenVoices,setElevenVoices]=useState<ElevenLabsVoice[]>([]);
 const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [status,setStatus]=useState('');

 useEffect(()=>{void (async()=>{try{const prefs=await readTtsVoicePreferences();setProvider(prefs.provider);setVoiceId(prefs.voiceId);setVoiceName(prefs.voiceName);setLanguage(prefs.language);const voices=await listTtsVoices();setLocalVoices(voices);if(prefs.provider==='elevenlabs'){try{setElevenVoices(await listElevenLabsVoices());}catch(error){setStatus(error instanceof Error?error.message:'ElevenLabs voices could not be loaded.');}}}catch(error){setStatus(error instanceof Error?error.message:'Voice preferences could not be loaded.');}finally{setLoading(false);}})();},[]);
 useEffect(()=>{if(provider==='elevenlabs'&&elevenVoices.length===0){void listElevenLabsVoices().then(setElevenVoices).catch(error=>setStatus(error instanceof Error?error.message:'ElevenLabs voices could not be loaded.'));}},[provider,elevenVoices.length]);
 const choices=useMemo(()=>provider==='elevenlabs'?elevenVoices:localChoices(provider,localVoices),[provider,localVoices,elevenVoices]);
 const selectVoice=(item:any)=>{setVoiceId(item.id);setVoiceName(String(item.name||item.id));setLanguage(String(item.language||''));};
 const save=async()=>{if(provider!=='system'&&!voiceId){setStatus('Select a voice before saving.');return;}setSaving(true);try{await saveTtsVoicePreferences({provider,voiceId,voiceName,language});router.back();}catch(error){setStatus(error instanceof Error?error.message:'Voice preferences could not be saved.');}finally{setSaving(false);}};

 return <ScrollView style={[styles.root,{backgroundColor:colors.background}]} contentContainerStyle={{padding:18,paddingTop:insets.top+12,paddingBottom:insets.bottom+32}}>
  <Stack.Screen options={{title:'Voice Preferences'}}/>
  <View style={styles.header}><Pressable accessibilityRole='button' accessibilityLabel='Back to Text to Speech' onPress={()=>router.back()} style={[styles.back,{borderColor:colors.border,backgroundColor:colors.card}]}><Feather name='arrow-left' size={19} color={colors.foreground}/></Pressable><View style={styles.copy}><Text accessibilityRole='header' style={[styles.title,{color:colors.foreground}]}>Voice Preferences</Text><Text style={[styles.subtitle,{color:colors.mutedForeground}]}>Preferences: Select Voice Provider, Select Voice, Save.</Text></View></View>
  <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={[styles.section,{color:colors.foreground}]}>Preferences</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>Choose the provider that Text to Speech should use by default.</Text><View style={styles.list}>{PROVIDERS.map(option=><Pressable key={option.id} accessibilityRole='radio' accessibilityState={{selected:provider===option.id}} accessibilityLabel={option.title+'. '+option.description} onPress={()=>{setProvider(option.id);setVoiceId('');setVoiceName(option.title);setLanguage('');}} style={[styles.provider,{borderColor:provider===option.id?colors.primary:colors.border,backgroundColor:provider===option.id?colors.secondary:colors.background}]}><View style={[styles.radio,{borderColor:provider===option.id?colors.primary:colors.mutedForeground}]}>{provider===option.id?<View style={[styles.dot,{backgroundColor:colors.primary}]}/>:null}</View><View style={styles.copy}><Text style={[styles.rowTitle,{color:colors.foreground}]}>{option.title}{option.premium?' • Premium / Credits':''}</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>{option.description}</Text></View></Pressable>)}</View></View>
  <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={[styles.section,{color:colors.foreground}]}>Select Voice</Text>{loading?<ActivityIndicator color={colors.primary}/>:choices.length?<View style={styles.list}>{choices.map((item:any)=><Pressable key={item.id} accessibilityRole='radio' accessibilityState={{selected:voiceId===item.id}} accessibilityLabel={String(item.name||item.id)} onPress={()=>selectVoice(item)} style={[styles.voice,{borderColor:voiceId===item.id?colors.primary:colors.border,backgroundColor:voiceId===item.id?colors.secondary:colors.background}]}><Feather name={provider==='elevenlabs'?'cloud':'volume-2'} size={18} color={colors.primary}/><View style={styles.copy}><Text style={[styles.rowTitle,{color:colors.foreground}]}>{item.name||item.id}</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>{item.language||'Language not specified'}{item.gender?' • '+item.gender:''}{provider==='elevenlabs'&&item.category?' • '+item.category:''}</Text></View>{voiceId===item.id?<Feather name='check-circle' size={18} color={colors.primary}/>:null}</Pressable>)}</View>:<Text style={[styles.body,{color:colors.mutedForeground}]}>No voices are currently available for this provider.</Text>}{!!voiceId&&<Text selectable style={[styles.selected,{color:colors.mutedForeground}]}>Selected: {voiceName}{language?' • '+language:''}</Text>}</View>
  <Pressable disabled={saving||loading} accessibilityRole='button' onPress={()=>void save()} style={[styles.save,{backgroundColor:saving||loading?colors.muted:colors.primary}]}>{saving?<ActivityIndicator color={colors.primaryForeground}/>:<Feather name='check' size={18} color={colors.primaryForeground}/>}<Text style={[styles.saveText,{color:colors.primaryForeground}]}>{saving?'Saving…':'Save'}</Text></Pressable>
  {!!status&&<Text accessibilityLiveRegion='polite' style={[styles.status,{color:colors.mutedForeground}]}>{status}</Text>}
 </ScrollView>;
}

const styles=StyleSheet.create({root:{flex:1},header:{flexDirection:'row',alignItems:'center',marginBottom:16},back:{width:44,height:44,borderRadius:13,borderWidth:1,alignItems:'center',justifyContent:'center'},copy:{flex:1,marginLeft:12},title:{fontSize:24,fontFamily:'Inter_700Bold'},subtitle:{fontSize:10.5,lineHeight:16,marginTop:4},card:{borderWidth:1,borderRadius:18,padding:14,marginBottom:12},section:{fontSize:14,fontFamily:'Inter_700Bold',marginBottom:5},body:{fontSize:10.8,lineHeight:16},list:{gap:8,marginTop:9},provider:{minHeight:70,borderWidth:1,borderRadius:14,padding:11,flexDirection:'row',alignItems:'center'},radio:{width:22,height:22,borderRadius:11,borderWidth:2,alignItems:'center',justifyContent:'center'},dot:{width:10,height:10,borderRadius:5},rowTitle:{fontSize:12,fontFamily:'Inter_700Bold',marginBottom:3},voice:{minHeight:62,borderWidth:1,borderRadius:14,paddingHorizontal:11,paddingVertical:9,flexDirection:'row',alignItems:'center'},selected:{fontSize:10.5,marginTop:10},save:{minHeight:52,borderRadius:16,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},saveText:{fontSize:13,fontFamily:'Inter_700Bold'},status:{fontSize:10.5,lineHeight:16,marginTop:11}});