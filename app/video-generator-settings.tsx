import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { clearVideoHistory, deleteVideoHistoryItem, listVideoHistory, type VideoHistoryItem } from '@/features/video-generator/runwayVideoGenerator';

export default function VideoGeneratorSettingsScreen() {
  const colors=useColors(); const router=useRouter(); const insets=useSafeAreaInsets();
  const [items,setItems]=useState<VideoHistoryItem[]>([]);
  const [loading,setLoading]=useState(true);
  const load=useCallback(async()=>{setLoading(true);try{setItems(await listVideoHistory());}finally{setLoading(false);}},[]);
  useEffect(()=>{void load();},[load]);
  const remove=async(id:string)=>{await deleteVideoHistoryItem(id);await load();};
  const removeAll=async()=>{if(!items.length)return;Alert.alert('Clear video history','Delete all locally saved generated-video history?',[
    {text:'Cancel',style:'cancel'},
    {text:'Delete',style:'destructive',onPress:async()=>{await clearVideoHistory();setItems([]);}},
  ]);};
  return <ScrollView style={[styles.root,{backgroundColor:colors.background}]} contentContainerStyle={{padding:18,paddingTop:insets.top+10,paddingBottom:insets.bottom+28}}>
    <Stack.Screen options={{headerShown:false}}/>
    <View style={styles.header}><Pressable accessibilityRole='button' accessibilityLabel='Back' onPress={()=>router.back()} style={[styles.back,{backgroundColor:colors.card,borderColor:colors.border}]}><Feather name='arrow-left' size={20} color={colors.foreground}/></Pressable><View style={styles.copy}><Text accessibilityRole='header' style={[styles.title,{color:colors.foreground}]}>Video Generator Settings</Text><Text style={[styles.subtitle,{color:colors.mutedForeground}]}>Manage generated-video history stored on this device.</Text></View></View>
    <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}>
      <Text style={[styles.section,{color:colors.foreground}]}>Local History</Text>
      <Text style={[styles.body,{color:colors.mutedForeground}]}>Generated videos are listed here. You can also manage the same history from History Settings.</Text>
      <Pressable accessibilityRole='button' disabled={!items.length} onPress={()=>void removeAll()} style={[styles.danger,{backgroundColor:items.length?colors.destructive:colors.muted}]}>
        <Feather name='trash-2' size={17} color={colors.primaryForeground}/><Text style={[styles.dangerText,{color:colors.primaryForeground}]}>Clear Video History</Text>
      </Pressable>
    </View>
    {loading?<ActivityIndicator color={colors.primary} style={{marginTop:20}}/>:items.length===0?
      <View style={[styles.empty,{backgroundColor:colors.card,borderColor:colors.border}]}><Feather name='video' size={24} color={colors.primary}/><Text style={[styles.emptyTitle,{color:colors.foreground}]}>No saved videos</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>Generated videos will appear here after you create them.</Text></View>
      :<View style={styles.list}>{items.map(item=><View key={item.id} style={[styles.row,{backgroundColor:colors.card,borderColor:colors.border}]}><View style={[styles.icon,{backgroundColor:colors.secondary}]}><Feather name='video' size={18} color={colors.primary}/></View><View style={styles.copy}><Text style={[styles.rowTitle,{color:colors.foreground}]} numberOfLines={2}>{item.prompt}</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>{new Date(item.createdAt).toLocaleString()}</Text></View><Pressable accessibilityRole='button' accessibilityLabel='Delete video history item' onPress={()=>void remove(item.id)} style={styles.delete}><Feather name='trash-2' size={17} color={colors.destructive}/></Pressable></View>)}</View>}
  </ScrollView>;
}
const styles=StyleSheet.create({root:{flex:1},header:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:14},back:{width:44,height:44,borderRadius:13,borderWidth:1,alignItems:'center',justifyContent:'center'},copy:{flex:1},title:{fontSize:24,fontFamily:'Inter_700Bold'},subtitle:{fontSize:10.8,lineHeight:16,marginTop:3},card:{borderWidth:1,borderRadius:18,padding:14,marginBottom:12},section:{fontSize:15,fontFamily:'Inter_700Bold',marginBottom:7},body:{fontSize:10.5,lineHeight:16,marginTop:3},danger:{minHeight:48,borderRadius:13,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginTop:12},dangerText:{fontSize:11.5,fontFamily:'Inter_700Bold'},list:{gap:9},row:{minHeight:72,borderWidth:1,borderRadius:15,padding:11,flexDirection:'row',alignItems:'center'},icon:{width:42,height:42,borderRadius:12,alignItems:'center',justifyContent:'center'},rowTitle:{fontSize:12,fontFamily:'Inter_700Bold'},delete:{width:40,height:40,alignItems:'center',justifyContent:'center'},empty:{borderWidth:1,borderRadius:16,padding:18,alignItems:'center',marginTop:4},emptyTitle:{fontSize:14,fontFamily:'Inter_700Bold',marginTop:8}});
