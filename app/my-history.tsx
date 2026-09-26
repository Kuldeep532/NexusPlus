import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { clearAllAssistantData, initAssistantStore, listAllHistory, listSessionMessages, deleteSession, type ChatMessage } from '@/features/nexus-assistant/assistantStore';

type HistoryItem = { id:string; title:string; createdAt:number; messageCount:number };

export default function MyHistoryScreen() {
  const colors=useColors();
  const router=useRouter();
  const insets=useSafeAreaInsets();
  const [items,setItems]=useState<HistoryItem[]>([]);
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState<HistoryItem|null>(null);
  const [messages,setMessages]=useState<ChatMessage[]>([]);
  const [deleting,setDeleting]=useState(false);

  const load=useCallback(async()=>{
    setLoading(true);
    try {
      await initAssistantStore();
      setItems(await listAllHistory());
    } finally { setLoading(false); }
  },[]);

  useEffect(()=>{void load();},[load]);

  const openHistory=async(item:HistoryItem)=>{
    setSelected(item);
    setMessages(await listSessionMessages(item.id));
  };

  const deleteAll=async()=>{
    setDeleting(true);
    try {
      await clearAllAssistantData();
      setSelected(null);
      setMessages([]);
      setItems([]);
    } finally { setDeleting(false); }
  };

  const deleteOne=async(item:HistoryItem)=>{
    await deleteSession(item.id);
    if(selected?.id===item.id){setSelected(null);setMessages([]);}
    await load();
  };

  return <ScrollView style={[styles.root,{backgroundColor:colors.background}]} contentContainerStyle={{padding:18,paddingTop:insets.top+10,paddingBottom:insets.bottom+30}}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={()=>router.back()} style={[styles.iconButton,{backgroundColor:colors.card,borderColor:colors.border}]}><Feather name="arrow-left" size={20} color={colors.foreground}/></Pressable>
      <View style={styles.copy}><Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>My History</Text><Text style={[styles.subtitle,{color:colors.mutedForeground}]}>All saved Nexus Assistant conversations.</Text></View>
    </View>

    <Pressable accessibilityRole="button" accessibilityLabel="Delete all history" disabled={deleting||loading||!items.length} onPress={()=>void deleteAll()} style={[styles.deleteAll,{backgroundColor:deleting||!items.length?colors.muted:colors.destructive}]}>
      {deleting?<ActivityIndicator color={colors.primaryForeground}/>:<Feather name="trash-2" size={18} color={colors.primaryForeground}/>}
      <Text style={[styles.deleteText,{color:colors.primaryForeground}]}>{deleting?'Deleting…':'Delete All History'}</Text>
    </Pressable>

    {loading?<ActivityIndicator color={colors.primary} style={{marginTop:20}}/>:!items.length?
      <View style={[styles.empty,{backgroundColor:colors.card,borderColor:colors.border}]}><Feather name="clock" size={24} color={colors.primary}/><Text style={[styles.emptyTitle,{color:colors.foreground}]}>No history yet</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>New Nexus Assistant conversations will appear here.</Text></View>
      :
      <View style={styles.list}>{items.map(item=><Pressable key={item.id} accessibilityRole="button" onPress={()=>void openHistory(item)} style={[styles.row,{backgroundColor:selected?.id===item.id?colors.secondary:colors.card,borderColor:selected?.id===item.id?colors.primary:colors.border}]}>
        <View style={[styles.iconWrap,{backgroundColor:colors.secondary}]}><Feather name="message-circle" size={18} color={colors.primary}/></View>
        <View style={styles.copy}><Text style={[styles.rowTitle,{color:colors.foreground}]}>{item.title}</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>{item.messageCount} messages • {new Date(item.createdAt).toLocaleString()}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={'Delete '+item.title} onPress={(event)=>{event.stopPropagation();void deleteOne(item);}} style={styles.smallDelete}><Feather name="trash-2" size={17} color={colors.destructive}/></Pressable>
      </Pressable>)}</View>
    }

    {selected&&<View style={[styles.detail,{backgroundColor:colors.card,borderColor:colors.border}]}>
      <View style={styles.detailHeader}><View style={styles.copy}><Text style={[styles.detailTitle,{color:colors.foreground}]}>{selected.title}</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>{messages.length} messages</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close history" onPress={()=>{setSelected(null);setMessages([]);}} style={[styles.iconButton,{backgroundColor:colors.background,borderColor:colors.border}]}><Feather name="x" size={18} color={colors.foreground}/></Pressable></View>
      {messages.map(message=><View key={message.id} style={[styles.message,{backgroundColor:message.role==='user'?colors.secondary:colors.background,borderColor:colors.border}]}><Text style={[styles.role,{color:colors.foreground}]}>{message.role==='user'?'You':message.role==='assistant'?'Nexus Assistant':'System'}</Text><Text selectable style={[styles.body,{color:colors.foreground}]}>{message.content}</Text></View>)}
    </View>}
  </ScrollView>;
}

const styles=StyleSheet.create({
  root:{flex:1},header:{flexDirection:'row',alignItems:'center',marginBottom:14},iconButton:{width:44,height:44,borderRadius:13,borderWidth:1,alignItems:'center',justifyContent:'center'},copy:{flex:1,marginLeft:12},title:{fontSize:25,fontFamily:'Inter_700Bold'},subtitle:{fontSize:10.5,lineHeight:16,marginTop:3},deleteAll:{minHeight:52,borderRadius:15,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},deleteText:{fontSize:12,fontFamily:'Inter_700Bold'},list:{gap:9,marginTop:12},row:{minHeight:72,borderWidth:1,borderRadius:15,padding:11,flexDirection:'row',alignItems:'center'},iconWrap:{width:42,height:42,borderRadius:12,alignItems:'center',justifyContent:'center'},rowTitle:{fontSize:12.5,fontFamily:'Inter_700Bold'},body:{fontSize:10.5,lineHeight:16,marginTop:3},smallDelete:{width:38,height:38,alignItems:'center',justifyContent:'center'},empty:{borderWidth:1,borderRadius:16,padding:18,alignItems:'center',marginTop:12},emptyTitle:{fontSize:14,fontFamily:'Inter_700Bold',marginTop:8},detail:{borderWidth:1,borderRadius:16,padding:13,marginTop:14},detailHeader:{flexDirection:'row',alignItems:'center',marginBottom:8},detailTitle:{fontSize:14,fontFamily:'Inter_700Bold'},message:{borderWidth:1,borderRadius:13,padding:10,marginTop:8},role:{fontSize:9.5,fontFamily:'Inter_700Bold',marginBottom:4}
});