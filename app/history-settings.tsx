import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getHistorySettings, setHistorySettings, type HistorySettings } from '@/features/history/historySettings';

export default function HistorySettingsScreen() {
  const colors=useColors(); const router=useRouter(); const insets=useSafeAreaInsets();
  const [prefs,setPrefs]=useState<HistorySettings>({video:true,assistant:true});
  useEffect(()=>{void getHistorySettings().then(setPrefs);},[]);
  const update=async(next:HistorySettings)=>{setPrefs(next);await setHistorySettings(next);};
  return <ScrollView style={[styles.root,{backgroundColor:colors.background}]} contentContainerStyle={{padding:18,paddingTop:insets.top+10,paddingBottom:insets.bottom+28}}>
    <Stack.Screen options={{headerShown:false}}/>
    <View style={styles.header}><Pressable accessibilityRole='button' accessibilityLabel='Back' onPress={()=>router.back()} style={[styles.back,{backgroundColor:colors.card,borderColor:colors.border}]}><Feather name='arrow-left' size={20} color={colors.foreground}/></Pressable><View style={styles.copy}><Text accessibilityRole='header' style={[styles.title,{color:colors.foreground}]}>History Settings</Text><Text style={[styles.subtitle,{color:colors.mutedForeground}]}>Manage saved history from one place.</Text></View></View>
    <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}>
      <Text style={[styles.section,{color:colors.foreground}]}>Saved History</Text>
      <Pressable accessibilityRole='switch' accessibilityState={{checked:prefs.video}} onPress={()=>void update({...prefs,video:!prefs.video})} style={[styles.row,{borderColor:colors.border,backgroundColor:colors.background}]}><Feather name='video' size={18} color={colors.primary}/><View style={styles.copy}><Text style={[styles.name,{color:colors.foreground}]}>Video Generator History</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>Save generated videos in local history.</Text></View><Text style={[styles.state,{color:colors.primary}]}>{prefs.video?'On':'Off'}</Text></Pressable>
      <Pressable accessibilityRole='switch' accessibilityState={{checked:prefs.assistant}} onPress={()=>void update({...prefs,assistant:!prefs.assistant})} style={[styles.row,{borderColor:colors.border,backgroundColor:colors.background}]}><Feather name='message-circle' size={18} color={colors.primary}/><View style={styles.copy}><Text style={[styles.name,{color:colors.foreground}]}>Nexus Assistant History</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>Save Assistant conversations in local history.</Text></View><Text style={[styles.state,{color:colors.primary}]}>{prefs.assistant?'On':'Off'}</Text></Pressable>
    </View>
    <Text style={[styles.note,{color:colors.mutedForeground}]}>Feature-specific history controls can still be managed from their own settings. These switches provide a central control point.</Text>
  </ScrollView>;
}
const styles=StyleSheet.create({root:{flex:1},header:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:14},back:{width:44,height:44,borderRadius:13,borderWidth:1,alignItems:'center',justifyContent:'center'},copy:{flex:1},title:{fontSize:24,fontFamily:'Inter_700Bold'},subtitle:{fontSize:10.8,lineHeight:16,marginTop:3},card:{borderWidth:1,borderRadius:18,padding:14},section:{fontSize:15,fontFamily:'Inter_700Bold',marginBottom:8},row:{minHeight:74,borderWidth:1,borderRadius:14,padding:11,flexDirection:'row',alignItems:'center',marginTop:8},name:{fontSize:12.5,fontFamily:'Inter_700Bold'},body:{fontSize:10.5,lineHeight:16,marginTop:3},state:{fontSize:11,fontFamily:'Inter_700Bold'},note:{fontSize:10.5,lineHeight:16,marginTop:12}});
