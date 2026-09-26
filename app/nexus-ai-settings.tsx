import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getAssistantModelPreference, setAssistantModelPreference, type AssistantModelId } from '@/features/nexus-assistant/aiModelPreferences';

const MODELS = [
  {id:'gemini',name:'Gemini',cost:'1 credit'},
  {id:'openai',name:'OpenAI',cost:'4 credits'},
  {id:'anthropic',name:'Claude',cost:'6 credits'},
] as const;

export default function NexusAiSettingsScreen(){
 const colors=useColors(); const router=useRouter(); const insets=useSafeAreaInsets();
 const [selected,setSelected]=useState<AssistantModelId>('gemini');
 useEffect(()=>{void getAssistantModelPreference().then(p=>setSelected(p.selectedModel));},[]);
 const choose=async(model:AssistantModelId)=>{setSelected(model);await setAssistantModelPreference(model);};
 return <ScrollView style={[styles.root,{backgroundColor:colors.background}]} contentContainerStyle={{padding:18,paddingTop:insets.top+10,paddingBottom:insets.bottom+30}}>
  <Stack.Screen options={{title:'AI Settings'}}/>
  <View style={styles.header}><Pressable accessibilityRole='button' accessibilityLabel='Back' onPress={()=>router.back()} style={[styles.back,{backgroundColor:colors.card,borderColor:colors.border}]}><Feather name='arrow-left' size={19} color={colors.foreground}/></Pressable><View style={styles.copy}><Text accessibilityRole='header' style={[styles.title,{color:colors.foreground}]}>AI Settings</Text><Text style={[styles.subtitle,{color:colors.mutedForeground}]}>Choose the model used by Nexus Assistant.</Text></View></View>
  <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}><Text style={[styles.section,{color:colors.foreground}]}>Select Model</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>Cloud AI models use Nexus credits. Local Nexus Core AI remains free and on-device.</Text><View style={styles.list}>{MODELS.map(model=><Pressable key={model.id} accessibilityRole='radio' accessibilityState={{selected:selected===model.id}} onPress={()=>void choose(model.id)} style={[styles.item,{borderColor:selected===model.id?colors.primary:colors.border,backgroundColor:selected===model.id?colors.secondary:colors.background}]}><View style={[styles.radio,{borderColor:selected===model.id?colors.primary:colors.mutedForeground}]}>{selected===model.id?<View style={[styles.dot,{backgroundColor:colors.primary}]}/>:null}</View><View style={styles.copy}><Text style={[styles.name,{color:colors.foreground}]}>{model.name}</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>{model.cost} per cloud request</Text></View>{selected===model.id?<Feather name='check-circle' size={18} color={colors.primary}/>:null}</Pressable>)}</View></View>
  <Pressable accessibilityRole='button' onPress={()=>router.push('/tts-preferences')} style={[styles.cardButton,{backgroundColor:colors.card,borderColor:colors.border}]}><Feather name='volume-2' size={19} color={colors.primary}/><View style={styles.copy}><Text style={[styles.name,{color:colors.foreground}]}>Reminder Voice</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>Choose Local TTS or ElevenLabs voice preferences.</Text></View><Feather name='chevron-right' size={18} color={colors.mutedForeground}/></Pressable>
  <Pressable accessibilityRole='button' onPress={()=>router.push('/my-history')} style={[styles.cardButton,{backgroundColor:colors.card,borderColor:colors.border}]}><Feather name='clock' size={19} color={colors.primary}/><View style={styles.copy}><Text style={[styles.name,{color:colors.foreground}]}>My History</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>Open all saved Nexus Assistant conversations.</Text></View><Feather name='chevron-right' size={18} color={colors.mutedForeground}/></Pressable>
 </ScrollView>;
}

const styles=StyleSheet.create({root:{flex:1},header:{flexDirection:'row',alignItems:'center',marginBottom:14},back:{width:44,height:44,borderRadius:13,borderWidth:1,alignItems:'center',justifyContent:'center'},copy:{flex:1,marginLeft:12},title:{fontSize:25,fontFamily:'Inter_700Bold'},subtitle:{fontSize:10.5,lineHeight:16,marginTop:3},card:{borderWidth:1,borderRadius:18,padding:14,marginBottom:12},section:{fontSize:15,fontFamily:'Inter_700Bold',marginBottom:6},body:{fontSize:10.8,lineHeight:16},list:{gap:8,marginTop:10},item:{minHeight:68,borderWidth:1,borderRadius:14,padding:11,flexDirection:'row',alignItems:'center'},radio:{width:22,height:22,borderRadius:11,borderWidth:2,alignItems:'center',justifyContent:'center'},dot:{width:10,height:10,borderRadius:5},name:{fontSize:12.5,fontFamily:'Inter_700Bold'},cardButton:{minHeight:66,borderWidth:1,borderRadius:15,padding:12,flexDirection:'row',alignItems:'center',gap:10}});